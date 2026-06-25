import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Brain, RefreshCw, Send, AlertCircle, Quote } from "lucide-react";
import { DriverProfile, IncidentRecord } from "../types";

interface SafetyCoachProps {
  driver: DriverProfile;
  incidents: IncidentRecord[];
  phoneUsageSeconds: number;
  gazeOffRoadSeconds: number;
  drowsySeconds: number;
  handsOffSeconds: number;
  eatingDrinkingSeconds: number;
}

export default function SafetyCoach({
  driver,
  incidents,
  phoneUsageSeconds,
  gazeOffRoadSeconds,
  drowsySeconds,
  handsOffSeconds,
  eatingDrinkingSeconds
}: SafetyCoachProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportSource, setReportSource] = useState<string>("");

  const fetchCoachingReport = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch("/api/gemini/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverName: driver.name,
          riskScore: driver.riskScore,
          distractionStats: {
            phoneUsageSeconds,
            gazeOffRoadSeconds,
            drowsySeconds,
            handsOffSeconds,
            eatingDrinkingSeconds
          },
          incidents: incidents.filter((inc) => inc.driverId === driver.id)
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReport(data.report);
        setReportSource(data.source || "AI Coach");
      } else {
        setError(data.error || "Failed to generate coaching recommendation.");
      }
    } catch (err: any) {
      setError("Unable to communicate with safety coaching microservice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="safety-coach-module" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
      {/* Background radial gradient representing neural networks */}
      <div className="absolute top-0 left-0 w-44 h-44 bg-violet-600/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Brain className="text-violet-500 w-5 h-5" />
          <h3 className="font-semibold text-slate-800 tracking-tight text-sm uppercase">Module 12: AI Safety Coach Copilot</h3>
        </div>
        <span className="text-[10px] font-mono bg-violet-50 text-violet-600 px-2 py-0.5 rounded border border-violet-100">
          GEMINI COGNITIVE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left column: Driver metrics review summary */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block uppercase">TARGET AUDIT PROFILE</span>
            <h4 className="font-bold text-slate-800 text-sm mt-0.5">{driver.name}</h4>
            <span className="text-xs text-slate-500 block font-mono">Current Score: {driver.riskScore}/100</span>
            
            <div className="mt-4 space-y-2 text-[11px] font-mono text-slate-600">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Phone Violation Time:</span>
                <span className="text-rose-600 font-bold">{phoneUsageSeconds}s</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Gaze Deviation Time:</span>
                <span className="text-amber-600 font-bold">{gazeOffRoadSeconds}s</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Yawn/Drowsiness Count:</span>
                <span className="text-red-600 font-bold">{drowsySeconds}s</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span>Hands-Off Duration:</span>
                <span className="text-sky-600 font-bold">{handsOffSeconds}s</span>
              </div>
            </div>
          </div>

          <button
            onClick={fetchCoachingReport}
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-slate-100 font-bold py-2 px-3 rounded text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                AUDITING TELEMETRY...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                RUN GEMINI SAFETY AUDIT
              </>
            )}
          </button>
        </div>

        {/* Right column: Gemini Generated Output Report */}
        <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 min-h-[220px] flex flex-col justify-between">
          <div className="markdown-body text-xs text-slate-700 overflow-y-auto max-h-[300px] pr-1 space-y-2 leading-relaxed">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 font-mono">
                <Brain className="w-10 h-10 text-violet-500 animate-bounce mb-2" />
                <p className="animate-pulse font-medium">Consulting Gemini Safety Engine...</p>
                <p className="text-[10px] text-slate-400 mt-1">Analyzing tri-axial G-forces and off-road eyes gazing index</p>
              </div>
            )}

            {!loading && !report && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <Quote className="w-8 h-8 text-slate-200 mb-1" />
                <p className="italic">Click the button to request real-time Gemini coaching advice based on current distracted behaviors and incident trends.</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!loading && report && (
              <div className="space-y-3 prose max-w-none text-slate-700">
                <ReactMarkdown>
                  {report}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {report && !loading && (
            <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>Source: <strong className="text-violet-600">{reportSource}</strong></span>
              <span>Audit Stamp: {new Date().toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
