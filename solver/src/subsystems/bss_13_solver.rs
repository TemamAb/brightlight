// BSS-13: Shortest Path Faster Algorithm (SPFA) Weaponized Solver
use crate::WatchtowerStats;
use crate::bss_04_graph::{GraphPersistence};
use crate::HealthStatus;
use serde::{Serialize, Deserialize};
use std::collections::VecDeque;
use std::sync::Arc;
use std::sync::atomic::Ordering;
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub struct ArbitrageOpportunity {
    pub path: Vec<usize>,
    pub log_weight: f64,
}

pub struct SolverSpecialist {
    pub stats: Arc<WatchtowerStats>,
    pub graph: Arc<GraphPersistence>,
}

impl crate::SubsystemSpecialist for SolverSpecialist {
    fn subsystem_id(&self) -> &'static str { "BSS-13" }
    fn check_health(&self) -> HealthStatus {
        if self.stats.solver_jitter_ms.load(Ordering::Relaxed) > 200 {
            return HealthStatus::Degraded("Compute jitter exceeds safety bounds".into());
        }
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str { "Parallelization: Moving to rayon-based multi-start SPFA." }
    fn testing_strategy(&self) -> &'static str { "Backtesting: Verifying against historical block Geth traces." }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({
            "algorithm": "SPFA-SLF",
            "nodes": self.graph.adjacency_list.len(),
            "p99_latency": self.stats.solver_latency_p99_ms.load(Ordering::Relaxed)
        })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> { Ok(()) }
}

impl SolverSpecialist {
    /// BSS-13/44: Detects negative cycles using SPFA with SLF (Small Label First) optimization.
    /// Effectively finds paths where the product of exchange rates > 1.
    /// BSS-13: Detects negative cycles using SPFA + SLF.
    /// Uses indexed nodes for sub-millisecond execution.
    pub fn detect_arbitrage(&self, start_token_idx: usize, max_hops: usize) -> Vec<ArbitrageOpportunity> {
        let node_count = self.graph.token_to_index.len();
        if node_count == 0 || start_token_idx >= node_count { return vec![]; }

        let mut dist = vec![f64::INFINITY; node_count];
        let mut parent = vec![None; node_count];
        let mut in_queue = vec![false; node_count];
        let mut count = vec![0; node_count];
        let mut queue = VecDeque::with_capacity(node_count);

        dist[start_token_idx] = 0.0;
        queue.push_back(start_token_idx);
        in_queue[start_token_idx] = true;

        let mut results = Vec::new();

        while let Some(u) = queue.pop_front() {
            in_queue[u] = false;

            let edges = self.graph.get_edges(u);
            for edge in edges {
                let v = edge.to;
                
                // weight = -ln(rate_after_fee)
                let fee_multiplier = 1.0 - (edge.fee_bps as f64 / 10000.0);
                let weight = -((edge.reserve_out as f64 / edge.reserve_in as f64) * fee_multiplier).ln();
                
                if dist[u] + weight < dist[v] {
                    dist[v] = dist[u] + weight;
                    parent[v] = Some(u);

                    if !in_queue[v] {
                        count[v] += 1;
                        if count[v] > max_hops {
                            // Negative cycle detected
                            if let Some(path) = self.extract_cycle(v, &parent) {
                                results.push(ArbitrageOpportunity {
                                    path,
                                    log_weight: dist[v],
                                });
                                return results; // Return first found for immediate simulation
                            }
                        }

                        // SLF (Small Label First) Optimization
                        if !queue.is_empty() && dist[v] < dist[*queue.front().unwrap()] {
                            queue.push_front(v);
                        } else {
                            queue.push_back(v);
                        }
                        in_queue[v] = true;
                    }
                }
            }
        }
        results
    }

    /// BSS-13: Extracts the path of the negative cycle starting from a node.
    fn extract_cycle(&self, start: usize, parent: &[Option<usize>]) -> Option<Vec<usize>> {
        let mut curr = start;
        for _ in 0..parent.len() {
            if let Some(p) = parent[curr] { curr = p; } else { return None; }
        }

        let cycle_start = curr;
        let mut cycle = vec![cycle_start];
        let mut next = parent[cycle_start]?;
        
        while next != cycle_start {
            cycle.push(next);
            next = parent[next]?;
            if cycle.len() > parent.len() { return None; }
        }
        
        cycle.reverse();
        cycle.push(cycle_start);
        Some(cycle)
    }
}
