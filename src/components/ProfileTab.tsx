import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { 
  User, 
  Phone, 
  CreditCard, 
  Truck, 
  Upload, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Database,
  Save,
  Image as ImageIcon
} from "lucide-react";

interface ProfileUser {
  email: string;
  name: string;
  role: string;
  profile_completed: boolean;
  phone?: string;
  license_number?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
  avatar?: string;
}

interface ProfileTabProps {
  user: ProfileUser;
  onUpdateSuccess: (updatedUser: ProfileUser) => void;
}

export default function ProfileTab({ user, onUpdateSuccess }: ProfileTabProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [licenseNumber, setLicenseNumber] = useState(user.license_number || "");
  const [vehiclePlate, setVehiclePlate] = useState(user.vehicle_plate || "");
  const [vehicleModel, setVehicleModel] = useState(user.vehicle_model || "");
  const [avatar, setAvatar] = useState(user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80");
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      readAndSetFile(file);
    }
  };

  const readAndSetFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setSaveStatus("error");
      setStatusMessage("Please select a valid image file.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatar(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const selectRandomAvatar = () => {
    const urls = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
    ];
    const currentIdx = urls.indexOf(avatar);
    const nextUrls = urls.filter(u => u !== avatar);
    const randomUrl = nextUrls[Math.floor(Math.random() * nextUrls.length)];
    setAvatar(randomUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("idle");
    setStatusMessage("");

    try {
      const payload = {
        email: user.email,
        name,
        phone,
        avatar,
        ...(user.role !== "admin" ? {
          license_number: licenseNumber,
          vehicle_plate: vehiclePlate,
          vehicle_model: vehicleModel,
        } : {})
      };

      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus("success");
        setStatusMessage(data.synced ? "Profile saved and synced with Supabase!" : "Profile updated in local storage cache!");
        onUpdateSuccess(data.user);
        localStorage.setItem("dms_auth_user", JSON.stringify(data.user));
      } else {
        setSaveStatus("error");
        setStatusMessage(data.error || "Failed to save profile changes.");
      }
    } catch (err: any) {
      setSaveStatus("error");
      setStatusMessage(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyInstructionsSql = () => {
    const sql = `-- Step 1: Create a public storage bucket called 'profile-pictures'
-- You can run this in your Supabase SQL Editor to configure bucket & permissions

insert into storage.buckets (id, name, public) 
values ('profile-pictures', 'profile-pictures', true)
on conflict (id) do nothing;

-- Step 2: Set up Row Level Security (RLS) policies for the bucket
-- Allow anyone to read profile pictures
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'profile-pictures' );

-- Allow authenticated users to upload and manage their pictures
create policy "Authenticated User Uploads" 
on storage.objects for insert 
with check ( bucket_id = 'profile-pictures' );

create policy "Authenticated User Updates" 
on storage.objects for update 
using ( bucket_id = 'profile-pictures' );
`;
    navigator.clipboard.writeText(sql);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header Cover Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 relative flex items-start justify-between p-6">
          <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest font-bold">
            System Account / Profile
          </span>
          <span className="text-white/95 font-extrabold tracking-wider text-[10px] uppercase bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-sm font-mono border border-white/5">
            {user.role === "admin" ? "Admin Settings" : "Driver Settings"}
          </span>
          <div className="absolute -bottom-12 left-6">
            <div className="relative group">
              <img
                src={avatar}
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full border-4 border-white object-cover bg-slate-100 shadow-md"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Name & Header Details */}
        <div className="px-6 pt-16 pb-4 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{name || "Unnamed Operator"}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
              user.role === "admin" 
                ? "bg-indigo-50 text-indigo-600 border border-indigo-100" 
                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
            }`}>
              {user.role === "admin" ? "Fleet Administrator" : "Active Safety Driver"}
            </span>
            <span className="text-xs text-slate-400 font-mono">{user.email}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Upload Area */}
          <div>
            <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block mb-2">
              Profile Avatar Picture
            </label>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                  dragActive 
                    ? "border-indigo-500 bg-indigo-50/20" 
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
                }`}
              >
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xs text-slate-600 font-medium">
                  Drag and drop your picture here, or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 font-semibold hover:underline focus:outline-none"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, GIF up to 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex flex-col justify-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={selectRandomAvatar}
                  className="px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  Use Alternate Mock Avatar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Simulate a high quality camera snapshot
                    setAvatar("https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80");
                  }}
                  className="px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  Simulate Live Selfie Capture
                </button>
              </div>
            </div>
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  placeholder="+1 (555) 019-2834"
                />
              </div>
            </div>

            {user.role !== "admin" && (
              <>
                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
                    Commercial Driver License (CDL)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono"
                      placeholder="CDL-TX-88219"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
                    Assigned Vehicle Plate
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Truck className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono uppercase"
                      placeholder="TX-883-SAF"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
                    Assigned Vehicle Fleet Model
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Truck className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                      placeholder="Freightliner Cascadia 2024 (Long Haul Class 8)"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Status alerts */}
          {saveStatus !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border text-sm flex gap-3 items-start ${
                saveStatus === "success" 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                  : "bg-rose-50 border-rose-100 text-rose-800"
              }`}
            >
              {saveStatus === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{statusMessage}</span>
            </motion.div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg flex items-center gap-2 shadow transition cursor-pointer text-sm"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving changes..." : "Save Profile Details"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
