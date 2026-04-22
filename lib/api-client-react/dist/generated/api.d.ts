import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { EngineActionResult, EngineStatus, HealthStatus, ListTradesParams, OperationResult, StartEngineRequest, StreamEventsResponse, SystemSettings, TelemetryData, TradeListResponse, TradeSummary, UpdateSettingsRequest, WalletConfigBody, WalletInfo } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns current engine state and mode
 * @summary Get engine status
 */
export declare const getGetEngineStatusUrl: () => string;
export declare const getEngineStatus: (options?: RequestInit) => Promise<EngineStatus>;
export declare const getGetEngineStatusQueryKey: () => readonly ["/api/engine/status"];
export declare const getGetEngineStatusQueryOptions: <TData = Awaited<ReturnType<typeof getEngineStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEngineStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEngineStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEngineStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getEngineStatus>>>;
export type GetEngineStatusQueryError = ErrorType<unknown>;
/**
 * @summary Get engine status
 */
export declare function useGetEngineStatus<TData = Awaited<ReturnType<typeof getEngineStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEngineStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Start arbitrage engine
 */
export declare const getStartEngineUrl: () => string;
export declare const startEngine: (startEngineRequest: StartEngineRequest, options?: RequestInit) => Promise<EngineActionResult>;
export declare const getStartEngineMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startEngine>>, TError, {
        data: BodyType<StartEngineRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof startEngine>>, TError, {
    data: BodyType<StartEngineRequest>;
}, TContext>;
export type StartEngineMutationResult = NonNullable<Awaited<ReturnType<typeof startEngine>>>;
export type StartEngineMutationBody = BodyType<StartEngineRequest>;
export type StartEngineMutationError = ErrorType<unknown>;
/**
 * @summary Start arbitrage engine
 */
export declare const useStartEngine: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startEngine>>, TError, {
        data: BodyType<StartEngineRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof startEngine>>, TError, {
    data: BodyType<StartEngineRequest>;
}, TContext>;
/**
 * @summary Stop arbitrage engine
 */
export declare const getStopEngineUrl: () => string;
export declare const stopEngine: (options?: RequestInit) => Promise<EngineActionResult>;
export declare const getStopEngineMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof stopEngine>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof stopEngine>>, TError, void, TContext>;
export type StopEngineMutationResult = NonNullable<Awaited<ReturnType<typeof stopEngine>>>;
export type StopEngineMutationError = ErrorType<unknown>;
/**
 * @summary Stop arbitrage engine
 */
export declare const useStopEngine: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof stopEngine>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof stopEngine>>, TError, void, TContext>;
/**
 * @summary List trade executions
 */
export declare const getListTradesUrl: (params?: ListTradesParams) => string;
export declare const listTrades: (params?: ListTradesParams, options?: RequestInit) => Promise<TradeListResponse>;
export declare const getListTradesQueryKey: (params?: ListTradesParams) => readonly ["/api/trades", ...ListTradesParams[]];
export declare const getListTradesQueryOptions: <TData = Awaited<ReturnType<typeof listTrades>>, TError = ErrorType<unknown>>(params?: ListTradesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTrades>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTrades>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTradesQueryResult = NonNullable<Awaited<ReturnType<typeof listTrades>>>;
export type ListTradesQueryError = ErrorType<unknown>;
/**
 * @summary List trade executions
 */
export declare function useListTrades<TData = Awaited<ReturnType<typeof listTrades>>, TError = ErrorType<unknown>>(params?: ListTradesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTrades>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns total profit, win rate, and trade volume aggregates
 * @summary Get trade profit summary
 */
export declare const getGetTradeSummaryUrl: () => string;
export declare const getTradeSummary: (options?: RequestInit) => Promise<TradeSummary>;
export declare const getGetTradeSummaryQueryKey: () => readonly ["/api/trades/summary"];
export declare const getGetTradeSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getTradeSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTradeSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTradeSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTradeSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getTradeSummary>>>;
export type GetTradeSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get trade profit summary
 */
export declare function useGetTradeSummary<TData = Awaited<ReturnType<typeof getTradeSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTradeSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns recent scanning and execution events
 * @summary Get live blockchain event stream
 */
export declare const getGetTradeStreamUrl: () => string;
export declare const getTradeStream: (options?: RequestInit) => Promise<StreamEventsResponse>;
export declare const getGetTradeStreamQueryKey: () => readonly ["/api/trades/stream"];
export declare const getGetTradeStreamQueryOptions: <TData = Awaited<ReturnType<typeof getTradeStream>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTradeStream>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTradeStream>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTradeStreamQueryResult = NonNullable<Awaited<ReturnType<typeof getTradeStream>>>;
export type GetTradeStreamQueryError = ErrorType<unknown>;
/**
 * @summary Get live blockchain event stream
 */
export declare function useGetTradeStream<TData = Awaited<ReturnType<typeof getTradeStream>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTradeStream>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get wallet and vault info
 */
export declare const getGetWalletUrl: () => string;
export declare const getWallet: (options?: RequestInit) => Promise<WalletInfo>;
export declare const getGetWalletQueryKey: () => readonly ["/api/wallet"];
export declare const getGetWalletQueryOptions: <TData = Awaited<ReturnType<typeof getWallet>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWallet>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWallet>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWalletQueryResult = NonNullable<Awaited<ReturnType<typeof getWallet>>>;
export type GetWalletQueryError = ErrorType<unknown>;
/**
 * @summary Get wallet and vault info
 */
export declare function useGetWallet<TData = Awaited<ReturnType<typeof getWallet>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWallet>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update wallet config (RPC, private key)
 */
export declare const getUpdateWalletConfigUrl: () => string;
export declare const updateWalletConfig: (walletConfigBody: WalletConfigBody, options?: RequestInit) => Promise<OperationResult>;
export declare const getUpdateWalletConfigMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateWalletConfig>>, TError, {
        data: BodyType<WalletConfigBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateWalletConfig>>, TError, {
    data: BodyType<WalletConfigBody>;
}, TContext>;
export type UpdateWalletConfigMutationResult = NonNullable<Awaited<ReturnType<typeof updateWalletConfig>>>;
export type UpdateWalletConfigMutationBody = BodyType<WalletConfigBody>;
export type UpdateWalletConfigMutationError = ErrorType<unknown>;
/**
 * @summary Update wallet config (RPC, private key)
 */
export declare const useUpdateWalletConfig: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateWalletConfig>>, TError, {
        data: BodyType<WalletConfigBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateWalletConfig>>, TError, {
    data: BodyType<WalletConfigBody>;
}, TContext>;
/**
 * Returns session profit, trades per hour, p99 latency
 * @summary Get system telemetry metrics
 */
export declare const getGetTelemetryUrl: () => string;
export declare const getTelemetry: (options?: RequestInit) => Promise<TelemetryData>;
export declare const getGetTelemetryQueryKey: () => readonly ["/api/telemetry"];
export declare const getGetTelemetryQueryOptions: <TData = Awaited<ReturnType<typeof getTelemetry>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTelemetry>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTelemetry>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTelemetryQueryResult = NonNullable<Awaited<ReturnType<typeof getTelemetry>>>;
export type GetTelemetryQueryError = ErrorType<unknown>;
/**
 * @summary Get system telemetry metrics
 */
export declare function useGetTelemetry<TData = Awaited<ReturnType<typeof getTelemetry>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTelemetry>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get system settings
 */
export declare const getGetSettingsUrl: () => string;
export declare const getSettings: (options?: RequestInit) => Promise<SystemSettings>;
export declare const getGetSettingsQueryKey: () => readonly ["/api/settings"];
export declare const getGetSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getSettings>>>;
export type GetSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get system settings
 */
export declare function useGetSettings<TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update system settings
 */
export declare const getUpdateSettingsUrl: () => string;
export declare const updateSettings: (updateSettingsRequest: UpdateSettingsRequest, options?: RequestInit) => Promise<OperationResult>;
export declare const getUpdateSettingsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<UpdateSettingsRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<UpdateSettingsRequest>;
}, TContext>;
export type UpdateSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateSettings>>>;
export type UpdateSettingsMutationBody = BodyType<UpdateSettingsRequest>;
export type UpdateSettingsMutationError = ErrorType<unknown>;
/**
 * @summary Update system settings
 */
export declare const useUpdateSettings: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<UpdateSettingsRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<UpdateSettingsRequest>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map