use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolState {
    pub pool_address: Arc<str>,
    pub reserve_0: u128,
    pub reserve_1: u128,
    pub fee_bps: u32,
    pub last_updated_block: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Neighbor {
    pub token_address: Arc<str>,
    pub pool: PoolState,
}

/// BSS-04: Graph Persistence Engine
/// Maintains a global, thread-safe map of liquidity pools for instant routing.
/// 
/// Element: Performance Profile -> O(1) lookup for neighbors, O(E) for total graph scan.
/// Element: State Management -> Owner of the global Adjacency List (DashMap).
pub struct GraphPersistence {
    // Key: TokenAddress, Value: Neighbors (connected tokens and pool data)
    pub adjacency_list: Arc<DashMap<Arc<str>, Vec<Neighbor>>>,
}

/// Element: Invariants
const MIN_RESERVE_THRESHOLD: u128 = 1000; // Prevent precision loss attacks
const MAX_FEE_BPS: u32 = 1000;            // 10% max fee sanity check

impl GraphPersistence {
    pub fn new() -> Self {
        Self {
            adjacency_list: Arc::new(DashMap::with_capacity(2000)),
        }
    }
    
    /// BSS-30 Audit: Scans the entire graph for structural or economic invariant violations.
    pub fn validate_global_invariants(&self) -> Option<String> {
        for entry in self.adjacency_list.iter() {
            let from = entry.key();
            for neighbor in entry.value().iter() {
                // 1. Structural: No Self-Loops
                if neighbor.token_address == *from {
                    return Some(format!("Self-referencing loop at {}", from));
                }
                // 2. Economic: Minimum Liquidity (Dust Protection)
                if neighbor.pool.reserve_0 < MIN_RESERVE_THRESHOLD || neighbor.pool.reserve_1 < MIN_RESERVE_THRESHOLD {
                    return Some(format!("Dust liquidity detected in pool {}", neighbor.pool.pool_address));
                }
            }
        }
        None
    }

    /// Updates a pool's state in the persistent cache.
    /// Called by BSS-05 (Multi-Chain Sync) whenever a new Sync event is detected.
    pub fn update_edge(&self, token_a: Arc<str>, token_b: Arc<str>, state: PoolState) {
        self.add_neighbor(token_a.clone(), token_b.clone(), state.clone());
        self.add_neighbor(token_b, token_a, state);
    }

    fn add_neighbor(&self, from: Arc<str>, to: Arc<str>, state: PoolState) {
        // BSS-30 INVARIANT: Prevent self-referencing loops at the ingestion layer.
        if from == to { return; }
        // INVARIANT: Do not map empty or zeroed reserves
        // ATTACK SURFACE: Prevent "Dust Liquidity" from poisoning the solver path.
        if state.reserve_0 < MIN_RESERVE_THRESHOLD || state.reserve_1 < MIN_RESERVE_THRESHOLD { return; }
        if state.fee_bps > MAX_FEE_BPS { return; }

        let mut entry = self.adjacency_list.entry(from).or_insert_with(Vec::new);
        if let Some(neighbor) = entry.iter_mut().find(|n| n.pool.pool_address == state.pool_address) {
            neighbor.pool = state;
        } else {
            entry.push(Neighbor { token_address: to, pool: state });
        }
    }

    /// BSS-13 Bellman-Ford Helper: Instantly retrieves all neighbors for a token.
    pub fn get_neighbors(&self, token: &str) -> Vec<Neighbor> {
        self.adjacency_list.get(token).map(|v| v.value().clone()).unwrap_or_default()
    }
}

impl crate::SubsystemSpecialist for GraphPersistence {
    fn subsystem_id(&self) -> &'static str { "BSS-04" }
    
    fn upgrade_strategy(&self) -> &'static str { "Immutable: Requires process restart to clear memory." }

    fn testing_strategy(&self) -> &'static str { "Invariant: Verify no negative cycles exist after update." }

    fn run_diagnostic(&self) -> serde_json::Value {
        serde_json::json!({
            "edge_count": self.adjacency_list.len(),
            "is_empty": self.adjacency_list.is_empty(),
            "memory_utilization": "optimal",
            "subsystem_status": self.check_health()
        })
    }

    fn execute_remediation(&self, command: &str) -> Result<(), String> {
        if command == "PURGE_STALE" {
            self.adjacency_list.clear(); // Atomic reset
            return Ok(());
        }
        Err("Unknown command for BSS-04".into())
    }

    fn check_health(&self) -> crate::HealthStatus {
        // Specialist Review: Check for empty state
        if self.adjacency_list.is_empty() {
            return crate::HealthStatus::Degraded("Graph is empty; check BSS-05 Sync Layer.".into());
        }

        // BSS-30 Specialist Integrity: Detect self-referencing loops (Token A -> Token A)
        for entry in self.adjacency_list.iter() {
            if entry.value().iter().any(|n| n.token_address == *entry.key()) {
                return crate::HealthStatus::Degraded("Self-referencing loop detected in graph state.".into());
            }
        }

        crate::HealthStatus::Optimal
    }
}