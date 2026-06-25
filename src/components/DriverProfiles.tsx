import React, { useState } from "react";
import { DriverProfile } from "../types";
import { Users, UserCheck, Plus, ShieldCheck, ShieldAlert, Award } from "lucide-react";

interface DriverProfilesProps {
  drivers: DriverProfile[];
  activeDriverId: string;
  onSelectDriver: (id: string) => void;
  onAddDriver: (name: string, license: string) => void;
}

export default function DriverProfiles({
  drivers,
  activeDriverId,
  onSelectDriver,
  onAddDriver
}: DriverProfilesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLicense, setNewLicense] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newLicense.trim()) return;
    onAddDriver(newName, newLicense);
    setNewName("");
    setNewLicense("");
    setShowAddForm(false);
  };

  const getRiskColor = (score: number) => {
    if (score >= 90) return { bg: "bg-emerald-50 border-emerald-100 text-emerald-700", label: "Excellent Focus" };
    if (score >= 75) return { bg: "bg-amber-50 border-amber-100 text-amber-700", label: "Moderate Risk" };
    return { bg: "bg-rose-50 border-rose-100 text-rose-700", label: "Critical Risk" };
  };

  return (
    <div id="driver-profiles-module" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Users className="text-indigo-500 w-5 h-5" />
            <h3 className="font-semibold text-slate-800 tracking-tight text-sm uppercase">Module 4: Driver Profiles & Risk scores</h3>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[10px] font-mono bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 py-1 px-2 rounded flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? "CLOSE" : "ADD NEW"}
          </button>
        </div>

        {/* Add Driver Overlay Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 animate-fadeIn">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Register Safety Driver</h4>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Driver Name (e.g. Liam Parker)"
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
              <input
                type="text"
                value={newLicense}
                onChange={(e) => setNewLicense(e.target.value)}
                placeholder="License Number (e.g. DL-291823)"
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-slate-100 font-bold py-1.5 px-2.5 rounded text-xs transition cursor-pointer shadow-sm"
              >
                SAVE PROFILE
              </button>
            </div>
          </form>
        )}

        {/* Driver List directory */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {drivers.map((drv) => {
            const isActive = drv.id === activeDriverId;
            const risk = getRiskColor(drv.riskScore);
            const totalDriveHours = (drv.totalDriveTimeSeconds / 3600).toFixed(1);
            const distractedPercent = ((drv.totalDistractedSeconds / drv.totalDriveTimeSeconds) * 100).toFixed(2);

            return (
              <div 
                key={drv.id}
                onClick={() => onSelectDriver(drv.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex gap-3 items-center ${
                  isActive 
                    ? "bg-indigo-50/50 border-indigo-500/45 shadow-sm ring-1 ring-indigo-500/10" 
                    : "bg-slate-50/50 border-slate-200 hover:border-slate-350"
                }`}
              >
                <div className="relative shrink-0">
                  <img 
                    src={drv.avatar} 
                    alt={drv.name} 
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 p-0.5 rounded-full text-slate-100 border-2 border-white">
                      <UserCheck className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-xs text-slate-800 truncate">{drv.name}</h4>
                    <span className={`text-[9px] font-mono px-1.5 rounded border ${risk.bg}`}>
                      {risk.label}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">Lic: {drv.licenseNumber}</p>
                  
                  <div className="grid grid-cols-3 gap-1 mt-1 text-[9px] font-mono border-t border-slate-100 pt-1 text-slate-500">
                    <div>
                      <span className="text-slate-400 block">SCORE</span>
                      <span className="font-bold text-slate-800">{drv.riskScore}/100</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">DRIVE TIME</span>
                      <span className="font-bold text-slate-800">{totalDriveHours} hrs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">DISTR. RATIO</span>
                      <span className="font-bold text-rose-600">{distractedPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual driving scoring stats chart summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-lg flex items-center gap-3">
        <Award className="text-amber-400 w-8 h-8 shrink-0" />
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fleet Focus Standard</span>
          <p className="text-xs text-slate-700 leading-snug">
            Calculated score based on continuously tracked on-road face metrics, holding devices, and yawns. Target is &gt;90.
          </p>
        </div>
      </div>
    </div>
  );
}
