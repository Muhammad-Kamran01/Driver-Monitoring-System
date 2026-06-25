import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area } from "recharts";
import { BarChart3, TrendingUp, AlertCircle, Sparkles } from "lucide-react";

interface AnalyticsViewProps {
  distractionSeconds: {
    phoneUsageSeconds: number;
    gazeOffRoadSeconds: number;
    drowsySeconds: number;
    handsOffSeconds: number;
    eatingDrinkingSeconds: number;
  };
}

export default function AnalyticsView({ distractionSeconds }: AnalyticsViewProps) {
  // Aggregate current distraction vectors
  const distractionData = [
    { name: "Phone Use", seconds: distractionSeconds.phoneUsageSeconds, color: "#f87171" },
    { name: "Off-Road Eye", seconds: distractionSeconds.gazeOffRoadSeconds, color: "#fbbf24" },
    { name: "Drowsiness", seconds: distractionSeconds.drowsySeconds, color: "#f87171" },
    { name: "Hands Off", seconds: distractionSeconds.handsOffSeconds, color: "#38bdf8" },
    { name: "Eating/Drinking", seconds: distractionSeconds.eatingDrinkingSeconds, color: "#60a5fa" }
  ];

  // Hourly distraction patterns (mocked trend)
  const hourlyPatterns = [
    { hour: "08:00", events: 2 },
    { hour: "10:00", events: 5 },
    { hour: "12:00", events: 9 }, // Peak lunch/coffee break
    { hour: "14:00", events: 4 },
    { hour: "16:00", events: 12 }, // Peak afternoon fatigue
    { hour: "18:00", events: 3 },
    { hour: "20:00", events: 6 }
  ];

  // Last 7 trips safety trend score
  const safetyHistory = [
    { trip: "Trip 1", score: 72, distractedSecs: 210 },
    { trip: "Trip 2", score: 79, distractedSecs: 140 },
    { trip: "Trip 3", score: 85, distractedSecs: 90 },
    { trip: "Trip 4", score: 80, distractedSecs: 110 },
    { trip: "Trip 5", score: 88, distractedSecs: 45 },
    { trip: "Trip 6", score: 92, distractedSecs: 20 },
    { trip: "Trip 7", score: 95, distractedSecs: 12 }
  ];

  return (
    <div id="analytics-module" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-emerald-600 w-5 h-5" />
          <h3 className="font-semibold text-slate-800 tracking-tight text-sm uppercase">Module 6: Historical Trend & Analytics</h3>
        </div>
        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
          ANALYTICS DESK
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Distraction type comparisons */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-800 block mb-0.5">Focus Deficit Comparison</span>
            <span className="text-[10px] text-slate-400 font-mono">Seconds spent in violation during current trip</span>
          </div>
          <div className="h-44 mt-4 text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distractionData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" tickSize={4} />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#1e293b" }}
                  cursor={{ fill: "rgba(148, 163, 184, 0.05)" }}
                />
                <Bar dataKey="seconds" fill="#38bdf8" radius={[4, 4, 0, 0]}>
                  {distractionData.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hourly distraction patterns */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-800 block mb-0.5">Hourly Distraction Trajectory</span>
            <span className="text-[10px] text-slate-400 font-mono">Attention drift events triggered by time-of-day</span>
          </div>
          <div className="h-44 mt-4 text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyPatterns} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#1e293b" }} />
                <Line type="monotone" dataKey="events" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Safety score history area */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-800 block mb-0.5">7-Trip Performance Progress</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Aggregate safety score & time reduction index</span>
          </div>
          <div className="h-44 mt-4 text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safetyHistory} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="trip" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[50, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#1e293b" }} />
                <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analytics intelligence insight footer */}
      <div className="mt-4 bg-amber-50/50 p-3 rounded-lg flex items-center gap-2.5 border border-amber-100">
        <AlertCircle className="text-amber-700 w-4 h-4 shrink-0" />
        <span className="text-xs text-slate-700">
          <strong>Trend Insight:</strong> Off-Road gaze peaks sharply between 12:00 and 16:00. Scheduling targeted auditory hydration alerts at these hours is predicted to reduce attention drift events by **38%**.
        </span>
      </div>
    </div>
  );
}
