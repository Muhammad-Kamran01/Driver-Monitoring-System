import React from "react";
import { LiveTelemetry } from "../types";
import { Activity, Compass, Gauge, AlertTriangle, HelpCircle } from "lucide-react";

interface TelemetryGaugesProps {
  telemetry: LiveTelemetry;
}

export default function TelemetryGauges({ telemetry }: TelemetryGaugesProps) {
  const compositeGForce = parseFloat(telemetry.gForce.toFixed(2));
  const isGForceHigh = compositeGForce > 1.2;

  return (
    <div id="telemetry-gauges-module" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
      {/* Decorative Grid Line */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />
      
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="text-emerald-500 w-5 h-5 animate-pulse" />
          <h3 className="font-semibold text-slate-800 tracking-tight text-sm uppercase">Module 1: Real-time Telemetry</h3>
        </div>
        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">
          LIVE FEED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Speedometer Gauge */}
        <div id="gauge-speed" className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500 font-medium">Speed Index</span>
            <Gauge className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="my-3 flex items-baseline gap-1.5 justify-center">
            <span className="text-4xl font-extrabold text-slate-800 tracking-tight font-mono">
              {telemetry.speed}
            </span>
            <span className="text-xs text-slate-500 font-medium">km/h</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500 h-full transition-all duration-300"
              style={{ width: `${Math.min((telemetry.speed / 120) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>0 km/h</span>
            <span>120 Limit</span>
          </div>
        </div>

        {/* G-Force Sensor Gauge */}
        <div id="gauge-gforce" className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500 font-medium">Composite G-Force</span>
            <AlertTriangle className={`w-4 h-4 ${isGForceHigh ? "text-rose-500 animate-bounce" : "text-amber-500"}`} />
          </div>
          <div className="my-3 flex items-baseline gap-1.5 justify-center">
            <span className={`text-4xl font-extrabold tracking-tight font-mono ${isGForceHigh ? "text-rose-600" : "text-slate-800"}`}>
              {compositeGForce}
            </span>
            <span className="text-xs text-slate-500 font-medium">G</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${isGForceHigh ? "bg-rose-500" : "bg-amber-500"}`}
              style={{ width: `${Math.min((compositeGForce / 2.5) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>0.0G (Idle)</span>
            <span>2.5G Hazard</span>
          </div>
        </div>

        {/* Vehicle Heading */}
        <div id="gauge-heading" className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500 font-medium">Heading Compass</span>
            <Compass className="w-4 h-4 text-sky-500" />
          </div>
          <div className="my-3 flex items-baseline gap-1.5 justify-center">
            <span className="text-4xl font-extrabold text-slate-800 tracking-tight font-mono">
              {telemetry.heading}°
            </span>
            <span className="text-xs text-slate-500 font-medium font-mono">
              {telemetry.heading >= 337.5 || telemetry.heading < 22.5 ? "N" :
               telemetry.heading >= 22.5 && telemetry.heading < 67.5 ? "NE" :
               telemetry.heading >= 67.5 && telemetry.heading < 112.5 ? "E" :
               telemetry.heading >= 112.5 && telemetry.heading < 157.5 ? "SE" :
               telemetry.heading >= 157.5 && telemetry.heading < 202.5 ? "S" :
               telemetry.heading >= 202.5 && telemetry.heading < 247.5 ? "SW" :
               telemetry.heading >= 247.5 && telemetry.heading < 292.5 ? "W" : "NW"}
            </span>
          </div>
          <div className="relative w-full h-2 bg-slate-200 rounded">
            <div 
              className="absolute top-0 bottom-0 bg-sky-500 w-1 rounded transition-all duration-300"
              style={{ left: `${(telemetry.heading / 360) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>W 270°</span>
            <span>N 0°</span>
            <span>E 90°</span>
          </div>
        </div>
      </div>

      {/* Accelerometer & Gyroscope Live Oscilloscope Waves */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Accel Triaxial */}
        <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono text-slate-500">Tri-axial Accelerometer (g)</span>
            <div className="flex gap-2 text-[9px] font-mono">
              <span className="text-indigo-600">X: {telemetry.accelX.toFixed(2)}</span>
              <span className="text-emerald-600">Y: {telemetry.accelY.toFixed(2)}</span>
              <span className="text-rose-600">Z: {telemetry.accelZ.toFixed(2)}</span>
            </div>
          </div>
          <div className="h-10 flex items-end gap-1 px-1 bg-slate-100 rounded border border-slate-200">
            {/* Simple live waving bar animation simulations */}
            {Array.from({ length: 18 }).map((_, i) => {
              const h1 = Math.abs(Math.sin((i + telemetry.accelX * 10)) * 24) + 4;
              const h2 = Math.abs(Math.cos((i + telemetry.accelY * 10)) * 18) + 4;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end h-full gap-0.5 opacity-80">
                  <div className="w-full bg-indigo-500" style={{ height: `${h1 / 2}px` }} />
                  <div className="w-full bg-emerald-500" style={{ height: `${h2 / 2}px` }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Gyro Triaxial */}
        <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono text-slate-500">Tri-axial Gyroscope (°/s)</span>
            <div className="flex gap-2 text-[9px] font-mono">
              <span className="text-amber-600">X: {telemetry.gyroX.toFixed(0)}</span>
              <span className="text-sky-600">Y: {telemetry.gyroY.toFixed(0)}</span>
              <span className="text-purple-600">Z: {telemetry.gyroZ.toFixed(0)}</span>
            </div>
          </div>
          <div className="h-10 flex items-end gap-1 px-1 bg-slate-100 rounded border border-slate-200">
            {Array.from({ length: 18 }).map((_, i) => {
              const h1 = Math.abs(Math.cos((i * 1.5 + telemetry.gyroX * 0.05))) * 20 + 4;
              const h2 = Math.abs(Math.sin((i * 1.2 + telemetry.gyroZ * 0.05))) * 16 + 4;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end h-full gap-0.5 opacity-80">
                  <div className="w-full bg-amber-500" style={{ height: `${h1 / 2}px` }} />
                  <div className="w-full bg-sky-500" style={{ height: `${h2 / 2}px` }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
