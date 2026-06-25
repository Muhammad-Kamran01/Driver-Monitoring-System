import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Lock, 
  User, 
  Key, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight, 
  Phone,
  FileText,
  CreditCard,
  Truck,
  Eye,
  EyeOff
} from "lucide-react";

interface AuthUser {
  email: string;
  name: string;
  role: string;
  profile_completed: boolean;
  phone?: string;
  license_number?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
}

interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

type AuthMode = "login" | "signup" | "forgot" | "complete-profile" | "reset-success";

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile completion states
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");

  // Forgot password states
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setNewPassword("");
    setResetCode("");
    setPhone("");
    setLicenseNumber("");
    setVehiclePlate("");
    setVehicleModel("");
    setError(null);
    setSuccess(null);
    setStep("request");
  };

  const changeMode = (newMode: AuthMode) => {
    clearForm();
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const user: AuthUser = data.user;
        if (!user.profile_completed && user.role !== "admin") {
          // Redirect to complete profile form within AuthScreen
          setEmail(user.email);
          setName(user.name);
          setMode("complete-profile");
        } else {
          // Successfully logged in
          localStorage.setItem("dms_auth_user", JSON.stringify(user));
          onLoginSuccess(user);
        }
      } else {
        setError(data.error || "Invalid email or security passcode.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passcodes do not match.");
      return;
    }

    if (password.length < 5) {
      setError("Passcode must be at least 5 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Account registered! Opening profile setup...");
        setTimeout(() => {
          setEmail(email);
          setName(name);
          setMode("complete-profile");
          setSuccess(null);
        }, 1200);
      } else {
        setError(data.error || "Failed to register operator.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || !licenseNumber || !vehiclePlate || !vehicleModel) {
      setError("Please provide all profile & vehicle details.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          phone,
          license_number: licenseNumber,
          vehicle_plate: vehiclePlate,
          vehicle_model: vehicleModel
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Profile completed successfully! Launching console...");
        const user: AuthUser = data.user;
        setTimeout(() => {
          localStorage.setItem("dms_auth_user", JSON.stringify(user));
          onLoginSuccess(user);
        }, 1500);
      } else {
        setError(data.error || "Failed to save profile details.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === "request") {
      if (!email) {
        setError("Please enter your registered email address.");
        return;
      }

      setIsLoading(true);
      // Simulate checking if user exists
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: "dummy" }) // Just testing if registered
        });
        const data = await res.json();

        // If the error is not "user not found" then they exist, or we can just proceed with simulated OTP
        setSuccess("Passcode recovery sequence initialized. Simulated OTP: 123456");
        setStep("verify");
      } catch (err) {
        setError("Connection issue.");
      } finally {
        setIsLoading(false);
      }
    } else {
      if (resetCode !== "123456") {
        setError("Invalid recovery OTP code. Please use the simulated code: 123456.");
        return;
      }

      if (!newPassword || newPassword.length < 5) {
        setError("New password must be at least 5 characters.");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: newPassword })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setMode("reset-success");
        } else {
          setError(data.error || "Failed to update passcode.");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fillQuickCredentials = (userEmail: string, pass: string) => {
    setEmail(userEmail);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden font-sans select-none antialiased">
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(244,63,94,0.04),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-10" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md z-10 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 opacity-80" />
        
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-500/20 mb-4">
            <Truck className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 uppercase tracking-tight">
            Driver Monitoring System
          </h2>
          <p className="text-[10px] text-indigo-400 font-bold font-mono tracking-wider uppercase mt-1">
            Secure Operator Terminal
          </p>
        </div>

        <div className="px-8 pb-8">
          <AnimatePresence mode="wait">
            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="operator@safety.com"
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Passcode / Password</label>
                      <button
                        type="button"
                        onClick={() => changeMode("forgot")}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 font-mono uppercase tracking-tight hover:underline cursor-pointer"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-9 pr-10 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-700 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-6 disabled:opacity-50"
                  >
                    {isLoading ? "Authenticating..." : "Authenticate Console"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <span className="text-xs text-slate-500">Don't have account? </span>
                  <button
                    type="button"
                    onClick={() => changeMode("signup")}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Sign Up Now
                  </button>
                </div>
              </motion.div>
            )}

            {mode === "signup" && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleSignup} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        id="signup-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Marcus Thompson"
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="marcus@fleet.com"
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Secure Passcode</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 5 characters"
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Confirm Passcode</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Key className="w-4 h-4" />
                      </span>
                      <input
                        id="signup-confirm"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter passcode"
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-6 disabled:opacity-50"
                  >
                    {isLoading ? "Processing..." : "Register & Continue"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <span className="text-xs text-slate-500">Already registered? </span>
                  <button
                    type="button"
                    onClick={() => changeMode("login")}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </motion.div>
            )}

            {mode === "complete-profile" && (
              <motion.div
                key="complete-profile"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="text-center mb-1">
                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[9px] font-mono font-bold tracking-widest uppercase rounded">
                    Account Registered
                  </span>
                  <h3 className="text-sm font-bold text-slate-200 mt-2">Complete Your Profile Details</h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    To maintain clean real-world tracking datasets and avoid fake dummy data, please provide your operator credentials below.
                  </p>
                </div>

                <form onSubmit={handleCompleteProfile} className="space-y-3.5">
                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                          <Phone className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 019-2831"
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Driver License #</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                          <CreditCard className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="DL-984210"
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-3">
                    <span className="text-[9px] font-mono font-extrabold text-indigo-400 block uppercase tracking-wider">ASSIGN VEHICLE</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Vehicle License Plate</label>
                        <input
                          type="text"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          placeholder="e.g. TX-982-FMS"
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Vehicle Model / Year</label>
                        <input
                          type="text"
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          placeholder="e.g. Peterbilt 579 (2024)"
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-700 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-6 disabled:opacity-50"
                  >
                    {isLoading ? "Saving Profile..." : "Initialize Operator Dashboard"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}

            {mode === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                        <span className="font-bold text-emerald-300">Recovery Sent!</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 pl-6">
                        For local development, we've simulated sending a recovery code.
                      </p>
                      <div className="mt-2 bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-indigo-300 text-center select-all">
                        CODE: 123456
                      </div>
                    </div>
                  )}

                  {step === "request" ? (
                    <div>
                      <p className="text-xs text-slate-400 mb-4 leading-normal">
                        Enter your registered operator email address. We will simulate sending a 6-digit passcode recovery code.
                      </p>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Registered Email</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          id="forgot-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. admin@safety.com"
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Enter 6-Digit Verification Code</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                            <Shield className="w-4 h-4" />
                          </span>
                          <input
                            id="reset-code"
                            type="text"
                            maxLength={6}
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value)}
                            placeholder="123456"
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs font-mono tracking-widest text-indigo-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">Choose New Passcode</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                            <Lock className="w-4 h-4" />
                          </span>
                          <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 5 characters"
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-700 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-6 disabled:opacity-50"
                  >
                    <span>{step === "request" ? "Initialize Recovery" : "Reset Console Passcode"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => changeMode("login")}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </motion.div>
            )}

            {mode === "reset-success" && (
              <motion.div
                key="reset-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-md">
                  <CheckCircle className="w-8 h-8 animate-bounce" />
                </div>
                <h3 className="text-base font-bold text-slate-100 font-mono uppercase tracking-tight">Passcode Updated</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-normal">
                  Your secure passcode has been reset successfully in the database. You may now log in to the console.
                </p>
                <button
                  onClick={() => changeMode("login")}
                  className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-700 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-white transition-all shadow-md cursor-pointer"
                >
                  Return to Login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
