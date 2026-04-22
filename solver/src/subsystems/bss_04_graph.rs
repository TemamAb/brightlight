use dashmap::DashMap;
use std::sync::RwLock;

#[derive(Debug, Clone, Default)]
pub struct PoolState {
    pub pool_address: String,
    pub reserve_0: u128,
    pub reserve_1: u128,
    pub fee_bps: u32,
    pub last_updated_block: u64,
}

#[derive(Debug, Clone)]
pub struct PoolEdge {
    pub from: usize,
    pub to: usize,
    pub reserve_in: u128,
    pub reserve_out: u128,
    pub fee_bps: u32,
    pub pool_address: String,
}

pub struct GraphPersistence {
    pub token_to_index: DashMap<String, usize>,
    pub index_to_token: RwLock<Vec<String>>,
    // Optimized adjacency list using indices for sub-millisecond traversal
    pub adjacency_list: RwLock<Vec<Vec<PoolEdge>>>,
}

impl GraphPersistence {
    pub fn new() -> Self {
        Self {
            token_to_index: DashMap::new(),
            index_to_token: RwLock::new(Vec::new()),
            adjacency_list: RwLock::new(Vec::new()),
        }
    }

    /// Maps a token address string to a stable usize index.
    pub fn get_or_create_index(&self, token: &str) -> usize {
        if let Some(idx) = self.token_to_index.get(token) {
            return *idx;
        }

        let mut tokens = self.index_to_token.write().unwrap();
        let mut adj = self.adjacency_list.write().unwrap();
        
        // Double check after lock to avoid race conditions
        if let Some(idx) = self.token_to_index.get(token) {
            return *idx;
        }

        let new_idx = tokens.len();
        tokens.push(token.to_string());
        adj.push(Vec::new());
        self.token_to_index.insert(token.to_string(), new_idx);
        new_idx
    }

    pub fn update_edge(&self, token_a: String, token_b: String, state: PoolState) {
        let idx_a = self.get_or_create_index(&token_a);
        let idx_b = self.get_or_create_index(&token_b);

        let mut adj = self.adjacency_list.write().unwrap();
        
        // Edge A -> B (reserve_0 is in, reserve_1 is out)
        let edge_ab = PoolEdge {
            from: idx_a,
            to: idx_b,
            reserve_in: state.reserve_0,
            reserve_out: state.reserve_1,
            fee_bps: state.fee_bps,
            pool_address: state.pool_address.clone(),
        };
        
        let list_a = &mut adj[idx_a];
        if let Some(pos) = list_a.iter().position(|e| e.pool_address == state.pool_address) {
            list_a[pos] = edge_ab;
        } else {
            list_a.push(edge_ab);
        }

        // Edge B -> A (reserve_1 is in, reserve_0 is out)
        let edge_ba = PoolEdge {
            from: idx_b,
            to: idx_a,
            reserve_in: state.reserve_1,
            reserve_out: state.reserve_0,
            fee_bps: state.fee_bps,
            pool_address: state.pool_address,
        };
        
        let list_b = &mut adj[idx_b];
        if let Some(pos) = list_b.iter().position(|e| e.pool_address == edge_ba.pool_address) {
            list_b[pos] = edge_ba;
        } else {
            list_b.push(edge_ba);
        }
    }

    pub fn get_edges(&self, node_idx: usize) -> Vec<PoolEdge> {
        let adj = self.adjacency_list.read().unwrap();
        adj.get(node_idx).cloned().unwrap_or_default()
    }

    /// Validates basic data integrity for the arbitrage engine.
    pub fn validate_global_invariants(&self) -> Option<String> {
        let adj = self.adjacency_list.read().unwrap();
        for edges in adj.iter() {
            for edge in edges {
                if edge.reserve_in == 0 || edge.reserve_out == 0 {
                    return Some(format!("Zero reserve detected in pool {}", edge.pool_address));
                }
                if edge.fee_bps > 10000 {
                    return Some(format!("Invalid fee ({} bps) in pool {}", edge.fee_bps, edge.pool_address));
                }
            }
        }
        None
    }
}
