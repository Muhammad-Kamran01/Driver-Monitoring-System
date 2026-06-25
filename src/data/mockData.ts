import { DriverProfile, GeofenceZone, RuleThreshold, VehicleUnit, IncidentRecord, DistractionType, AlertSeverity } from "../types";

export const INITIAL_DRIVERS: DriverProfile[] = [
  {
    id: "drv-1",
    name: "Alexander Mercer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    licenseNumber: "DL-984210A",
    totalTrips: 142,
    totalDistractedSeconds: 2480,
    totalDriveTimeSeconds: 512000,
    riskScore: 84,
    status: "Active",
    activeVehicleId: "veh-1",
  },
  {
    id: "drv-2",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    licenseNumber: "DL-473188B",
    totalTrips: 89,
    totalDistractedSeconds: 4320,
    totalDriveTimeSeconds: 320000,
    riskScore: 68,
    status: "Active",
    activeVehicleId: "veh-2",
  },
  {
    id: "drv-3",
    name: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    licenseNumber: "DL-621499C",
    totalTrips: 201,
    totalDistractedSeconds: 980,
    totalDriveTimeSeconds: 780000,
    riskScore: 94,
    status: "Resting",
    activeVehicleId: "veh-3",
  },
  {
    id: "drv-4",
    name: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    licenseNumber: "DL-311492D",
    totalTrips: 114,
    totalDistractedSeconds: 1820,
    totalDriveTimeSeconds: 420000,
    riskScore: 89,
    status: "Active",
    activeVehicleId: "veh-4",
  }
];

export const INITIAL_VEHICLES: VehicleUnit[] = [
  {
    id: "veh-1",
    plateNumber: "TX-78-K9P",
    model: "Freightliner Cascadia",
    currentDriverId: "drv-1",
    signalStrength: "Excellent",
    status: "Online"
  },
  {
    id: "veh-2",
    plateNumber: "CA-42-D3R",
    model: "Volvo VNL 860",
    currentDriverId: "drv-2",
    signalStrength: "Good",
    status: "Online"
  },
  {
    id: "veh-3",
    plateNumber: "NY-19-M4V",
    model: "Peterbilt 579",
    currentDriverId: "drv-3",
    signalStrength: "Weak",
    status: "Standby"
  },
  {
    id: "veh-4",
    plateNumber: "FL-55-B8N",
    model: "Kenworth T680",
    currentDriverId: "drv-4",
    signalStrength: "Excellent",
    status: "Online"
  }
];

export const INITIAL_GEOFENCES: GeofenceZone[] = [
  {
    id: "geo-1",
    name: "Downtown Logistics Core",
    lat: 40,
    lng: 45,
    radius: 12,
    isActive: true,
    speedLimit: 45,
    violationCount: 14
  },
  {
    id: "geo-2",
    name: "Route 88 Construction Zone",
    lat: 70,
    lng: 30,
    radius: 8,
    isActive: true,
    speedLimit: 30,
    violationCount: 29
  },
  {
    id: "geo-3",
    name: "Westside Freight Depot",
    lat: 20,
    lng: 80,
    radius: 15,
    isActive: true,
    speedLimit: 20,
    violationCount: 3
  }
];

export const INITIAL_RULES: RuleThreshold[] = [
  {
    id: "rule-1",
    name: "Texting Behavior Check (Right Hand)",
    type: DistractionType.TEXTING_RIGHT,
    thresholdSeconds: 1.5,
    alarmEnabled: true,
    voiceAlertMessage: "Warning! Please put down your mobile device and focus on steering."
  },
  {
    id: "rule-2",
    name: "Phone Call Behavior Check (Right Hand)",
    type: DistractionType.PHONE_CALL_RIGHT,
    thresholdSeconds: 1.5,
    alarmEnabled: true,
    voiceAlertMessage: "Hands-free only! Avoid holding the phone during operation."
  },
  {
    id: "rule-3",
    name: "Texting Behavior Check (Left Hand)",
    type: DistractionType.TEXTING_LEFT,
    thresholdSeconds: 1.5,
    alarmEnabled: true,
    voiceAlertMessage: "Warning! Left-hand phone usage detected. Place phone away."
  },
  {
    id: "rule-4",
    name: "Phone Call Behavior Check (Left Hand)",
    type: DistractionType.PHONE_CALL_LEFT,
    thresholdSeconds: 1.5,
    alarmEnabled: true,
    voiceAlertMessage: "Warning! Left-hand phone call detected. Eyes on road."
  },
  {
    id: "rule-5",
    name: "Infotainment & Radio Interaction",
    type: DistractionType.ADJUSTING_RADIO,
    thresholdSeconds: 2.0,
    alarmEnabled: true,
    voiceAlertMessage: "Radio adjusting limit exceeded. Focus on driving."
  },
  {
    id: "rule-6",
    name: "Cabin Eating and Drinking Monitor",
    type: DistractionType.DRINKING_EATING,
    thresholdSeconds: 2.0,
    alarmEnabled: true,
    voiceAlertMessage: "Manual distraction warning! Avoid eating while moving."
  },
  {
    id: "rule-7",
    name: "Blind reach detection (Behind Seat)",
    type: DistractionType.REACHING_BEHIND,
    thresholdSeconds: 1.8,
    alarmEnabled: true,
    voiceAlertMessage: "Danger! Reaching behind seat detected. Stop reaching."
  },
  {
    id: "rule-8",
    name: "Driver Grooming & Makeup",
    type: DistractionType.HAIR_MAKEUP,
    thresholdSeconds: 1.5,
    alarmEnabled: true,
    voiceAlertMessage: "Focus alert! Avoid hair and makeup adjustments while driving."
  },
  {
    id: "rule-9",
    name: "Passenger Interpersonal Talking",
    type: DistractionType.TALKING_PASSENGER,
    thresholdSeconds: 2.5,
    alarmEnabled: true,
    voiceAlertMessage: "Social gaze warning! Maintain forward concentration."
  },
  {
    id: "rule-10",
    name: "Microsleep & Fatigue Detector",
    type: DistractionType.FATIGUE_DROWSINESS,
    thresholdSeconds: 2.2,
    alarmEnabled: true,
    voiceAlertMessage: "Extremely high drowsiness detected! Please pull over immediately and rest."
  }
];

export const INITIAL_INCIDENTS: IncidentRecord[] = [
  {
    id: "inc-1",
    timestamp: "2026-06-24T10:15:22",
    driverId: "drv-1",
    driverName: "Alexander Mercer",
    type: DistractionType.TEXTING_RIGHT,
    severity: AlertSeverity.HIGH,
    speed: 68,
    hazardScore: 82,
    proofFrame: "Driver detected texting with right hand, eyes downcast.",
    acknowledgedByDriver: true
  },
  {
    id: "inc-2",
    timestamp: "2026-06-24T11:04:10",
    driverId: "drv-2",
    driverName: "Elena Rostova",
    type: DistractionType.FATIGUE_DROWSINESS,
    severity: AlertSeverity.CRITICAL,
    speed: 82,
    hazardScore: 95,
    proofFrame: "Driver eyes closed for 2.8s. Head droop and fatigue detected.",
    acknowledgedByDriver: false
  },
  {
    id: "inc-3",
    timestamp: "2026-06-24T09:44:18",
    driverId: "drv-2",
    driverName: "Elena Rostova",
    type: DistractionType.ADJUSTING_RADIO,
    severity: AlertSeverity.MEDIUM,
    speed: 45,
    hazardScore: 60,
    proofFrame: "Infotainment tuning for 4.2 seconds continuously.",
    acknowledgedByDriver: true
  },
  {
    id: "inc-4",
    timestamp: "2026-06-24T12:30:05",
    driverId: "drv-4",
    driverName: "Sarah Jenkins",
    type: DistractionType.HAIR_MAKEUP,
    severity: AlertSeverity.MEDIUM,
    speed: 55,
    hazardScore: 50,
    proofFrame: "Grooming and mirror usage for 3.5 seconds.",
    acknowledgedByDriver: true
  },
  {
    id: "inc-5",
    timestamp: "2026-06-24T13:01:45",
    driverId: "drv-1",
    driverName: "Alexander Mercer",
    type: DistractionType.DRINKING_EATING,
    severity: AlertSeverity.LOW,
    speed: 60,
    hazardScore: 35,
    proofFrame: "Driver sipping coffee, briefly obscuring camera view of mouth.",
    acknowledgedByDriver: true
  }
];
