import React, { useState } from "react";
import { Play, Pause, FastForward, RotateCcw, AlertCircle, Sparkles } from "lucide-react";

interface RouteReplayProps {
  vehiclePos: { x: number; y: number };
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  simulationSpeed: number;
  onSetSpeed: (speed: number) => void;
  incidentHistory: Array<{
    x: number;
    y: number;
    type: string;
    timestamp: string;
  }>;
}

export default function RouteReplay({
  vehiclePos,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  simulationSpeed,
  onSetSpeed,
  incidentHistory
}: RouteReplayProps) {
  // Predefined stylized trip route coordinates
  const routePoints = [
    { x: 10, y: 15 },
    { x: 25, y: 18 },
    { x: 40, y: 45 }, // Downtown core
    { x: 55, y: 60 },
    { x: 70, y: 30 }, // Route 88 construction
    { x: 80, y: 55 },
    { x: 90, y: 85 }  // Freight Depot
  ];

  return (
    <div id="route-replay-module" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <FastForward className="text-amber-500 w-5 h-5 animate-pulse" />
            <h3 className="font-semibold text-slate-800 tracking-tight text-sm uppercase">Module 9: Route & Trip Replay</h3>
          </div>
          <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">
            TRIP RECORDER
          </span>
        </div>

        {/* Playback Controls Panel */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSimulation}
              className={`p-1.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                isSimulating 
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-600" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <button
              onClick={onResetSimulation}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-full flex items-center justify-center transition cursor-pointer shadow-sm"
              title="Reset Trip"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-mono mr-1">PLAYBACK SPEED:</span>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => onSetSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all border ${
                  simulationSpeed === spd 
                    ? "bg-amber-500/20 text-amber-700 border-amber-500" 
                    : "bg-white text-slate-500 border-slate-200 hover:text-slate-800 cursor-pointer"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Vector 2D Route Plotter */}
        <div className="relative w-full aspect-[21/9] bg-slate-950 border border-slate-800 rounded-lg p-2 overflow-hidden mb-3">
          <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
            {/* Draw Path Line */}
            <polyline
              points="10,10 25,12 40,25 55,30 70,18 80,28 90,36"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray="2,2"
              opacity="0.4"
            />
            <polyline
              points="10,10 25,12 40,25 55,30 70,18 80,28 90,36"
              fill="none"
              stroke="#6366f1"
              strokeWidth="0.8"
              strokeLinecap="round"
            />

            {/* Draw Key Station Nodes */}
            {routePoints.map((pt, index) => {
              // Convert y coordinate to fit aspect ratio aspect-[21/9] (grid max y=40, from 0-100 scale)
              const mappedY = (pt.y / 100) * 40;
              return (
                <circle
                  key={index}
                  cx={pt.x}
                  cy={mappedY}
                  r="1.2"
                  fill="#1e293b"
                  stroke="#818cf8"
                  strokeWidth="0.6"
                />
              );
            })}

            {/* Draw Distraction Incidents Markers along Trip */}
            {incidentHistory.map((inc, index) => {
              const mappedY = (inc.y / 100) * 40;
              return (
                <g key={index} className="animate-pulse">
                  <path
                    d={`M ${inc.x} ${mappedY - 2.5} L ${inc.x - 2} ${mappedY + 1} L ${inc.x + 2} ${mappedY + 1} Z`}
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="0.2"
                  />
                  <circle cx={inc.x} cy={mappedY} r="0.6" fill="#ffffff" />
                </g>
              );
            })}

            {/* Simulated Live Vehicle pin along route */}
            {/* Find matching mapped y for current vehiclePos.x */}
            <circle
              cx={vehiclePos.x}
              cy={(vehiclePos.y / 100) * 40}
              r="2.2"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="0.6"
              className="animate-pulse"
            />
          </svg>

          {/* Incident Info Hover list */}
          <div className="absolute top-2 right-2 text-[8px] font-mono bg-slate-900/95 border border-slate-800 p-1.5 rounded flex flex-col gap-1 shadow max-w-[130px]">
            <span className="text-slate-500 font-bold">ROUTE EVENTS</span>
            {incidentHistory.length === 0 ? (
              <span className="text-emerald-400">0 Violations</span>
            ) : (
              <span className="text-rose-400 font-bold">{incidentHistory.length} Detected</span>
            )}
          </div>
        </div>
      </div>

      {/* Historical incident listing on route */}
      <div className="mt-2 text-[10px] font-mono">
        <span className="text-slate-400 uppercase block mb-1">Geolocated Route Incidents</span>
        <div className="max-h-20 overflow-y-auto space-y-1">
          {incidentHistory.length === 0 ? (
            <div className="text-slate-400 italic">No distracted behaviors recorded along this coordinate vector line.</div>
          ) : (
            incidentHistory.map((inc, index) => (
              <div key={index} className="flex justify-between border-b border-slate-100 pb-0.5 text-slate-600">
                <span className="flex items-center gap-1 text-rose-500">
                  <AlertCircle className="w-3 h-3" />
                  {inc.type}
                </span>
                <span className="text-slate-400">POS: {inc.x}, {inc.y}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
