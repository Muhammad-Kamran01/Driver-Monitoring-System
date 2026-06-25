import React, { useState, useEffect, useRef } from "react";
import { AlertSeverity, DistractionType } from "../types";
import { Bell, ShieldAlert, Volume2, VolumeX, Send, CheckSquare, Trash2 } from "lucide-react";

interface AlertDispatcherProps {
  activeDistraction: DistractionType | null;
  onSendCustomAlert: (msg: string, severity: AlertSeverity) => void;
  recentAlertLogs: Array<{
    id: string;
    timestamp: string;
    message: string;
    severity: AlertSeverity;
    acknowledged: boolean;
  }>;
  onResolveAlert: (id: string) => void;
  onClearAllAlerts: () => void;
}

export default function AlertDispatcher({
  activeDistraction,
  onSendCustomAlert,
  recentAlertLogs,
  onResolveAlert,
  onClearAllAlerts
}: AlertDispatcherProps) {
  const [customMsg, setCustomMsg] = useState("");
  const [severity, setSeverity] = useState<AlertSeverity>(AlertSeverity.HIGH);

  // Hands-free Automatic Alerts state
  const [autoVoiceAlert, setAutoVoiceAlert] = useState(true);
  const lastSpokenDistractionRef = useRef<DistractionType | null>(null);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;
    onSendCustomAlert(customMsg, severity);
    setCustomMsg("");
  };

  // Simulate Speak Warning using Web Speech API (synthesizer)
  const speakAlert = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // slightly faster for quick cabin reaction times
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech Synthesis is not supported in this browser. Alert text:", text);
    }
  };

  // Audio suggestion trigger text based on the 11-class QNN+VQC model
  const getAudioSimulationText = () => {
    if (!activeDistraction) return null;
    
    switch (activeDistraction) {
      case DistractionType.TEXTING_RIGHT:
        return "Warning! Texting with your right hand. Place the phone down immediately!";
      case DistractionType.PHONE_CALL_RIGHT:
        return "Hands-free operation only! End phone call with right hand.";
      case DistractionType.TEXTING_LEFT:
        return "Alert! Texting with your left hand. Please focus on steering.";
      case DistractionType.PHONE_CALL_LEFT:
        return "Warning! Active phone call with left hand. Eyes on the road.";
      case DistractionType.ADJUSTING_RADIO:
        return "Attention! Avoid long glances to adjust the radio. Look forward.";
      case DistractionType.DRINKING_EATING:
        return "Manual distraction warning! Eating or drinking. Place both hands on the wheel.";
      case DistractionType.REACHING_BEHIND:
        return "Danger! Reaching behind seat. Stop immediately and focus on driving.";
      case DistractionType.HAIR_MAKEUP:
        return "Grooming behavior detected. Avoid adjusting hair and makeup while moving.";
      case DistractionType.TALKING_PASSENGER:
        return "Focus alert! Passenger distraction. Please keep eyes on the road.";
      case DistractionType.FATIGUE_DROWSINESS:
        return "Critical Alert! Extreme driver drowsiness and fatigue detected. Pull over immediately!";
      default:
        return null;
    }
  };

  const currentAudioText = getAudioSimulationText();

  // Hands-free Automatic TTS effect: fires automatically when the activeDistraction changes!
  useEffect(() => {
    if (autoVoiceAlert && activeDistraction && activeDistraction !== lastSpokenDistractionRef.current) {
      const text = getAudioSimulationText();
      if (text) {
        speakAlert(text);
      }
      lastSpokenDistractionRef.current = activeDistraction;
    } else if (!activeDistraction) {
      lastSpokenDistractionRef.current = null;
    }
  }, [activeDistraction, autoVoiceAlert]);

  return (
    <div id="alert-dispatcher-module" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="text-rose-500 w-5 h-5" />
            <h3 className="font-semibold text-slate-800 tracking-tight text-sm uppercase">Module 3: Active Alert HUD & Dispatcher</h3>
          </div>
          <div className="flex items-center gap-3">
            {/* Hands-free Auto-TTS Toggle Switch */}
            <button
              type="button"
              onClick={() => {
                const next = !autoVoiceAlert;
                setAutoVoiceAlert(next);
                speakAlert(next ? "Automatic voice alerts enabled." : "Automatic voice alerts muted.");
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition cursor-pointer ${
                autoVoiceAlert 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                  : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
              }`}
              title="Toggle automatic hands-free audio announcements on distraction"
            >
              {autoVoiceAlert ? <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-bounce" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>AUTO-TTS: {autoVoiceAlert ? "ON" : "OFF"}</span>
            </button>

            <button 
              onClick={onClearAllAlerts}
              className="text-[10px] font-mono text-slate-400 hover:text-rose-600 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3 h-3" />
              CLEAR
            </button>
          </div>
        </div>

        {/* HUD Cabin Screen Visualizer */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative mb-4">
          <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-400">IN-CABIN HUD SCREEN</div>
          
          {activeDistraction ? (
            <div className="text-center py-4 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-rose-500/15 text-rose-500 rounded-full flex items-center justify-center animate-ping mb-2 absolute" />
              <div className="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-2 relative z-10">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <p className="text-rose-500 font-bold uppercase text-xs tracking-wider animate-pulse">
                CRITICAL IN-VEHICLE INTERVENTION
              </p>
              <h4 className="text-slate-800 font-semibold text-sm mt-1 mb-2">
                {activeDistraction}
              </h4>
              
              {currentAudioText && (
                <button
                  onClick={() => speakAlert(currentAudioText)}
                  className="bg-rose-600 hover:bg-rose-700 text-slate-100 text-[10px] font-bold py-1 px-3 rounded-full flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  SIMULATE VOICE TTS BROADCAST
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center justify-center mx-auto mb-2">
                <CheckSquare className="w-5 h-5" />
              </div>
              <p className="text-emerald-600 font-bold uppercase text-xs tracking-wider">
                CABIN HUD STATE: SECURE
              </p>
              <p className="text-xs text-slate-500 mt-1">
                No active behavior violations detected.
              </p>
            </div>
          )}
        </div>

        {/* Real-time Alert Timeline */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-slate-500 block mb-2">Active Intervention Logs</span>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {recentAlertLogs.length === 0 ? (
              <div className="text-center text-slate-400 py-4 font-mono text-[10px]">
                No alert dispatches in current session.
              </div>
            ) : (
              recentAlertLogs.map((log, idx) => (
                <div 
                  key={`${log.id}-${idx}`} 
                  className={`p-2 rounded flex items-start gap-2 border ${
                    log.acknowledged 
                      ? "bg-slate-100/60 border-slate-200 text-slate-400" 
                      : log.severity === AlertSeverity.CRITICAL 
                      ? "bg-rose-50 border-rose-100 text-rose-900"
                      : log.severity === AlertSeverity.HIGH
                      ? "bg-amber-50 border-amber-100 text-amber-900"
                      : "bg-indigo-50 border-indigo-100 text-indigo-900"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`text-[9px] font-bold px-1 rounded ${
                        log.acknowledged
                          ? "bg-slate-200 text-slate-500"
                          : log.severity === AlertSeverity.CRITICAL 
                          ? "bg-rose-100 text-rose-700" 
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {log.severity}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={`font-medium text-xs leading-snug ${log.acknowledged ? "text-slate-400 line-through" : "text-slate-800"}`}>{log.message}</p>
                  </div>
                  {!log.acknowledged && (
                    <button 
                      onClick={() => {
                        onResolveAlert(log.id);
                        speakAlert("Acknowledge message cleared.");
                      }}
                      className="text-[9px] bg-white hover:bg-slate-100 text-slate-700 py-0.5 px-1.5 rounded border border-slate-200 font-mono transition cursor-pointer"
                    >
                      ACK
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Manual Dispatch Builder Alert Form */}
      <form onSubmit={handleDispatch} className="border-t border-slate-100 pt-4 mt-auto">
        <span className="text-xs font-semibold text-slate-500 block mb-2">Dispatcher Push Intervention</span>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            placeholder="Type custom dispatch message (e.g. 'Alexander, please take a break')"
            className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
              className="bg-white border border-slate-200 text-slate-800 text-xs px-2 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value={AlertSeverity.LOW}>Low Severity</option>
              <option value={AlertSeverity.MEDIUM}>Medium Severity</option>
              <option value={AlertSeverity.HIGH}>High Severity</option>
              <option value={AlertSeverity.CRITICAL}>Critical Alarm</option>
            </select>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-slate-100 font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 text-xs transition cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              DISPATCH
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
