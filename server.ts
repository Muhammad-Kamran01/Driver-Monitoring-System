import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { 
  INITIAL_DRIVERS, 
  INITIAL_VEHICLES, 
  INITIAL_GEOFENCES, 
  INITIAL_RULES, 
  INITIAL_INCIDENTS 
} from "./src/data/mockData";

dotenv.config();

// Supabase Client Setup
const supabaseUrl = process.env.SUPABASE_URL || "https://rjmwkltkltcgzluptbpq.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// In-Memory Fallback DB Store in case Supabase tables are not created or connection fails
let MEMORY_DB = {
  user_profiles: [
    { email: "admin@safety.com", password: "admin123", name: "Dispatcher Chief", role: "admin", profile_completed: true },
    { 
      email: "driver@fleet.com", 
      password: "driver123", 
      name: "Marcus Thompson", 
      role: "driver", 
      profile_completed: true, 
      phone: "+1 (555) 192-3831", 
      license_number: "DL-849204", 
      vehicle_plate: "TX-883-SAF", 
      vehicle_model: "Freightliner Cascadia" 
    },
    { email: "newuser@safety.com", password: "user123", name: "New Operator Profile", role: "driver", profile_completed: false }
  ],
  drivers: [
    {
      id: "drv-driver-fleet-com",
      name: "Marcus Thompson",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      licenseNumber: "DL-849204",
      totalTrips: 12,
      totalDistractedSeconds: 154,
      totalDriveTimeSeconds: 43200,
      riskScore: 84,
      status: "Active",
      activeVehicleId: "veh-driver-fleet-com"
    }
  ],
  vehicles: [
    {
      id: "veh-driver-fleet-com",
      plateNumber: "TX-883-SAF",
      model: "Freightliner Cascadia",
      currentDriverId: "drv-driver-fleet-com",
      signalStrength: "Excellent",
      status: "Online"
    }
  ],
  geofences: JSON.parse(JSON.stringify(INITIAL_GEOFENCES)),
  rules: JSON.parse(JSON.stringify(INITIAL_RULES)),
  incidents: [],
  alertLogs: []
};

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Authenticate user with role-based validation (Supabase + local memory fallback)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required" });
      }

      // 1. Try checking in Supabase
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (error) {
          console.warn("Supabase auth lookup error, checking memory database:", error.message);
        } else if (data) {
          if (data.password === password) {
            let avatar = data.avatar;
            if (!avatar && data.role !== "admin") {
              const driverId = `drv-${email.toLowerCase().replace(/[@.]/g, "-")}`;
              try {
                const { data: driverData } = await supabase
                  .from("drivers")
                  .select("avatar")
                  .eq("id", driverId)
                  .maybeSingle();
                if (driverData && driverData.avatar) {
                  avatar = driverData.avatar;
                }
              } catch (drvFetchErr) {
                console.warn("Failed to fetch fallback driver avatar:", drvFetchErr);
              }
            }
            return res.json({ success: true, user: { ...data, avatar }, source: "Supabase Database" });
          } else {
            return res.status(401).json({ success: false, error: "Invalid security passcode or password" });
          }
        }
      } catch (err: any) {
        console.warn("Failed to query user_profiles in Supabase, using local memory store:", err.message);
      }

      // 2. Fallback to MEMORY_DB
      const matched = MEMORY_DB.user_profiles.find(
        (u: any) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (matched) {
        if (matched.password === password) {
          return res.json({ success: true, user: matched, source: "Local Memory Cache" });
        } else {
          return res.status(401).json({ success: false, error: "Invalid security passcode or password" });
        }
      }

      return res.status(404).json({ success: false, error: "No registered operator account found with this email" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Register a new user (Supabase + local memory fallback)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ success: false, error: "All fields are required" });
      }

      const newUser = {
        id: `usr-${Date.now()}`,
        email: email.toLowerCase(),
        password,
        name,
        role: "driver",
        profile_completed: false
      };

      let registeredInSupabase = false;

      // 1. Try register in Supabase
      try {
        // Check if user already exists in user_profiles
        const { data: existing } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (existing) {
          return res.status(400).json({ success: false, error: "This email address is already registered." });
        }

        const { error } = await supabase.from("user_profiles").insert([newUser]);
        if (!error) {
          registeredInSupabase = true;
        } else {
          console.error("Supabase insert error:", error.message);
        }
      } catch (err: any) {
        console.warn("Supabase registration issue, adding to local memory database:", err.message);
      }

      // 2. Always register in MEMORY_DB
      const memExists = MEMORY_DB.user_profiles.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (memExists) {
        return res.status(400).json({ success: false, error: "This email address is already registered." });
      }

      MEMORY_DB.user_profiles.push(newUser);

      res.json({
        success: true,
        user: newUser,
        synced: registeredInSupabase
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Complete profile & associate driver & vehicle (Supabase + local memory fallback)
  app.post("/api/auth/complete-profile", async (req, res) => {
    try {
      const { email, name, phone, license_number, vehicle_plate, vehicle_model } = req.body;
      if (!email || !phone || !license_number || !vehicle_plate || !vehicle_model) {
        return res.status(400).json({ success: false, error: "All fields are required" });
      }

      const driverId = `drv-${email.toLowerCase().replace(/[@.]/g, "-")}`;
      const vehicleId = `veh-${email.toLowerCase().replace(/[@.]/g, "-")}`;

      const updatedProfile = {
        profile_completed: true,
        phone,
        license_number,
        vehicle_plate,
        vehicle_model
      };

      let syncedWithSupabase = false;

      // 1. Try update in Supabase
      try {
        const { error: profileErr } = await supabase
          .from("user_profiles")
          .update(updatedProfile)
          .eq("email", email.toLowerCase());

        if (!profileErr) {
          // Sync new driver & vehicle to tables as real non-dummy records!
          const newDriver = {
            id: driverId,
            name: name,
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            licenseNumber: license_number,
            totalTrips: 0,
            totalDistractedSeconds: 0,
            totalDriveTimeSeconds: 0,
            riskScore: 100,
            status: "Active",
            activeVehicleId: vehicleId
          };

          const newVehicle = {
            id: vehicleId,
            plateNumber: vehicle_plate,
            model: vehicle_model,
            currentDriverId: driverId,
            signalStrength: "Excellent",
            status: "Online"
          };

          const { error: drvErr } = await supabase.from("drivers").upsert([newDriver]);
          const { error: vehErr } = await supabase.from("vehicles").upsert([newVehicle]);

          if (!drvErr && !vehErr) {
            syncedWithSupabase = true;
          } else {
            console.warn("Drivers/Vehicles sync warning:", drvErr?.message, vehErr?.message);
          }
        } else {
          console.warn("Profile update failed in Supabase:", profileErr.message);
        }
      } catch (err: any) {
        console.warn("Supabase profile completion exception, relying on local memory fallback:", err.message);
      }

      // 2. Always update local MEMORY_DB
      const userIdx = MEMORY_DB.user_profiles.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (userIdx !== -1) {
        MEMORY_DB.user_profiles[userIdx] = {
          ...MEMORY_DB.user_profiles[userIdx],
          ...updatedProfile,
          role: MEMORY_DB.user_profiles[userIdx].role || "driver"
        };
      }

      const newDriver = {
        id: driverId,
        name: name,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        licenseNumber: license_number,
        totalTrips: 0,
        totalDistractedSeconds: 0,
        totalDriveTimeSeconds: 0,
        riskScore: 100,
        status: "Active",
        activeVehicleId: vehicleId
      };

      const newVehicle = {
        id: vehicleId,
        plateNumber: vehicle_plate,
        model: vehicle_model,
        currentDriverId: driverId,
        signalStrength: "Excellent",
        status: "Online"
      };

      if (!MEMORY_DB.drivers.some(d => d.id === driverId)) {
        MEMORY_DB.drivers.push(newDriver);
      }
      if (!MEMORY_DB.vehicles.some(v => v.id === vehicleId)) {
        MEMORY_DB.vehicles.push(newVehicle);
      }

      const completeUser = {
        email,
        name,
        role: MEMORY_DB.user_profiles[userIdx]?.role || "driver",
        ...updatedProfile
      };

      res.json({
        success: true,
        user: completeUser,
        synced: syncedWithSupabase
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Reset secure passcode / password (Supabase + local memory fallback)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required" });
      }

      let updatedInSupabase = false;

      // 1. Try Supabase update
      try {
        const { error } = await supabase
          .from("user_profiles")
          .update({ password })
          .eq("email", email.toLowerCase());

        if (!error) {
          updatedInSupabase = true;
        }
      } catch (err: any) {
        console.warn("Supabase password reset failed, using memory fallback:", err.message);
      }

      // 2. Always update MEMORY_DB
      const matched = MEMORY_DB.user_profiles.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        matched.password = password;
        return res.json({ success: true, synced: updatedInSupabase });
      }

      return res.status(404).json({ success: false, error: "No registered operator found with that email address" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Update Profile details (both Admin and Driver)
  app.post("/api/auth/update-profile", async (req, res) => {
    try {
      const { email, name, phone, license_number, vehicle_plate, vehicle_model, avatar } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Email is required" });
      }

      let finalAvatarUrl = avatar;

      // Check if avatar is a base64 DataURL (starts with "data:image/" or similar)
      if (avatar && avatar.startsWith("data:")) {
        try {
          const matches = avatar.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const contentType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, "base64");
            
            // Determine file extension
            let extension = "png";
            if (contentType.includes("jpeg") || contentType.includes("jpg")) {
              extension = "jpg";
            } else if (contentType.includes("gif")) {
              extension = "gif";
            } else if (contentType.includes("svg")) {
              extension = "svg";
            } else if (contentType.includes("webp")) {
              extension = "webp";
            }

            // Create unique filename based on email and timestamp
            const fileSlug = email.toLowerCase().replace(/[@.]/g, "-");
            const fileName = `avatars/${fileSlug}-${Date.now()}.${extension}`;

            console.log(`Uploading avatar buffer (${buffer.length} bytes) to Supabase Storage: ${fileName}`);

            // Upload buffer to Supabase Storage
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from("profile-pictures")
              .upload(fileName, buffer, {
                contentType,
                upsert: true
              });

            if (uploadErr) {
              console.error("Supabase Storage upload error:", uploadErr.message);
            } else {
              // Successfully uploaded! Now get public URL
              const { data: publicUrlData } = supabase.storage
                .from("profile-pictures")
                .getPublicUrl(fileName);
              
              if (publicUrlData && publicUrlData.publicUrl) {
                finalAvatarUrl = publicUrlData.publicUrl;
                console.log("Successfully uploaded avatar to Supabase storage. Public URL:", finalAvatarUrl);
              }
            }
          }
        } catch (uploadException: any) {
          console.error("Failed to upload avatar to storage bucket:", uploadException.message);
        }
      }

      const updatedFields: any = { name };
      if (phone !== undefined) updatedFields.phone = phone;
      if (license_number !== undefined) updatedFields.license_number = license_number;
      if (vehicle_plate !== undefined) updatedFields.vehicle_plate = vehicle_plate;
      if (vehicle_model !== undefined) updatedFields.vehicle_model = vehicle_model;
      if (finalAvatarUrl !== undefined) updatedFields.avatar = finalAvatarUrl;

      let syncedWithSupabase = false;

      // 1. Try update in Supabase
      try {
        let { error: profileErr } = await supabase
          .from("user_profiles")
          .update(updatedFields)
          .eq("email", email.toLowerCase());

        if (profileErr && (profileErr.message?.includes("avatar") || profileErr.details?.includes("avatar") || profileErr.message?.includes("column"))) {
          // Schema does not have avatar column. Retry update without avatar.
          const { avatar: _, ...fieldsWithoutAvatar } = updatedFields;
          const retryRes = await supabase
            .from("user_profiles")
            .update(fieldsWithoutAvatar)
            .eq("email", email.toLowerCase());
          profileErr = retryRes.error;
        }

        if (!profileErr) {
          syncedWithSupabase = true;

          // If they are a driver, let's also update drivers/vehicles tables if appropriate
          const driverId = `drv-${email.toLowerCase().replace(/[@.]/g, "-")}`;
          const vehicleId = `veh-${email.toLowerCase().replace(/[@.]/g, "-")}`;

          if (license_number !== undefined || finalAvatarUrl !== undefined) {
            const drvUpdate: any = {};
            if (name) drvUpdate.name = name;
            if (license_number !== undefined) drvUpdate.licenseNumber = license_number;
            if (finalAvatarUrl !== undefined) drvUpdate.avatar = finalAvatarUrl;

            await supabase.from("drivers").update(drvUpdate).eq("id", driverId);
          }

          if (vehicle_plate !== undefined || vehicle_model !== undefined) {
            const vehUpdate: any = {};
            if (vehicle_plate !== undefined) vehUpdate.plateNumber = vehicle_plate;
            if (vehicle_model !== undefined) vehUpdate.model = vehicle_model;

            await supabase.from("vehicles").update(vehUpdate).eq("id", vehicleId);
          }
        } else {
          console.warn("Supabase profile update error:", profileErr.message);
        }
      } catch (err: any) {
        console.warn("Supabase profile update exception, relying on local memory fallback:", err.message);
      }

      // 2. Always update local MEMORY_DB
      const userIdx = MEMORY_DB.user_profiles.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (userIdx !== -1) {
        MEMORY_DB.user_profiles[userIdx] = {
          ...MEMORY_DB.user_profiles[userIdx],
          ...updatedFields
        };
      }

      // Also update local memory drivers/vehicles if they exist
      const driverId = `drv-${email.toLowerCase().replace(/[@.]/g, "-")}`;
      const vehicleId = `veh-${email.toLowerCase().replace(/[@.]/g, "-")}`;

      const matchedDriver = MEMORY_DB.drivers.find(d => d.id === driverId);
      if (matchedDriver) {
        if (name) matchedDriver.name = name;
        if (license_number !== undefined) matchedDriver.licenseNumber = license_number;
        if (finalAvatarUrl !== undefined) matchedDriver.avatar = finalAvatarUrl;
      }

      const matchedVehicle = MEMORY_DB.vehicles.find(v => v.id === vehicleId);
      if (matchedVehicle) {
        if (vehicle_plate !== undefined) matchedVehicle.plateNumber = vehicle_plate;
        if (vehicle_model !== undefined) matchedVehicle.model = vehicle_model;
      }

      const completeUser = {
        ...(MEMORY_DB.user_profiles[userIdx] || {}),
        email,
        name,
        ...updatedFields
      };

      res.json({
        success: true,
        user: completeUser,
        synced: syncedWithSupabase
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get all registered users (for diagnostics and assignment ease)
  app.get("/api/auth/users", async (req, res) => {
    try {
      try {
        const { data, error } = await supabase.from("user_profiles").select("id, email, name, role, profile_completed");
        if (!error && data && data.length > 0) {
          return res.json({ success: true, users: data, source: "Supabase" });
        }
      } catch (e) {}

      // Fallback
      const mapped = MEMORY_DB.user_profiles.map(u => ({
        id: u.email,
        email: u.email,
        name: u.name,
        role: u.role,
        profile_completed: u.profile_completed
      }));
      res.json({ success: true, users: mapped, source: "Memory" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint for Gemini-powered safety coaching
  app.post("/api/gemini/coach", async (req, res) => {
    try {
      const { driverName, riskScore, distractionStats, incidents } = req.body;

      const systemPrompt = `You are an elite AI Fleet Driving Safety Auditor and Driver Coach. Your goal is to analyze distracted driving telemetry, pinpoint high-risk behavior patterns, and deliver highly professional, supportive, and actionable coaching advice. Use a constructive, professional, and clear tone. Present your audit structured in Markdown with the following sections:
1. Executive Safety Summary (1-2 paragraphs analyzing the current trip and risk level)
2. Primary Distraction Vectors (bulleted list of specific behaviors found in the logs like phone usage, gaze deviation, eating, with risk percentages)
3. Personalized Action Plan (3 highly concrete, actionable steps the driver can take)
4. AI Safety Score Assessment & Forecast (a qualitative evaluation based on the numeric score and what improvement can lead to)`;

      const userMessage = `Driver Profile:
- Name: ${driverName || "Unknown Driver"}
- Safety Score: ${riskScore || "N/A"}/100 (Higher is safer)
- Distraction Statistics:
  - Phone Usage: ${distractionStats?.phoneUsageSeconds || 0} seconds
  - Gaze Off-Road: ${distractionStats?.gazeOffRoadSeconds || 0} seconds
  - Drowsiness/Yawning: ${distractionStats?.drowsySeconds || 0} seconds
  - Hands Off Wheel: ${distractionStats?.handsOffSeconds || 0} seconds

Incident Log Summary:
${(incidents || []).map((inc: any) => `- [${inc.timestamp}] ${inc.type} (Severity: ${inc.severity}, Speed: ${inc.speed} km/h, Hazard Score: ${inc.hazardScore})`).join("\n") || "No major high-severity incidents logged."}

Please generate their detailed driver coaching audit report based on these parameters.`;

      // Attempt to invoke Gemini model
      try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userMessage,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });

        res.json({
          success: true,
          report: response.text,
          source: "Gemini AI Live Audit"
        });
      } catch (apiKeyError: any) {
        // Graceful fallback when API key is missing or invalid
        console.warn("Gemini API key is missing or invalid, using simulated professional safety audit response.");
        
        const fallbackReport = `### Executive Safety Summary
Driver **${driverName || "Driver"}** is exhibiting a **${riskScore < 70 ? "High Risk" : riskScore < 85 ? "Moderate Risk" : "Low Risk"}** profile. Telemetry reveals key areas where distraction is occurring, particularly in continuous eye gaze deviation and phone handling. Immediate corrective habits will significantly reduce potential traffic hazard indexes.

### Primary Distraction Vectors
* **Gaze Off-Road Duration**: Accounted for ${distractionStats?.gazeOffRoadSeconds || 12}s of attention drift. Looking away for >2 seconds at highway speeds exponentially increases collision probability.
* **Cell Phone Interaction**: Active mobile handling simulated at ${distractionStats?.phoneUsageSeconds || 8}s. Visual and cognitive distraction combined represents a major hazard.
* **Tactile Violations**: Hands off the steering wheel detected during rapid acceleration curves, elevating loss-of-control risks.

### Personalized Action Plan
1. **The 2-Second Eye Rule**: Maintain visual focus strictly on the forward path. If side mirrors or infotainment must be checked, limit scans to under 1.5 seconds per interval.
2. **Device Isolation Mode**: Enable automated "Do Not Disturb While Driving" system behaviors before putting the vehicle in gear. Place mobile devices in closed glove boxes or center consoles.
3. **Ergonomic Steering Control**: Keep both hands at the 9-and-3 position. Utilize voice-activated commands for cabin systems to avoid manual interactions.

### AI Safety Score Assessment & Forecast
The current Safety Score is evaluated at **${riskScore || 75}/100**. Successfully adopting the isolated device policy and utilizing geofenced distraction dampening is forecasted to elevate this driver's safety score to **92/100** within 14 driving days.

*(Note: This audit is a pre-configured elite safety template because a live Gemini API Key was not detected in the environment secrets. To activate real-time AI evaluations, add GEMINI_API_KEY in Settings > Secrets.)*`;

        res.json({
          success: true,
          report: fallbackReport,
          source: "AI Local Coach Engine (Demo Mode)"
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "An error occurred during coaching generation."
      });
    }
  });

  // Check Supabase connection and tables existence
  app.get("/api/db/status", async (req, res) => {
    try {
      const results: Record<string, { status: string; count: number; error?: string }> = {};
      const tables = ["drivers", "vehicles", "geofences", "rules", "incidents", "alert_logs"];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select("id").limit(1);
          if (error) {
            results[table] = { status: "missing", count: 0, error: error.message };
          } else {
            const { count, error: countErr } = await supabase.from(table).select("*", { count: "exact", head: true });
            if (countErr) {
              results[table] = { status: "missing", count: 0, error: countErr.message };
            } else {
              results[table] = { status: "connected", count: count || 0 };
            }
          }
        } catch (tableErr: any) {
          results[table] = { status: "error", count: 0, error: tableErr.message };
        }
      }

      res.json({
        success: true,
        supabaseUrl,
        projectId: "rjmwkltkltcgzluptbpq",
        results
      });
    } catch (err: any) {
      res.json({
        success: false,
        error: err.message
      });
    }
  });

  // Get full dashboard dataset from Supabase (or memory fallback)
  app.get("/api/db/data", async (req, res) => {
    try {
      const data: any = {};
      const errors: string[] = [];

      // 1. Drivers
      try {
        const { data: dbDrivers, error } = await supabase.from("drivers").select("*");
        if (error) {
          errors.push(`drivers: ${error.message}`);
          data.drivers = MEMORY_DB.drivers;
        } else if (dbDrivers && dbDrivers.length > 0) {
          data.drivers = dbDrivers;
        } else {
          data.drivers = MEMORY_DB.drivers;
        }
      } catch (err: any) {
        errors.push(`drivers: ${err.message}`);
        data.drivers = MEMORY_DB.drivers;
      }

      // 2. Vehicles
      try {
        const { data: dbVehicles, error } = await supabase.from("vehicles").select("*");
        if (error) {
          errors.push(`vehicles: ${error.message}`);
          data.vehicles = MEMORY_DB.vehicles;
        } else if (dbVehicles && dbVehicles.length > 0) {
          data.vehicles = dbVehicles;
        } else {
          data.vehicles = MEMORY_DB.vehicles;
        }
      } catch (err: any) {
        errors.push(`vehicles: ${err.message}`);
        data.vehicles = MEMORY_DB.vehicles;
      }

      // 3. Geofences
      try {
        const { data: dbGeofences, error } = await supabase.from("geofences").select("*");
        if (error) {
          errors.push(`geofences: ${error.message}`);
          data.geofences = MEMORY_DB.geofences;
        } else if (dbGeofences && dbGeofences.length > 0) {
          data.geofences = dbGeofences;
        } else {
          data.geofences = MEMORY_DB.geofences;
        }
      } catch (err: any) {
        errors.push(`geofences: ${err.message}`);
        data.geofences = MEMORY_DB.geofences;
      }

      // 4. Rules
      try {
        const { data: dbRules, error } = await supabase.from("rules").select("*");
        if (error) {
          errors.push(`rules: ${error.message}`);
          data.rules = MEMORY_DB.rules;
        } else if (dbRules && dbRules.length > 0) {
          data.rules = dbRules;
        } else {
          data.rules = MEMORY_DB.rules;
        }
      } catch (err: any) {
        errors.push(`rules: ${err.message}`);
        data.rules = MEMORY_DB.rules;
      }

      // 5. Incidents
      try {
        const { data: dbIncidents, error } = await supabase.from("incidents").select("*").order("timestamp", { ascending: false });
        if (error) {
          errors.push(`incidents: ${error.message}`);
          data.incidents = MEMORY_DB.incidents;
        } else if (dbIncidents && dbIncidents.length > 0) {
          data.incidents = dbIncidents;
        } else {
          data.incidents = MEMORY_DB.incidents;
        }
      } catch (err: any) {
        errors.push(`incidents: ${err.message}`);
        data.incidents = MEMORY_DB.incidents;
      }

      // 6. Alert Logs
      try {
        const { data: dbAlerts, error } = await supabase.from("alert_logs").select("*").order("timestamp", { ascending: false });
        if (error) {
          errors.push(`alert_logs: ${error.message}`);
          data.alertLogs = MEMORY_DB.alertLogs;
        } else if (dbAlerts && dbAlerts.length > 0) {
          data.alertLogs = dbAlerts;
        } else {
          data.alertLogs = MEMORY_DB.alertLogs;
        }
      } catch (err: any) {
        errors.push(`alert_logs: ${err.message}`);
        data.alertLogs = MEMORY_DB.alertLogs;
      }

      res.json({
        success: true,
        supabase_connected: errors.length === 0,
        errors,
        data
      });
    } catch (err: any) {
      res.json({
        success: false,
        error: err.message,
        data: {
          drivers: MEMORY_DB.drivers,
          vehicles: MEMORY_DB.vehicles,
          geofences: MEMORY_DB.geofences,
          rules: MEMORY_DB.rules,
          incidents: MEMORY_DB.incidents,
          alertLogs: MEMORY_DB.alertLogs
        }
      });
    }
  });

  // Sync state data changes to Supabase (or fallback to memory state)
  app.post("/api/db/sync", async (req, res) => {
    try {
      const { drivers, vehicles, geofences, rules, incidents, alertLogs } = req.body;
      const errors: string[] = [];

      // Update local memory database
      if (drivers) MEMORY_DB.drivers = drivers;
      if (vehicles) MEMORY_DB.vehicles = vehicles;
      if (geofences) MEMORY_DB.geofences = geofences;
      if (rules) MEMORY_DB.rules = rules;
      if (incidents) MEMORY_DB.incidents = incidents;
      if (alertLogs) MEMORY_DB.alertLogs = alertLogs;

      // Try syncing to Supabase tables
      if (drivers) {
        try {
          const { error } = await supabase.from("drivers").upsert(drivers);
          if (error) errors.push(`drivers: ${error.message}`);
        } catch (err: any) {
          errors.push(`drivers: ${err.message}`);
        }
      }
      if (vehicles) {
        try {
          const { error } = await supabase.from("vehicles").upsert(vehicles);
          if (error) errors.push(`vehicles: ${error.message}`);
        } catch (err: any) {
          errors.push(`vehicles: ${err.message}`);
        }
      }
      if (geofences) {
        try {
          const { error } = await supabase.from("geofences").upsert(geofences);
          if (error) errors.push(`geofences: ${error.message}`);
        } catch (err: any) {
          errors.push(`geofences: ${err.message}`);
        }
      }
      if (rules) {
        try {
          const { error } = await supabase.from("rules").upsert(rules);
          if (error) errors.push(`rules: ${error.message}`);
        } catch (err: any) {
          errors.push(`rules: ${err.message}`);
        }
      }
      if (incidents) {
        try {
          const { error } = await supabase.from("incidents").upsert(incidents);
          if (error) errors.push(`incidents: ${error.message}`);
        } catch (err: any) {
          errors.push(`incidents: ${err.message}`);
        }
      }
      if (alertLogs) {
        try {
          const { error } = await supabase.from("alert_logs").upsert(alertLogs);
          if (error) errors.push(`alert_logs: ${error.message}`);
        } catch (err: any) {
          errors.push(`alert_logs: ${err.message}`);
        }
      }

      res.json({
        success: true,
        supabase_synced: errors.length === 0,
        errors
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // Serve frontend assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://0.0.0.0:${PORT} under NODE_ENV=${process.env.NODE_ENV}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start the Express full-stack application server:", err);
});
