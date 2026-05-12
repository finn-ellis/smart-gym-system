// Identifiers
export type SensorId = string;
export type WristbandId = string;
export type ZoneId = string;
export type MemberId = string;
export type AlertId = string;
export type ReportId = string;
export type VideoClipId = string;

// Enums
export enum AlertSeverity {
    INFORMATIONAL = "Informational",
    WARNING = "Warning",
    CRITICAL = "Critical"
}

export enum ReportType {
    HOURLY = "Hourly",
    DAILY = "Daily",
    WEEKLY = "Weekly",
    MONTHLY = "Monthly"
}

export enum StatusLevel {
    NORMAL = "Normal",
    WARNING = "Warning",
    CRITICAL = "Critical"
}

// Data Models
export interface ThresholdConfig { }

export interface AirQualityReading { }

export interface EnvironmentalReading { }

export interface BiometricReading {
    wristband_id: WristbandId;
    heart_rate: number;
    ppg: number[];
    eda: number;
    temperature: number;
}

export interface GymState {
    timestamp: number;
    air_quality: Record<ZoneId, unknown>;
    occupancy_counts: Record<ZoneId, number>;
    active_alert_ids: AlertId[];
}

export interface AlertInfo {
    alert_id: AlertId;
    severity: AlertSeverity;
    message: string;
    timestamp: number;
    dismissed: boolean;
    metadata: Record<string, unknown>;
}

export interface Report {
    report_id: ReportId;
    report_type?: ReportType;
    title: string;
    created_at: number;
    data: Record<string, unknown>;
}

export interface ReportInfo {
    report_id: ReportId;
    report_type?: ReportType;
    title: string;
    created_at: number;
}

export interface MemberProfile {
    member_id: MemberId;
    name: string;
    age: number;
    weight_kg: number;
    medical_history: string;
    thresholds: CustomizedHealthThresholds;
}

export interface VideoClip { }

export interface OccupancyCountsByZone { }

export interface MetricsLoad { }

export interface CustomizedHealthThresholds {
    heart_rate_max?: number;
    heart_rate_min?: number;
    temperature_max?: number;
    temperature_min?: number;
}

