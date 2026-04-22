// BSS-44: Liquidity & Slippage Engine
use crate::bss_04_graph::PoolEdge;

pub struct LiquidityEngine;

impl LiquidityEngine {
    /// BSS-44: Standard Uniswap V2 Constant Product Formula
    /// out = (in * 997 * reserve_out) / (reserve_in * 1000 + in * 997)
    pub fn get_amount_out(amount_in: u128, reserve_in: u128, reserve_out: u128, fee_bps: u32) -> u128 {
        if amount_in == 0 || reserve_in == 0 || reserve_out == 0 { return 0; }
        
        let fee_multiplier = 10000 - fee_bps;
        let amount_in_with_fee = amount_in * fee_multiplier as u128;
        let numerator = amount_in_with_fee * reserve_out;
        let denominator = (reserve_in * 10000) + amount_in_with_fee;
        
        numerator / denominator
    }

    /// BSS-44: Simulates a full arbitrage path to calculate expected output.
    pub fn simulate_path(amount_in: u128, path_edges: &[PoolEdge]) -> u128 {
        let mut current_amount = amount_in;
        for edge in path_edges {
            current_amount = Self::get_amount_out(
                current_amount,
                edge.reserve_in,
                edge.reserve_out,
                edge.fee_bps
            );
            if current_amount == 0 { break; }
        }
        current_amount
    }

    /// BSS-44: Calculates the Optimal Input Amount for a cycle.
    /// Uses a binary search approach to find the peak of the profit curve.
    pub fn compute_optimal_input(path_edges: &[PoolEdge], min_input: u128, max_input: u128) -> u128 {
        let mut low = min_input;
        let mut high = max_input;
        let mut best_input = low;
        let mut max_profit = 0i128;

        // Perform 20 iterations for high precision
        for _ in 0..20 {
            let m1 = low + (high - low) / 3;
            let m2 = high - (high - low) / 3;

            let profit1 = Self::calculate_profit(m1, path_edges);
            let profit2 = Self::calculate_profit(m2, path_edges);

            if profit1 > profit2 {
                if profit1 > max_profit {
                    max_profit = profit1;
                    best_input = m1;
                }
                high = m2;
            } else {
                if profit2 > max_profit {
                    max_profit = profit2;
                    best_input = m2;
                }
                low = m1;
            }
        }

        if max_profit <= 0 { 0 } else { best_input }
    }

    fn calculate_profit(amount_in: u128, path_edges: &[PoolEdge]) -> i128 {
        if amount_in == 0 { return 0; }
        let amount_out = Self::simulate_path(amount_in, path_edges);
        amount_out as i128 - amount_in as i128
    }
}