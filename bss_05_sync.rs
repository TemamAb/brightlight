use ethers::prelude::*;
use ethers::providers::{Provider};
use ethers::types::Filter;
use std::sync::Arc;
use tokio::sync::mpsc;
use crate::bss_04_graph::PoolState;
use crate::WatchtowerStats;
use std::sync::atomic::Ordering;
use futures_util::StreamExt;

/// BSS-05: Multi-Chain Sync Specialist
/// Provides real-time event streaming using ethers-rs WebSocket transport.
pub async fn subscribe_chain(
    chain_id: u64,
    tx: mpsc::Sender<(String, String, PoolState)>,
    stats: Arc<WatchtowerStats>,
) {
    // Elite Selection: Free/Permissionless public WebSocket endpoints
    let ws_url = match chain_id {
        1 => "wss://ethereum-rpc.publicnode.com",
        8453 => "wss://base-rpc.publicnode.com",
        42161 => "wss://arbitrum-one-rpc.publicnode.com",
        137 => "wss://polygon-bor-rpc.publicnode.com",
        10 => "wss://optimism-rpc.publicnode.com",
        _ => {
            eprintln!("[BSS-05] No public WS endpoint configured for chain {}", chain_id);
            return;
        }
    };

    // BSS-05 TRAINING: ethers v2 API - Provider::connect returns Provider, not Result
let provider: Arc<Provider<ethers::providers::Ws>> = match Provider::connect(ws_url).await {
        Ok(p) => Arc::new(p),
        Err(e) => {
            eprintln!("[BSS-05] WS Connection error: {}", e);
            return;
        }
    };

    // Filter for Uniswap V2 Sync(uint112,uint112) events
    let sync_event_signature = "Sync(uint112,uint112)";
    let filter = Filter::new().event(sync_event_signature);

    let mut stream = match provider.subscribe(&filter).await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[BSS-05] Subscription failed for chain {}: {}", chain_id, e);
            return;
        }
    };

    println!("[BSS-05] WebSocket STREAM ACTIVE: Chain ID {}", chain_id);

    while let Some(log) = stream.next().await {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        stats.last_heartbeat_bss05.store(now, Ordering::Relaxed);
        stats.msg_throughput_sec.fetch_add(1, Ordering::Relaxed);

        let pool_addr = log.address;
        
        if log.data.len() >= 64 {
            let reserve_0 = u128::from_be_bytes(log.data[16..32].try_into().unwrap_or([0; 16]));
            let reserve_1 = u128::from_be_bytes(log.data[48..64].try_into().unwrap_or([0; 16]));

            let update = (
                format!("{:?}_0", pool_addr),
                format!("{:?}_1", pool_addr),
                PoolState {
                    pool_address: format!("{:?}", pool_addr),
                    reserve_0,
                    reserve_1,
                    fee_bps: 30,
                    last_updated_block: log.block_number.unwrap_or_default().as_u64(),
                },
            );

            let _ = tx.send(update).await;
        }
    }
}