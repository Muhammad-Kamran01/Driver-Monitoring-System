import React, { useState, useEffect, useRef } from "react";
import { 
  INITIAL_DRIVERS, 
  INITIAL_VEHICLES, 
  INITIAL_GEOFENCES, 
  INITIAL_RULES, 
  INITIAL_INCIDENTS 
} from "./data/mockData";
import { 
  DriverProfile, 
  VehicleUnit, 
  GeofenceZone, 
  RuleThreshold, 
  IncidentRecord, 
  LiveTelemetry, 
  BehaviorState, 
  AlertSeverity, 
  DistractionType 
} from "./types";

// Import modules
import TelemetryGauges from "./components/TelemetryGauges";
import CVMonitor from "./components/CVMonitor";
import AlertDispatcher from "./components/AlertDispatcher";
import DriverProfiles from "./components/DriverProfiles";
import GeofenceMap from "./components/GeofenceMap";
import AnalyticsView from "./components/AnalyticsView";
import IncidentAudit from "./components/IncidentAudit";
import RouteReplay from "./components/RouteReplay";
import RulesManager from "./components/RulesManager";
import FleetManager from "./components/FleetManager";
import SafetyCoach from "./components/SafetyCoach";
import AuthScreen from "./components/AuthScreen";
import ProfileTab from "./components/ProfileTab";

// Navigation Tabs
enum DashboardTab {
  LIVE_MONITOR = "live",
  DRIVERS = "drivers",
  FLEET = "fleet",
  GEOFENCES = "geofences",
  ANALYTICS = "analytics",
  AUDIT_LOGS = "audit",
  AI_COACH = "coach",
  DATABASE = "database",
  PROFILE = "profile"
}

export default function App() {
  // Authentication & Session
  const [user, setUser] = useState<{ 
    email: string; 
    name: string; 
    role: string; 
    profile_completed: boolean; 
    phone?: string; 
    license_number?: string; 
    vehicle_plate?: string; 
    vehicle_model?: string; 
  } | null>(() => {
    const saved = localStorage.getItem("dms_auth_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.LIVE_MONITOR);

  // Webcam stream status
  const [webcamActive, setWebcamActive] = useState<boolean>(false);

  // Core States (Initialized clean without dummy records to support real registration flows)
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [vehicles, setVehicles] = useState<VehicleUnit[]>([]);

  const [geofences, setGeofences] = useState<GeofenceZone[]>(INITIAL_GEOFENCES);
  const [rules, setRules] = useState<RuleThreshold[]>(INITIAL_RULES);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(INITIAL_INCIDENTS);
  
  // Active Alert timelines (Module 3 dispatcher)
  const [alertLogs, setAlertLogs] = useState<Array<{
    id: string;
    timestamp: string;
    message: string;
    severity: AlertSeverity;
    acknowledged: boolean;
  }>>([
    {
      id: "al-1",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      message: "Drowsiness & Fatigue threshold breached - cabin warning issued.",
      severity: AlertSeverity.HIGH,
      acknowledged: true
    }
  ]);
  
  const [activeDriverId, setActiveDriverId] = useState<string>("drv-1");
  const [activeVehicleId, setActiveVehicleId] = useState<string>("veh-1");

  // Synchronize active driver & vehicle for operator roles
  useEffect(() => {
    if (user && user.role !== "admin") {
      const emailIdStr = user.email.toLowerCase().replace(/[@.]/g, "-");
      const targetDriverId = `drv-${emailIdStr}`;
      const targetVehicleId = `veh-${emailIdStr}`;
      
      if (activeDriverId !== targetDriverId) {
        setActiveDriverId(targetDriverId);
      }
      if (activeVehicleId !== targetVehicleId) {
        setActiveVehicleId(targetVehicleId);
      }
    }
  }, [user, activeDriverId, activeVehicleId]);

  // Database setup & load states
  const [isLoaded, setIsLoaded] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Load initial dataset from database
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch("/api/db/data");
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.drivers) setDrivers(json.data.drivers);
          if (json.data.vehicles) setVehicles(json.data.vehicles);
          if (json.data.geofences) setGeofences(json.data.geofences);
          if (json.data.rules) setRules(json.data.rules);
          if (json.data.incidents) setIncidents(json.data.incidents);
          if (json.data.alertLogs) setAlertLogs(json.data.alertLogs);
        }
      } catch (err) {
        console.error("Failed to load initial dataset from server:", err);
      } finally {
        setIsLoaded(true);
      }
    }

    async function loadDbStatus() {
      try {
        const res = await fetch("/api/db/status");
        const json = await res.json();
        setDbStatus(json);
      } catch (err) {
        console.error("Failed to load database status diagnostics:", err);
      }
    }

    loadInitialData();
    loadDbStatus();
  }, []);

  // Sync state to backend Supabase database
  useEffect(() => {
    // Don't sync initial state on first mount if we haven't loaded from the server yet
    if (!isLoaded) return;

    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      try {
        await fetch("/api/db/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            drivers,
            vehicles,
            geofences,
            rules,
            incidents,
            alertLogs
          }),
          signal: controller.signal
        });
      } catch (err) {
        console.error("Failed to sync state with database:", err);
      }
    }, 1500); // 1.5s debounce to aggregate rapid simulator mutations safely without spamming DB

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [drivers, vehicles, geofences, rules, incidents, alertLogs, isLoaded]);

  // Current selected entities (dynamic role-based routing & safe fallback resolution)
  const computedDriverId = user && user.role !== "admin" ? `drv-${user.email.toLowerCase().replace(/[@.]/g, "-")}` : activeDriverId;
  const computedVehicleId = user && user.role !== "admin" ? `veh-${user.email.toLowerCase().replace(/[@.]/g, "-")}` : activeVehicleId;

  const currentDriver = drivers.find(d => d.id === computedDriverId) || (user && user.role !== "admin" ? {
    id: computedDriverId,
    name: user.name,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    licenseNumber: user.license_number || "DL-PENDING",
    totalTrips: 0,
    totalDistractedSeconds: 0,
    totalDriveTimeSeconds: 0,
    riskScore: 100,
    status: "Active",
    activeVehicleId: computedVehicleId
  } : drivers[0] || {
    id: "drv-temp",
    name: "Pending Operator",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    licenseNumber: "N/A",
    totalTrips: 0,
    totalDistractedSeconds: 0,
    totalDriveTimeSeconds: 0,
    riskScore: 100,
    status: "Active",
    activeVehicleId: "veh-temp"
  });

  const currentVehicle = vehicles.find(v => v.id === computedVehicleId) || (user && user.role !== "admin" ? {
    id: computedVehicleId,
    plateNumber: user.vehicle_plate || "TBD-PLATE",
    model: user.vehicle_model || "Operator Vehicle",
    currentDriverId: computedDriverId,
    signalStrength: "Excellent",
    status: "Online"
  } : vehicles[0] || {
    id: "veh-temp",
    plateNumber: "TBD-PLATE",
    model: "Operator Vehicle",
    currentDriverId: "drv-temp",
    signalStrength: "Excellent",
    status: "Online"
  });

  // Telemetry real-time states
  const [telemetry, setTelemetry] = useState<LiveTelemetry>({
    timestamp: new Date().toISOString(),
    speed: 62,
    heading: 45,
    accelX: 0.04,
    accelY: -0.01,
    accelZ: 0.98,
    gyroX: 0.1,
    gyroY: -0.3,
    gyroZ: 0.0,
    gForce: 0.99,
    eyeGazeDeviationX: 5,
    eyeGazeDeviationY: -2,
    gazeOffRoadSeconds: 0
  });

  // Computer Vision Behavior state simulation
  const [behavior, setBehavior] = useState<BehaviorState>({
    isEyesOnRoad: true,
    isHoldingPhone: false,
    isEatingDrinking: false,
    isHandsOnWheel: true,
    isDrowsy: false,
    activeDistraction: null
  });

  // Trip coordinates tracking simulation
  const [vehiclePos, setVehiclePos] = useState<{ x: number; y: number }>({ x: 10, y: 15 });
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [isAutoInference, setIsAutoInference] = useState<boolean>(true);
  const autoStateRef = useRef<{
    state: "safe" | "distracted";
    secondsLeft: number;
    currentDistraction: DistractionType | null;
  }>({
    state: "safe",
    secondsLeft: 6, // start with 6 seconds of safe driving
    currentDistraction: null
  });
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const routeStepRef = useRef<number>(0);
  const [tripIncidentHistory, setTripIncidentHistory] = useState<Array<{ x: number, y: number, type: string, timestamp: string }>>([]);

  // Current active geofence zone
  const [activeZone, setActiveZone] = useState<GeofenceZone | null>(null);

  // Predefined route line coordinates for the trip path
  const routePoints = [
    { x: 10, y: 15 },
    { x: 25, y: 18 },
    { x: 40, y: 45 },
    { x: 55, y: 60 },
    { x: 70, y: 30 },
    { x: 80, y: 55 },
    { x: 90, y: 85 }
  ];

  // Simulation Game Tick Loops
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulating) {
      timer = setInterval(() => {
        // System remains at rest if live camera is OFF
        if (!webcamActive) {
          if (behavior.activeDistraction !== null) {
            handleSimulateBehavior(null, false);
          }
          setTelemetry((prev) => ({
            ...prev,
            speed: 0,
            accelX: 0,
            accelY: 0,
            accelZ: 1.0,
            gForce: 1.0,
            gyroX: 0,
            gyroY: 0,
            gyroZ: 0,
            eyeGazeDeviationX: 0,
            eyeGazeDeviationY: 0,
            gazeOffRoadSeconds: 0
          }));
          return;
        }

        // 0. Automated distraction generator
        if (isAutoInference) {
          autoStateRef.current.secondsLeft -= 1;
          if (autoStateRef.current.secondsLeft <= 0) {
            if (autoStateRef.current.state === "safe") {
              // Transition from safe driving to distracted driving
              const possibleDistractions = [
                DistractionType.TEXTING_RIGHT,
                DistractionType.PHONE_CALL_RIGHT,
                DistractionType.TEXTING_LEFT,
                DistractionType.PHONE_CALL_LEFT,
                DistractionType.ADJUSTING_RADIO,
                DistractionType.DRINKING_EATING,
                DistractionType.REACHING_BEHIND,
                DistractionType.HAIR_MAKEUP,
                DistractionType.TALKING_PASSENGER,
                DistractionType.FATIGUE_DROWSINESS
              ];
              const randomIndex = Math.floor(Math.random() * possibleDistractions.length);
              const chosenDistraction = possibleDistractions[randomIndex];
              const duration = Math.floor(Math.random() * 5) + 5; // distraction lasts 5 to 9 seconds
              
              autoStateRef.current = {
                state: "distracted",
                secondsLeft: duration,
                currentDistraction: chosenDistraction
              };
              
              // Trigger behavior automatically
              handleSimulateBehavior(chosenDistraction, false);
            } else {
              // Transition from distracted driving back to safe driving
              const duration = Math.floor(Math.random() * 6) + 10; // safe driving lasts 10 to 15 seconds
              
              autoStateRef.current = {
                state: "safe",
                secondsLeft: duration,
                currentDistraction: null
              };
              
              handleSimulateBehavior(null, false);
            }
          }
        }

        // 1. Advance route steps
        routeStepRef.current = (routeStepRef.current + 1) % 150;
        const segmentCount = routePoints.length - 1;
        const totalSteps = 150;
        const stepsPerSegment = totalSteps / segmentCount;
        
        const segmentIndex = Math.floor(routeStepRef.current / stepsPerSegment) % segmentCount;
        const progress = (routeStepRef.current % stepsPerSegment) / stepsPerSegment;
        
        const p1 = routePoints[segmentIndex];
        const p2 = routePoints[segmentIndex + 1] || p1;

        const nextX = Math.round(p1.x + (p2.x - p1.x) * progress);
        const nextY = Math.round(p1.y + (p2.y - p1.y) * progress);
        setVehiclePos({ x: nextX, y: nextY });

        // 2. Check geofence intersections
        let insideZone: GeofenceZone | null = null;
        for (const geo of geofences) {
          if (geo.isActive) {
            const dist = Math.sqrt(Math.pow(nextX - geo.lng, 2) + Math.pow(nextY - geo.lat, 2));
            if (dist <= geo.radius) {
              insideZone = geo;
              break;
            }
          }
        }
        setActiveZone(insideZone);

        // 3. Generate slightly waving telemetry metrics
        setTelemetry((prev) => {
          const baseSpeed = insideZone ? insideZone.speedLimit - 2 : 65;
          const targetSpeed = behavior.activeDistraction ? baseSpeed - 15 : baseSpeed; // slow down slightly when distracted
          const finalSpeed = Math.round(targetSpeed + (Math.random() * 6 - 3));
          
          // Accel and gyro shifts
          const swervingFactor = behavior.activeDistraction ? 2.5 : 0.5;
          const aX = parseFloat((Math.random() * 0.2 - 0.1).toFixed(2)) * swervingFactor;
          const aY = parseFloat((Math.random() * 0.2 - 0.1).toFixed(2)) * swervingFactor;
          const aZ = parseFloat((0.95 + Math.random() * 0.08).toFixed(2));
          const compositeG = parseFloat(Math.sqrt(aX * aX + aY * aY + aZ * aZ).toFixed(2));

          const deviationX = behavior.activeDistraction ? Math.round(Math.sin(Date.now() / 1000) * 120 + (Math.random() * 20 - 10)) : Math.round(Math.random() * 10 - 5);
          const deviationY = behavior.activeDistraction ? Math.round(Math.cos(Date.now() / 1000) * 80 + (Math.random() * 16 - 8)) : Math.round(Math.random() * 8 - 4);

          let gazeOffSeconds = prev.gazeOffRoadSeconds;
          if (behavior.activeDistraction) {
            gazeOffSeconds += 1;
          } else {
            gazeOffSeconds = 0;
          }

          // Trigger automated alarm notifications if thresholds are exceeded
          if (behavior.activeDistraction) {
            const rule = rules.find((r) => r.type === behavior.activeDistraction);
            if (rule && rule.alarmEnabled && gazeOffSeconds >= rule.thresholdSeconds) {
              const alertMsg = `Safety Alert: ${currentDriver.name} - ${rule.voiceAlertMessage}`;
              const alarmExists = alertLogs.some((al) => !al.acknowledged && al.message.includes(behavior.activeDistraction || ""));
              if (!alarmExists) {
                // Dispatch alert log
                setAlertLogs((prevLogs) => [
                  {
                    id: `al-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                    timestamp: new Date().toISOString(),
                    message: alertMsg,
                    severity: AlertSeverity.CRITICAL,
                    acknowledged: false
                  },
                  ...prevLogs
                ]);

                // Create full database incident report
                const newInc: IncidentRecord = {
                  id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                  timestamp: new Date().toISOString(),
                  driverId: currentDriver.id,
                  driverName: currentDriver.name,
                  type: behavior.activeDistraction,
                  severity: AlertSeverity.CRITICAL,
                  speed: finalSpeed,
                  hazardScore: Math.round(80 + Math.random() * 20),
                  proofFrame: `CV camera frame captures ${rule.name.toLowerCase()} for >${rule.thresholdSeconds}s during continuous drive phase.`,
                  acknowledgedByDriver: false
                };
                setIncidents((prevInc) => [newInc, ...prevInc]);

                // Add to geolocated map point logs
                setTripIncidentHistory((prevTrip) => [
                  { x: nextX, y: nextY, type: behavior.activeDistraction || "", timestamp: new Date().toLocaleTimeString() },
                  ...prevTrip
                ]);

                // Update Driver profiles total distracted time and reduce safety risk score
                setDrivers((prevDrivers) => 
                  prevDrivers.map((d) => 
                    d.id === currentDriver.id 
                      ? { 
                          ...d, 
                          totalDistractedSeconds: d.totalDistractedSeconds + 10,
                          riskScore: Math.max(d.riskScore - 5, 45) 
                        } 
                      : d
                  )
                );
              }
            }
          }

          return {
            timestamp: new Date().toISOString(),
            speed: Math.max(finalSpeed, 0),
            heading: (prev.heading + (behavior.activeDistraction ? Math.round(Math.random() * 10 - 5) : Math.round(Math.random() * 2 - 1)) + 360) % 360,
            accelX: aX,
            accelY: aY,
            accelZ: aZ,
            gForce: compositeG,
            gyroX: Math.round(Math.random() * 10 - 5) * swervingFactor,
            gyroY: Math.round(Math.random() * 12 - 6) * swervingFactor,
            gyroZ: Math.round(Math.random() * 6 - 3) * swervingFactor,
            eyeGazeDeviationX: deviationX,
            eyeGazeDeviationY: deviationY,
            gazeOffRoadSeconds: gazeOffSeconds
          };
        });

        // 4. Update total drive time logs on active driver
        setDrivers((prevDrivers) => 
          prevDrivers.map((d) => 
            d.id === activeDriverId 
              ? { ...d, totalDriveTimeSeconds: d.totalDriveTimeSeconds + 1 } 
              : d
          )
        );

      }, 1000 / simulationSpeed);
    }
    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed, behavior, activeDriverId, geofences, rules, alertLogs, currentDriver, isAutoInference, webcamActive]);

  // Handle computer vision behavior simulation selection
  const handleSimulateBehavior = (type: DistractionType | null, isManual: boolean = true) => {
    if (isManual && !webcamActive) {
      return; // Ignore manual overrides when live camera is OFF
    }
    if (isManual) {
      setIsAutoInference(false);
    }
    if (type === null) {
      setBehavior({
        isEyesOnRoad: true,
        isHoldingPhone: false,
        isEatingDrinking: false,
        isHandsOnWheel: true,
        isDrowsy: false,
        activeDistraction: null
      });
    } else {
      // Determine secondary visual parameters dynamically for the 11-class QNN+VQC model
      const isEyesOnRoad = ![
        DistractionType.TEXTING_RIGHT,
        DistractionType.TEXTING_LEFT,
        DistractionType.ADJUSTING_RADIO,
        DistractionType.REACHING_BEHIND,
        DistractionType.HAIR_MAKEUP,
        DistractionType.TALKING_PASSENGER
      ].includes(type);

      const isHoldingPhone = [
        DistractionType.TEXTING_RIGHT,
        DistractionType.PHONE_CALL_RIGHT,
        DistractionType.TEXTING_LEFT,
        DistractionType.PHONE_CALL_LEFT
      ].includes(type);

      const isEatingDrinking = type === DistractionType.DRINKING_EATING;

      const isHandsOnWheel = ![
        DistractionType.TEXTING_RIGHT,
        DistractionType.PHONE_CALL_RIGHT,
        DistractionType.TEXTING_LEFT,
        DistractionType.PHONE_CALL_LEFT,
        DistractionType.DRINKING_EATING,
        DistractionType.REACHING_BEHIND,
        DistractionType.HAIR_MAKEUP
      ].includes(type);

      const isDrowsy = type === DistractionType.FATIGUE_DROWSINESS;

      setBehavior({
        isEyesOnRoad,
        isHoldingPhone,
        isEatingDrinking,
        isHandsOnWheel,
        isDrowsy,
        activeDistraction: type
      });
    }
  };

  // Add a brand new driver profile record
  const handleAddDriver = (name: string, license: string) => {
    const newDrv: DriverProfile = {
      id: `drv-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      name,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      licenseNumber: license,
      totalTrips: 1,
      totalDistractedSeconds: 0,
      totalDriveTimeSeconds: 3600,
      riskScore: 90,
      status: "Active",
      activeVehicleId: "veh-1"
    };
    setDrivers((prev) => [...prev, newDrv]);
    setActiveDriverId(newDrv.id);
  };

  // Add new geofence zone boundary
  const handleAddGeofence = (name: string, x: number, y: number, radius: number, speedLimit: number) => {
    const newGeo: GeofenceZone = {
      id: `geo-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      name,
      lat: y,
      lng: x,
      radius,
      isActive: true,
      speedLimit,
      violationCount: 0
    };
    setGeofences((prev) => [...prev, newGeo]);
  };

  // Manual Intervention send by dispatcher
  const handleSendCustomAlert = (message: string, severity: AlertSeverity) => {
    const newAlert = {
      id: `al-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date().toISOString(),
      message: `Dispatcher Push: ${message}`,
      severity,
      acknowledged: false
    };
    setAlertLogs((prev) => [newAlert, ...prev]);

    // Add incident log
    const newInc: IncidentRecord = {
      id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date().toISOString(),
      driverId: currentDriver.id,
      driverName: currentDriver.name,
      type: DistractionType.TALKING_PASSENGER,
      severity,
      speed: telemetry.speed,
      hazardScore: severity === AlertSeverity.CRITICAL ? 90 : 45,
      proofFrame: `Operator manual intervention dispatched: "${message}"`,
      acknowledgedByDriver: false
    };
    setIncidents((prev) => [newInc, ...prev]);
  };

  // Handle slide update for rules configurator
  const handleUpdateRuleThreshold = (id: string, value: number) => {
    setRules((prevRules) => 
      prevRules.map((r) => r.id === id ? { ...r, thresholdSeconds: value } : r)
    );
  };

  // Toggle rule audio alarm warning
  const handleToggleRuleAlarm = (id: string) => {
    setRules((prevRules) => 
      prevRules.map((r) => r.id === id ? { ...r, alarmEnabled: !r.alarmEnabled } : r)
    );
  };

  // Assign Driver to a specific Fleet vehicle
  const handleAssignDriver = (vehicleId: string, driverId: string) => {
    setVehicles((prevVeh) => 
      prevVeh.map((v) => v.id === vehicleId ? { ...v, currentDriverId: driverId } : v)
    );
  };

  // Acknowledge / resolve alert log alarms
  const handleResolveAlert = (id: string) => {
    setAlertLogs((prev) => 
      prev.map((al) => al.id === id ? { ...al, acknowledged: true } : al)
    );
  };

  // Resolve incident rows
  const handleResolveIncident = (id: string) => {
    setIncidents((prev) => 
      prev.map((inc) => inc.id === id ? { ...inc, acknowledgedByDriver: true } : inc)
    );
  };

  if (!user) {
    return <AuthScreen onLoginSuccess={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none antialiased print:bg-white print:text-slate-950">
      
      {/* HEADER BAR */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-6 py-4 flex items-center justify-between print:hidden shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2 rounded-lg text-slate-100 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase">
              Driver Monitoring System
            </h1>
            <p className="text-[9px] text-indigo-600 font-semibold tracking-wider uppercase font-mono">
              Distracted Driving Behavior Detection
            </p>
          </div>
        </div>

        {/* Global system statuses */}
        <div className="flex items-center gap-6 text-xs">
          <div className="hidden md:flex items-center gap-2 border-r border-slate-200 pr-6">
            <span className="flex items-center space-x-2 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono">SYSTEM ACTIVE</span>
            </span>
          </div>
          {user?.role !== "admin" && (
            <>
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-slate-400 font-mono">Active Driver:</span>
                <span className="font-bold text-slate-700">{currentDriver.name}</span>
              </div>
              <div className="hidden lg:flex items-center gap-2 pr-4 border-r border-slate-200">
                <span className="text-slate-400 font-mono">Active Vehicle:</span>
                <span className="font-bold text-slate-700 font-mono">{currentVehicle.plateNumber}</span>
              </div>
            </>
          )}

          {/* User profile & Sign Out */}
          {user && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab(DashboardTab.PROFILE)}
                className="flex flex-col text-right group cursor-pointer hover:opacity-85 text-left transition-opacity"
              >
                <div className="flex items-center gap-1.5 justify-end">
                  {user.role === "admin" ? (
                    <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider group-hover:bg-indigo-500/15">
                      CHIEF
                    </span>
                  ) : (
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider group-hover:bg-emerald-500/15">
                      DRIVER
                    </span>
                  )}
                  <span className="text-[11px] font-extrabold text-slate-800 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{user.name}</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono leading-none mt-1 group-hover:text-slate-500 transition-colors">{user.email}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("dms_auth_user");
                  setUser(null);
                }}
                className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 border border-slate-200 rounded text-[9px] font-bold font-mono tracking-tight uppercase cursor-pointer transition-all active:scale-95"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* PRINT BANNER (Hidden on UI, shown on print exports) */}
      <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-6 bg-slate-50 text-slate-900">
        <h1 className="text-2xl font-black uppercase tracking-wider">Distracted Driving Safety Compliance Report</h1>
        <p className="text-sm font-mono text-slate-600">Generated on {new Date().toLocaleString()} | FMS Compliance Standard V4</p>
        <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
          <div>
            <strong>Driver Profile:</strong> {currentDriver.name} ({currentDriver.licenseNumber})
          </div>
          <div>
            <strong>Vehicle Unit:</strong> {currentVehicle.model} ({currentVehicle.plateNumber})
          </div>
          <div>
            <strong>Audit Safety Score:</strong> {currentDriver.riskScore}/100
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 print:block">
        
        {/* SIDE NAVIGATION (Hidden on Print) */}
        <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-850 bg-slate-900 p-4 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible print:hidden text-slate-300">
          <span className="hidden md:block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-3">
            Navigation Desk
          </span>

          <button
            onClick={() => setActiveTab(DashboardTab.LIVE_MONITOR)}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === DashboardTab.LIVE_MONITOR 
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-600/20 shadow-sm font-bold" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Live Monitor HUD
          </button>

          {user?.role === "admin" && (
            <>
              <button
                onClick={() => setActiveTab(DashboardTab.DRIVERS)}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === DashboardTab.DRIVERS 
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-600/20 shadow-sm font-bold" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 21c-2.916 0-5.643-.961-7.842-2.583v-.108m12-4.18c.995-.103 1.99-.188 2.996-.254m0 0A5.92 5.92 0 1018 8a5.962 5.962 0 00-2.012 4.385m-1.786-.062A5.922 5.922 0 0110 14.25a5.92 5.92 0 01-5.714-4.59M10 14.25a8.9 8.9 0 00-3.125-.558 8.9 8.9 0 00-2.999.522m4.125-10.25a3 3 0 11-6 0 3 3 0 016 0zm12.75 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                Driver Directory
              </button>

              <button
                onClick={() => setActiveTab(DashboardTab.FLEET)}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === DashboardTab.FLEET 
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-600/20 shadow-sm font-bold" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25M3 14.25h14.25M3 14.25V11.25M17.25 14.25V11.25M3 11.25l1.9-5.7a1.125 1.125 0 011.06-.75h11.96a1.125 1.125 0 011.06.75l1.9 5.7M7.5 12h9" />
                </svg>
                Fleet Vehicle Units
              </button>

              <button
                onClick={() => setActiveTab(DashboardTab.GEOFENCES)}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === DashboardTab.GEOFENCES 
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-600/20 shadow-sm font-bold" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.61c-.38.19-.622.58-.622 1.006v10.3c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
                Geofence Zones Map
              </button>

              <button
                onClick={() => setActiveTab(DashboardTab.ANALYTICS)}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === DashboardTab.ANALYTICS 
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-600/20 shadow-sm font-bold" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                </svg>
                Historical Analytics
              </button>

              <button
                onClick={() => setActiveTab(DashboardTab.AUDIT_LOGS)}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === DashboardTab.AUDIT_LOGS 
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-600/20 shadow-sm font-bold" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Incident Audit table
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab(DashboardTab.AI_COACH)}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === DashboardTab.AI_COACH 
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-600/20 shadow-sm font-bold" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l3.594-4.83m5.594-11.03a9 9 0 11-13.722 5.513L3 21l3.594-4.83A9 9 0 0118 6.75v-.321M16.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
            AI Safety Coach
          </button>

          <button
            onClick={() => setActiveTab(DashboardTab.PROFILE)}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
              activeTab === DashboardTab.PROFILE 
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-600/20 shadow-sm font-bold" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            My Profile
          </button>



          {/* Quick simulator running controls */}
          <div className="hidden md:block mt-auto bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
            <span className="text-[9px] font-mono text-slate-500 block uppercase mb-2">Sim Controller</span>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`w-full py-1.5 px-2 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ${
                  isSimulating 
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20" 
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                }`}
              >
                {isSimulating ? "PAUSE SIMULATION" : "START SIMULATION"}
              </button>

              <div className="flex gap-1 justify-between">
                {[1, 2, 5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSimulationSpeed(spd)}
                    className={`flex-1 text-[9px] font-mono py-1 rounded border transition-all cursor-pointer ${
                      simulationSpeed === spd 
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-bold" 
                        : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* WORKSPACE FEED PANEL */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 print:p-0 print:bg-white print:overflow-visible">
          
          {/* TAB 1: LIVE MONITOR DASHBOARD (MAIN GRID LAYOUT) */}
          {activeTab === DashboardTab.LIVE_MONITOR && (
            <div className="space-y-6">
              
              {/* Bento Grid layout matching Module 1, 2, 3, 5 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Module 2: Computer Vision Monitor (Span 7) */}
                <div className="lg:col-span-7">
                  <CVMonitor 
                    behavior={behavior} 
                    gazeX={telemetry.eyeGazeDeviationX}
                    gazeY={telemetry.eyeGazeDeviationY}
                    onSimulateBehavior={handleSimulateBehavior}
                    isAutoInference={isAutoInference}
                    setIsAutoInference={setIsAutoInference}
                    webcamActive={webcamActive}
                    setWebcamActive={setWebcamActive}
                  />
                </div>

                {/* Module 3: Active Alerts & HUD (Span 5) */}
                <div className="lg:col-span-5">
                  <AlertDispatcher 
                    activeDistraction={behavior.activeDistraction}
                    onSendCustomAlert={handleSendCustomAlert}
                    recentAlertLogs={alertLogs}
                    onResolveAlert={handleResolveAlert}
                    onClearAllAlerts={() => setAlertLogs([])}
                  />
                </div>
              </div>

              {/* Module 1: Live Telemetry Gauges */}
              <div>
                <TelemetryGauges telemetry={telemetry} />
              </div>

              {/* Second row: Map & Rules */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Module 5: Geofence Active Coordinator (Span 6) */}
                <div className="lg:col-span-6">
                  <GeofenceMap 
                    geofences={geofences}
                    vehiclePos={vehiclePos}
                    onAddGeofence={handleAddGeofence}
                    currentZone={activeZone}
                  />
                </div>

                {/* Module 9: Route playback trip mapping (Span 6) */}
                <div className="lg:col-span-6">
                  <RouteReplay 
                    vehiclePos={vehiclePos}
                    isSimulating={isSimulating}
                    onToggleSimulation={() => setIsSimulating(!isSimulating)}
                    onResetSimulation={() => {
                      routeStepRef.current = 0;
                      setVehiclePos({ x: 10, y: 15 });
                      setTripIncidentHistory([]);
                    }}
                    simulationSpeed={simulationSpeed}
                    onSetSpeed={setSimulationSpeed}
                    incidentHistory={tripIncidentHistory}
                  />
                </div>
              </div>

              {/* Quick Config Alert thresholds (Module 10) */}
              <div>
                <RulesManager 
                  rules={rules} 
                  onUpdateRuleThreshold={handleUpdateRuleThreshold}
                  onToggleRuleAlarm={handleToggleRuleAlarm}
                />
              </div>

            </div>
          )}

          {/* TAB 2: DRIVER DIRECTORY PANEL */}
          {activeTab === DashboardTab.DRIVERS && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <DriverProfiles 
                  drivers={drivers}
                  activeDriverId={activeDriverId}
                  onSelectDriver={setActiveDriverId}
                  onAddDriver={handleAddDriver}
                />
              </div>
              <div className="lg:col-span-8">
                {/* Mini analytics overview for current active driver */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">DRIVER PERFORMANCE IN-DEPTH</span>
                  <h3 className="text-lg font-bold text-slate-800 mt-0.5">{currentDriver.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Status: <span className="text-emerald-600 font-semibold">{currentDriver.status}</span> | License Number: {currentDriver.licenseNumber}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 block uppercase">Drive Focus Index</span>
                      <span className="text-2xl font-black text-slate-800 font-mono">{currentDriver.riskScore}/100</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 block uppercase">Total Trips Completed</span>
                      <span className="text-2xl font-black text-slate-800 font-mono">{currentDriver.totalTrips}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 block uppercase">Violations Accrued</span>
                      <span className="text-2xl font-black text-rose-600 font-mono">
                        {incidents.filter(inc => inc.driverId === currentDriver.id).length}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 block uppercase">Continuous Driving Time</span>
                      <span className="text-2xl font-black text-slate-800 font-mono">
                        {(currentDriver.totalDriveTimeSeconds / 3600).toFixed(1)} hrs
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-200 pt-6">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4">Focus Deficit Log History</h4>
                    <div className="space-y-3">
                      {incidents.filter(inc => inc.driverId === currentDriver.id).length === 0 ? (
                        <div className="text-slate-400 font-mono text-xs py-4">No violations logged for this driver. Keep up the high safety focus!</div>
                      ) : (
                        incidents.filter(inc => inc.driverId === currentDriver.id).map(inc => (
                          <div key={inc.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                            <div>
                              <span className="text-[9px] font-mono text-slate-400 block">{new Date(inc.timestamp).toLocaleDateString()}</span>
                              <span className="font-semibold text-slate-700">{inc.type}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600">{inc.severity}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FLEET MANAGEMENT UNITS */}
          {activeTab === DashboardTab.FLEET && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <FleetManager 
                  vehicles={vehicles}
                  drivers={drivers}
                  activeVehicleId={activeVehicleId}
                  onSelectVehicle={setActiveVehicleId}
                  onAssignDriver={handleAssignDriver}
                />
              </div>
              <div className="lg:col-span-8">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Vehicle Unit Performance Profile</span>
                  <h3 className="text-lg font-bold text-slate-800 mt-0.5">{currentVehicle.model}</h3>
                  <p className="text-xs text-slate-500 mt-1">Plate Number: {currentVehicle.plateNumber} | Connection Speed: <span className="text-emerald-600 font-semibold">{currentVehicle.signalStrength}</span></p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60">
                      <span className="text-xs text-slate-500 block">Unit Hardware Status</span>
                      <span className="text-sm font-bold text-emerald-600">ONLINE & SYNCED</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60">
                      <span className="text-xs text-slate-500 block">Camera Calibration</span>
                      <span className="text-sm font-bold text-emerald-600">CALIBRATED (99.8%)</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60">
                      <span className="text-xs text-slate-500 block">GPS Coordinates Grid</span>
                      <span className="text-sm font-bold text-slate-700 font-mono">{vehiclePos.x}°N, {vehiclePos.y}°W</span>
                    </div>
                  </div>

                  <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200/60">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">FMS Cabin Sensor Diagnostic check</h4>
                    <ul className="space-y-2 text-xs text-slate-600 font-mono">
                      <li className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span>● Dual-gaze eye-tracking sensor:</span>
                        <span className="text-emerald-600 font-bold">OPERATIONAL</span>
                      </li>
                      <li className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span>● Tri-axial Accelerometer & Gyro:</span>
                        <span className="text-emerald-600 font-bold">OPERATIONAL</span>
                      </li>
                      <li className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span>● Cabin microphone synthesizer:</span>
                        <span className="text-emerald-600 font-bold">OPERATIONAL</span>
                      </li>
                      <li className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span>● Geofence radar ping interval:</span>
                        <span className="text-emerald-600 font-bold">100ms</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GEOFENCES MAP VIEWS */}
          {activeTab === DashboardTab.GEOFENCES && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <GeofenceMap 
                  geofences={geofences}
                  vehiclePos={vehiclePos}
                  onAddGeofence={handleAddGeofence}
                  currentZone={activeZone}
                />
              </div>
              <div className="lg:col-span-6">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full text-slate-900">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider border-b border-slate-200 pb-2">Active Geofencing Policies</h3>
                  <div className="space-y-4 text-xs">
                    <p className="text-slate-500 leading-relaxed">
                      Geofences regulate target speeds and fatigue triggers automatically when vehicles cross coordinate vectors. Clicking the map inside Module 5 instantly creates a new zone.
                    </p>

                    <div className="space-y-3">
                      {geofences.map((geo) => (
                        <div key={geo.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-slate-700">{geo.name}</h4>
                            <span className="bg-sky-500/10 text-sky-600 font-mono text-[9px] px-1.5 py-0.5 rounded border border-sky-500/20">
                              {geo.speedLimit} km/h max
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-slate-500 font-mono">
                            <span>GRID LAT: {geo.lat}</span>
                            <span>GRID LNG: {geo.lng}</span>
                            <span>RADIUS: {geo.radius}%</span>
                            <span className="text-rose-600 font-bold">VIOLATIONS: {geo.violationCount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HISTORICAL ANALYTICS CHARTS */}
          {activeTab === DashboardTab.ANALYTICS && (
            <div>
              <AnalyticsView distractionSeconds={{
                phoneUsageSeconds: currentDriver.totalDistractedSeconds * 0.2,
                gazeOffRoadSeconds: currentDriver.totalDistractedSeconds * 0.4,
                drowsySeconds: currentDriver.totalDistractedSeconds * 0.1,
                handsOffSeconds: currentDriver.totalDistractedSeconds * 0.2,
                eatingDrinkingSeconds: currentDriver.totalDistractedSeconds * 0.1
              }} />
            </div>
          )}

          {/* TAB 6: INCIDENT COGNITIVE AUDIT TABLE */}
          {activeTab === DashboardTab.AUDIT_LOGS && (
            <div>
              <IncidentAudit 
                incidents={incidents}
                onAcknowledgeIncident={handleResolveIncident}
              />
            </div>
          )}

          {/* TAB 7: AI SAFETY COACH EVALUATION */}
          {activeTab === DashboardTab.AI_COACH && (
            <div>
              <SafetyCoach 
                driver={currentDriver}
                incidents={incidents}
                phoneUsageSeconds={Math.round(currentDriver.totalDistractedSeconds * 0.2)}
                gazeOffRoadSeconds={Math.round(currentDriver.totalDistractedSeconds * 0.4)}
                drowsySeconds={Math.round(currentDriver.totalDistractedSeconds * 0.1)}
                handsOffSeconds={Math.round(currentDriver.totalDistractedSeconds * 0.2)}
                eatingDrinkingSeconds={Math.round(currentDriver.totalDistractedSeconds * 0.1)}
              />
            </div>
          )}

          {/* TAB 8: SUPABASE DATABASE SYNC PANEL */}
          {activeTab === DashboardTab.DATABASE && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg border border-emerald-100 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Supabase Backend Sync Desk</h3>
                      <p className="text-xs text-slate-500">Live operational link with project ID: <span className="font-mono text-indigo-600 font-semibold">rjmwkltkltcgzluptbpq</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {dbStatus?.success && Object.values(dbStatus.results).every((r: any) => r.status === "connected") ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold font-mono bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        SUPABASE ACTIVE & SYNCED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold font-mono bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        SUPABASE ACTIVE (HYBRID FALLBACK)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Left Column: Connection Details & Table Checkers */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-mono">1. Integration Parameters</h4>
                    <div className="bg-slate-50 border border-slate-200/85 rounded-lg p-4 space-y-3 font-mono text-[11px] text-slate-600">
                      <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="text-slate-400">PROJECT URL:</span>
                        <span className="font-semibold text-slate-850">https://rjmwkltkltcgzluptbpq.supabase.co</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="text-slate-400">PUBLIC API KEY:</span>
                        <span className="font-semibold text-slate-850 truncate max-w-[180px]" title="sb_publishable_Iyg6OrOz8uNnDJqlb4ZlDg_PvbYcxsc">sb_publishable_...ZlDg_PvbYcxsc</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="text-slate-400">SECRET ROLE KEY:</span>
                        <span className="font-semibold text-slate-850 truncate max-w-[180px]" title="Hide">Hide</span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-slate-400">ACTIVE STORAGE:</span>
                        <span className="font-semibold text-indigo-600">Double-Cased JSON Upsert Sync</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-mono pt-2">2. Database Table Diagnostics</h4>
                    <div className="space-y-2">
                      {dbStatus?.results ? (
                        Object.entries(dbStatus.results).map(([table, details]: [string, any]) => (
                          <div key={table} className="flex items-center justify-between p-2.5 rounded-lg border text-xs bg-slate-50 border-slate-200/80">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-700">{table}</span>
                              <span className="text-[10px] text-slate-400">({details.count || 0} rows synced)</span>
                            </div>
                            {details.status === "connected" ? (
                              <span className="text-[10px] font-mono font-bold text-emerald-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                CONNECTED
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-rose-500 flex items-center gap-1" title={details.error}>
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                FALLBACK ACTIVE
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 italic py-4">Checking database connection diagnostics...</div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: SQL Schema setup builder */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-mono">3. Schema Initialization Script</h4>
                      <button
                        onClick={() => {
                          const sqlCode = document.getElementById("ddl-schema-code")?.innerText || "";
                          navigator.clipboard.writeText(sqlCode);
                          alert("SQL Schema script successfully copied to clipboard! Paste it inside your Supabase SQL Editor and run it.");
                        }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 py-1 px-2.5 rounded text-[11px] font-mono font-bold cursor-pointer transition shadow-sm"
                      >
                        COPY SQL SCRIPT
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      If the diagnostics on the left show <strong>FALLBACK ACTIVE</strong>, copy the SQL schema script below and paste it in your Supabase SQL Editor to automatically create the table structures.
                    </p>

                    <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-lg p-4 font-mono text-[10px] h-[330px] overflow-y-auto leading-relaxed shadow-inner">
                      <pre id="ddl-schema-code">{`-- SQL script to set up Driver Monitoring System tables in Supabase (with camelCase columns)

CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id" TEXT,
  "email" TEXT PRIMARY KEY,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "profile_completed" BOOLEAN DEFAULT FALSE,
  "phone" TEXT,
  "license_number" TEXT,
  "vehicle_plate" TEXT,
  "vehicle_model" TEXT,
  "avatar" TEXT
);

CREATE TABLE IF NOT EXISTS "drivers" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "avatar" TEXT,
  "licenseNumber" TEXT,
  "totalTrips" INTEGER DEFAULT 0,
  "totalDistractedSeconds" INTEGER DEFAULT 0,
  "totalDriveTimeSeconds" INTEGER DEFAULT 0,
  "riskScore" INTEGER DEFAULT 100,
  "status" TEXT DEFAULT 'Active',
  "activeVehicleId" TEXT
);

CREATE TABLE IF NOT EXISTS "vehicles" (
  "id" TEXT PRIMARY KEY,
  "plateNumber" TEXT NOT NULL,
  "model" TEXT,
  "currentDriverId" TEXT,
  "signalStrength" TEXT DEFAULT 'Excellent',
  "status" TEXT DEFAULT 'Online'
);

CREATE TABLE IF NOT EXISTS "geofences" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "radius" DOUBLE PRECISION NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "speedLimit" INTEGER DEFAULT 45,
  "violationCount" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "rules" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "thresholdSeconds" DOUBLE PRECISION NOT NULL,
  "alarmEnabled" BOOLEAN DEFAULT TRUE,
  "voiceAlertMessage" TEXT
);

CREATE TABLE IF NOT EXISTS "incidents" (
  "id" TEXT PRIMARY KEY,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "driverId" TEXT NOT NULL,
  "driverName" TEXT,
  "type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "speed" INTEGER DEFAULT 0,
  "hazardScore" INTEGER DEFAULT 0,
  "proofFrame" TEXT,
  "acknowledgedByDriver" BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS "alert_logs" (
  "id" TEXT PRIMARY KEY,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "message" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "acknowledged" BOOLEAN DEFAULT FALSE
);`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: USER & ADMIN PROFILE TAB */}
          {activeTab === DashboardTab.PROFILE && user && (
            <div className="space-y-6">
              <ProfileTab 
                user={user} 
                onUpdateSuccess={(updatedUser) => {
                  setUser({
                    ...user,
                    ...updatedUser
                  });
                }} 
              />
            </div>
          )}

        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-slate-400 print:hidden shrink-0 shadow-sm mt-auto">
        <span>© 2026 DISTRACTEDDRIVE • Safety Dashboard Enterprise Edition</span>
        <span>Secure Fleet Synced • COMPLIANCE AUTHORITY ID: #FMS-9821</span>
      </footer>

    </div>
  );
}
