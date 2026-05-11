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

export interface GymState { }

export interface AlertInfo { }

export interface Report { }

export interface ReportInfo { }

export interface MemberProfile {
    member_id: MemberId;
    display_name: string;
    notes: string;
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
