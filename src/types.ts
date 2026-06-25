export enum DistractionType {
  SAFE_DRIVING = "Safe Driving",
  TEXTING_RIGHT = "Texting (Right Hand)",
  PHONE_CALL_RIGHT = "Phone Call (Right Hand)",
  TEXTING_LEFT = "Texting (Left Hand)",
  PHONE_CALL_LEFT = "Phone Call (Left Hand)",
  ADJUSTING_RADIO = "Adjusting Radio",
  DRINKING_EATING = "Drinking or Eating",
  REACHING_BEHIND = "Reaching Behind",
  HAIR_MAKEUP = "Hair & Makeup",
  TALKING_PASSENGER = "Talking to Passenger",
  FATIGUE_DROWSINESS = "Fatigue or Drowsiness",
}

export enum AlertSeverity {
  INFO = "INFO",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface DriverProfile {
  id: string;
  name: string;
  avatar: string;
  licenseNumber: string;
  totalTrips: number;
  totalDistractedSeconds: number;
  totalDriveTimeSeconds: number;
  riskScore: number; // 0 - 100 (higher is safer)
  status: "Active" | "Resting" | "Suspended";
  activeVehicleId: string;
}

export interface LiveTelemetry {
  timestamp: string;
  speed: number; // km/h
  heading: number; // degrees 0-359
  accelX: number; // g-force
  accelY: number;
  accelZ: number;
  gyroX: number; // deg/s
  gyroY: number;
  gyroZ: number;
  gForce: number; // composite G
  eyeGazeDeviationX: number; // px from screen center
  eyeGazeDeviationY: number;
  gazeOffRoadSeconds: number;
}

export interface BehaviorState {
  isEyesOnRoad: boolean;
  isHoldingPhone: boolean;
  isEatingDrinking: boolean;
  isHandsOnWheel: boolean;
  isDrowsy: boolean;
  activeDistraction: DistractionType | null;
}

export interface GeofenceZone {
  id: string;
  name: string;
  lat: number; // 0-100 local grid coordinates
  lng: number; // 0-100 local grid coordinates
  radius: number; // units
  isActive: boolean;
  speedLimit: number;
  violationCount: number;
}

export interface IncidentRecord {
  id: string;
  timestamp: string;
  driverId: string;
  driverName: string;
  type: DistractionType;
  severity: AlertSeverity;
  speed: number;
  hazardScore: number; // 0 - 100 impact score
  proofFrame: string; // descriptive description of image or icon
  acknowledgedByDriver: boolean;
}

export interface RuleThreshold {
  id: string;
  name: string;
  type: DistractionType;
  thresholdSeconds: number;
  alarmEnabled: boolean;
  voiceAlertMessage: string;
}

export interface VehicleUnit {
  id: string;
  plateNumber: string;
  model: string;
  currentDriverId: string;
  signalStrength: "Excellent" | "Good" | "Weak";
  status: "Online" | "Offline" | "Standby";
}

export interface DistractionStats {
  phoneUsageSeconds: number;
  gazeOffRoadSeconds: number;
  drowsySeconds: number;
  handsOffSeconds: number;
  eatingDrinkingSeconds: number;
}
