// BSS-45: Risk & Safety Engine
use crate::subsystems::bss_13_solver::ArbitrageOpportunity;
use crate::subsystems::bss_43_simulator::SimulationResult;
use crate::HealthStatus;
use crate::SystemPolicy;
use crate::WatchtowerStats;
use serde_json::Value;
use std::sync::atomic::Ordering;
use std::sync::Arc;

pub struct RiskSpecialist {
    pub stats: Arc<WatchtowerStats>,
}

impl crate::SubsystemSpecialist for RiskSpecialist {
    fn subsystem_id(&self) -> &'static str {
        "BSS-45"
    }
    fn check_health(&self) -> HealthStatus {
        HealthStatus::Optimal
    }
    fn upgrade_strategy(&self) -> &'static str {
        "Probabilistic: Moving to bayesian risk modeling."
    }
    fn testing_strategy(&self) -> &'static str {
        "Adversarial: Simulation of poisoned liquidity."
    }
    fn run_diagnostic(&self) -> Value {
        serde_json::json!({ "gate_active": true, "engine": "policy-validator" })
    }
    fn execute_remediation(&self, _cmd: &str) -> Result<(), String> {
        Ok(())
    }
}

pub struct RiskEngine;

impl RiskEngine {
    /// BSS-45: Final validation gate before execution.
    pub fn validate(
        _opportunity: &ArbitrageOpportunity,
        simulation: &SimulationResult,
        policy: &SystemPolicy,
        stats: &WatchtowerStats,
    ) -> bool {
        // 1. Min Profit Threshold
        let min_profit_eth = 0.001_f64.max((policy.min_profit_bps / 10000.0) * 10.0);
        if simulation.profit_eth < min_profit_eth {
            stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
            return false;
        }
        // 2. Profit/Gas Ratio (20% buffer)
        if simulation.profit_eth < (simulation.gas_estimate_eth * 1.2) {
            stats.signals_rejected_risk.fetch_add(1, Ordering::Relaxed);
            return false;
        }
        true
    }
}
