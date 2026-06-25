import React from "react";
import { RuleThreshold } from "../types";
import { Sliders, Volume2, VolumeX, Eye, Smartphone, AlertTriangle, ShieldCheck } from "lucide-react";

interface RulesManagerProps {
  rules: RuleThreshold[];
  onUpdateRuleThreshold: (id: string, value: number) => void;
  onToggleRuleAlarm: (id: string) => void;
}

export default function RulesManager({
  rules,
  onUpdateRuleThreshold,
  onToggleRuleAlarm
}: RulesManagerProps) {

  const getRuleIcon = (type: string) => {
    switch (type) {
      case "Cell Phone Interacting":
        return <Smartphone className="w-4 h-4 text-rose-500" />;
      case "Visual Off-Road Gaze":
        return <Eye className="w-4 h-4 text-amber-500" />;
      case "Drowsiness & Yawning":
        return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div id="rules-manager-module" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="text-indigo-500 w-5 h-5" />
            <h3 className="font-semibold text-slate-800 tracking-tight text-sm uppercase">Module 10: Alert Threshold Config</h3>
          </div>
          <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
            RULES PANEL
          </span>
        </div>

        {/* Threshold Adjustment Sliders */}
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getRuleIcon(rule.type)}
                  <div>
                    <h4 className="font-semibold text-slate-800 text-xs">{rule.name}</h4>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">{rule.type}</span>
                  </div>
                </div>

                {/* Speaker Toggle Button */}
                <button
                  type="button"
                  onClick={() => onToggleRuleAlarm(rule.id)}
                  className={`p-1 rounded border transition-all cursor-pointer ${
                    rule.alarmEnabled 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                      : "bg-white text-slate-400 border-slate-200 hover:text-slate-600"
                  }`}
                  title={rule.alarmEnabled ? "TTS Voice Active" : "Auditory Alarms Silenced"}
                >
                  {rule.alarmEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-4 mt-1">
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={rule.thresholdSeconds}
                  onChange={(e) => onUpdateRuleThreshold(rule.id, parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-indigo-600 w-12 text-right shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  {rule.thresholdSeconds.toFixed(1)}s
                </span>
              </div>
              <p className="text-[10px] text-slate-500 italic font-mono leading-tight mt-1 bg-white p-1.5 rounded border border-slate-100">
                &ldquo;{rule.voiceAlertMessage}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-mono leading-snug">
        Adjusting sensitivity levels filters false alarms. A value of &lt;1.5s for off-road gaze is highly recommended for urban or freight operation zones.
      </div>
    </div>
  );
}
