import React from "react";
import { VehicleUnit, DriverProfile } from "../types";
import { Truck, Signal, SignalHigh, WifiOff, RefreshCw, KeyRound } from "lucide-react";

interface FleetManagerProps {
  vehicles: VehicleUnit[];
  drivers: DriverProfile[];
  activeVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onAssignDriver: (vehicleId: string, driverId: string) => void;
}

export default function FleetManager({
  vehicles,
  drivers,
  activeVehicleId,
  onSelectVehicle,
  onAssignDriver
}: FleetManagerProps) {

  const getSignalIcon = (strength: string) => {
    switch (strength) {
      case "Excellent":
        return <Signal className="w-4 h-4 text-emerald-500" />;
      case "Good":
        return <SignalHigh className="w-4 h-4 text-sky-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-rose-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Online":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Offline":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  return (
    <div id="fleet-manager-module" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="text-indigo-500 w-5 h-5" />
            <h3 className="font-semibold text-slate-800 tracking-tight text-sm uppercase">Module 11: Fleet Vehicle Status</h3>
          </div>
          <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
            FLEET CORE
          </span>
        </div>

        {/* Fleet Vehicle List */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {vehicles.map((veh) => {
            const isFocus = veh.id === activeVehicleId;
            const assignedDriver = drivers.find((d) => d.id === veh.currentDriverId);

            return (
              <div
                key={veh.id}
                onClick={() => onSelectVehicle(veh.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex gap-3 items-center ${
                  isFocus 
                    ? "bg-indigo-50/50 border-indigo-500/40 shadow-sm ring-1 ring-indigo-500/10" 
                    : "bg-slate-50/50 border-slate-200 hover:border-slate-350"
                }`}
              >
                {/* Truck icon overlay */}
                <div className={`p-2.5 rounded-lg ${isFocus ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                  <Truck className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800">{veh.model}</h4>
                      <span className="text-[9px] font-mono text-slate-400">{veh.plateNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getSignalIcon(veh.signalStrength)}
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getStatusColor(veh.status)}`}>
                        {veh.status}
                      </span>
                    </div>
                  </div>

                  {/* Driver Assignment Block */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 text-slate-500 truncate max-w-[120px]">
                      <KeyRound className="w-3 h-3 text-indigo-500" />
                      {assignedDriver ? assignedDriver.name : "Unassigned"}
                    </span>

                    {/* Quick Assign Dropdown */}
                    <select
                      value={veh.currentDriverId}
                      onChange={(e) => {
                        e.stopPropagation();
                        onAssignDriver(veh.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white border border-slate-200 text-slate-700 text-[9px] px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    >
                      {drivers.map((drv) => (
                        <option key={drv.id} value={drv.id}>
                          {drv.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 border border-slate-100 p-2 rounded flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>FMS Sync ID: #FC-19022</span>
        <span className="flex items-center gap-1 text-emerald-600">
          <RefreshCw className="w-3 h-3 animate-spin" />
          AUTO-SYNCING
        </span>
      </div>
    </div>
  );
}
