import React, { useRef, useState } from "react";
import { GeofenceZone } from "../types";
import { Navigation, Plus, ShieldAlert, CheckCircle, MapPin } from "lucide-react";

interface GeofenceMapProps {
  geofences: GeofenceZone[];
  vehiclePos: { x: number; y: number };
  onAddGeofence: (name: string, x: number, y: number, radius: number, speedLimit: number) => void;
  currentZone: GeofenceZone | null;
}

export default function GeofenceMap({
  geofences,
  vehiclePos,
  onAddGeofence,
  currentZone
}: GeofenceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ x: number; y: number } | null>(null);
  const [newName, setNewName] = useState("");
  const [newRadius, setNewRadius] = useState(10);
  const [newSpeedLimit, setNewSpeedLimit] = useState(40);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setTempCoords({ x, y });
    setShowAddForm(true);
    if (!newName) {
      setNewName(`Geofence Zone #${geofences.length + 1}`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempCoords || !newName.trim()) return;
    onAddGeofence(newName, tempCoords.x, tempCoords.y, newRadius, newSpeedLimit);
    setNewName("");
    setTempCoords(null);
    setShowAddForm(false);
  };

  return (
    <div id="geofencing-module" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="text-sky-500 w-5 h-5" />
            <h3 className="font-semibold text-slate-800 tracking-tight text-sm uppercase">Module 5: Geofencing Control Map</h3>
          </div>
          <span className="text-[10px] font-mono bg-sky-50 text-sky-600 px-2 py-0.5 rounded border border-sky-100">
            RADAR ACTIVE
          </span>
        </div>

        {/* Current Zone status alert banner */}
        {currentZone ? (
          <div className="bg-sky-50 border border-sky-100 p-2.5 rounded-lg mb-3 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-sky-600 w-4 h-4 animate-bounce shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-sky-600 block uppercase tracking-wider">ACTIVE GEOFENCE LIMITS</span>
                <p className="text-xs font-bold text-slate-800 truncate">{currentZone.name}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block">ZONE SPEED</span>
              <span className="text-xs font-bold text-sky-600 font-mono">{currentZone.speedLimit} km/h</span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg mb-3 flex items-center gap-2">
            <CheckCircle className="text-emerald-600 w-4 h-4 shrink-0" />
            <div>
              <span className="text-[9px] font-bold text-emerald-600 block uppercase tracking-wider">REGULATORY STATUS</span>
              <p className="text-xs text-slate-600">Operating in open unrestricted highways.</p>
            </div>
          </div>
        )}

        {/* Map Grid Canvas Container */}
        <div className="relative mb-3">
          <span className="absolute top-2 left-2 text-[9px] font-mono text-slate-500 z-10 bg-white/95 px-1.5 py-0.5 rounded border border-slate-200">
            Click Map to Draw New Zone
          </span>
          <div 
            ref={mapRef}
            onClick={handleMapClick}
            className="w-full aspect-square bg-slate-950 border border-slate-800 rounded-lg relative overflow-hidden cursor-crosshair group"
          >
            {/* Grid coordinate lines */}
            <div className="absolute inset-0 bg-grid pointer-events-none opacity-10" />

            {/* Render Geofence zones */}
            {geofences.map((geo) => (
              <div
                key={geo.id}
                className="absolute border border-dashed rounded-full flex items-center justify-center transition-all bg-sky-500/5 hover:bg-sky-500/10 pointer-events-none"
                style={{
                  left: `${geo.lng}%`,
                  top: `${geo.lat}%`,
                  width: `${geo.radius * 2}%`,
                  height: `${geo.radius * 2}%`,
                  transform: "translate(-50%, -50%)",
                  borderColor: currentZone?.id === geo.id ? "#38bdf8" : "rgba(56, 189, 248, 0.4)"
                }}
              >
                <div className="text-[8px] font-mono text-sky-400/60 font-bold tracking-tight text-center truncate px-1 max-w-full">
                  {geo.name} ({geo.speedLimit}k)
                </div>
              </div>
            ))}

            {/* Click Coordinate placement dot */}
            {tempCoords && (
              <div 
                className="absolute w-3 h-3 bg-indigo-500 rounded-full animate-ping pointer-events-none"
                style={{ left: `${tempCoords.x}%`, top: `${tempCoords.y}%`, transform: "translate(-50%, -50%)" }}
              />
            )}

            {/* Live Vehicle Marker */}
            <div 
              className="absolute w-5 h-5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full border-2 border-slate-950 flex items-center justify-center shadow-lg transition-all duration-300 pointer-events-none"
              style={{
                left: `${vehiclePos.x}%`,
                top: `${vehiclePos.y}%`,
                transform: "translate(-50%, -50%)"
              }}
            >
              <Navigation className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
            </div>
          </div>
        </div>
      </div>

      {/* Geofence Creator Form Modal popup */}
      {showAddForm && tempCoords && (
        <form onSubmit={handleFormSubmit} className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2 text-xs">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
            <span className="font-bold text-slate-800">Configure Geofence Zone</span>
            <span className="font-mono text-[9px] text-slate-400">Coord: {tempCoords.x}, {tempCoords.y}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="col-span-2">
              <label className="text-[10px] text-slate-400 block">ZONE NAME</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">RADIUS (GRID %)</label>
              <input
                type="number"
                value={newRadius}
                onChange={(e) => setNewRadius(parseInt(e.target.value))}
                min="5"
                max="25"
                className="w-full bg-white border border-slate-200 text-slate-800 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">SPEED LIMIT (KM/H)</label>
              <input
                type="number"
                value={newSpeedLimit}
                onChange={(e) => setNewSpeedLimit(parseInt(e.target.value))}
                min="15"
                max="100"
                className="w-full bg-white border border-slate-200 text-slate-800 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => { setShowAddForm(false); setTempCoords(null); }}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 py-1 rounded text-xs transition cursor-pointer"
            >
              CANCEL
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-slate-100 font-bold py-1 rounded text-xs transition cursor-pointer shadow-sm"
            >
              DRAW ZONE
            </button>
          </div>
        </form>
      )}

      {/* Geofence summary list widget */}
      <div className="mt-3 text-[10px] font-mono border-t border-slate-100 pt-3">
        <span className="text-slate-400 uppercase block mb-1">Geofence Registry</span>
        <div className="max-h-20 overflow-y-auto space-y-1">
          {geofences.map(geo => (
            <div key={geo.id} className="flex justify-between text-slate-600 border-b border-slate-100 pb-0.5">
              <span className="truncate max-w-[140px]">{geo.name}</span>
              <span className="text-sky-600 shrink-0">{geo.speedLimit} km/h max</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
