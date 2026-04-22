// BSS-04: Graph Persistence Module (moved from root)
// Pure module - no SubsystemSpecialist trait

use dashmap::DashMap;
use std::sync::Arc;

// GraphPersistence struct & impl from original bss_04_graph.rs
pub struct GraphPersistence {
    pub adjacency_list: Arc<DashMap<String, Vec<PoolEdge>>>,
}

pub struct PoolEdge {
    pub token_address: String,
    pub pool: PoolState,
}

// ... original impl update_edge(), validate_global_invariants() ...
