import React, { useState } from "react";
import { IncidentRecord, AlertSeverity, DistractionType } from "../types";
import { Table, Search, Download, FileText, Calendar, Filter, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface IncidentAuditProps {
  incidents: IncidentRecord[];
  onAcknowledgeIncident: (id: string) => void;
}

export default function IncidentAudit({ incidents, onAcknowledgeIncident }: IncidentAuditProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Filtering incidents
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch = inc.driverName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "ALL" || inc.severity === severityFilter;
    const matchesType = typeFilter === "ALL" || inc.type === typeFilter;
    return matchesSearch && matchesSeverity && matchesType;
  });

  // Client-Side Export to CSV format
  const handleExportCSV = () => {
    const headers = ["Incident ID", "Timestamp", "Driver ID", "Driver Name", "Violation Type", "Severity", "Speed (km/h)", "Hazard Score", "Proof/Camera Evidence", "Status"];
    const rows = filteredIncidents.map((inc) => [
      inc.id,
      inc.timestamp,
      inc.driverId,
      inc.driverName,
      `"${inc.type}"`,
      inc.severity,
      inc.speed,
      inc.hazardScore,
      `"${inc.proofFrame}"`,
      inc.acknowledgedByDriver ? "Resolved" : "Pending"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Distracted_Driving_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-Side Export to authentic Excel (.xlsx) file
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredIncidents.map((inc) => ({
        "Incident ID": inc.id,
        "Timestamp": inc.timestamp,
        "Driver ID": inc.driverId,
        "Driver Name": inc.driverName,
        "Violation Type": inc.type,
        "Severity": inc.severity,
        "Speed (km/h)": inc.speed,
        "Hazard Score": inc.hazardScore,
        "Proof / Camera Evidence": inc.proofFrame,
        "Status": inc.acknowledgedByDriver ? "Resolved" : "Pending"
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Incidents Audit Log");

      // Auto-fit column widths
      const headers = ["Incident ID", "Timestamp", "Driver ID", "Driver Name", "Violation Type", "Severity", "Speed (km/h)", "Hazard Score", "Proof / Camera Evidence", "Status"];
      const colWidths = headers.map(key => {
        let maxLen = key.length;
        dataToExport.forEach(row => {
          const val = (row as any)[key];
          if (val) {
            const len = String(val).length;
            if (len > maxLen) maxLen = len;
          }
        });
        return { wch: Math.min(maxLen + 2, 50) };
      });
      worksheet["!cols"] = colWidths;

      XLSX.writeFile(workbook, `Distracted_Driving_Audit_Log_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Failed to export Excel file:", error);
    }
  };

  // Styled printing as a clean PDF
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div id="incident-audit-module" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Table className="text-rose-500 w-5 h-5" />
            <h3 className="font-semibold text-slate-800 tracking-tight text-sm uppercase">Module 8: Incident Log & Module 7: Reporting Engine</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Detailed forensic audit trails & exporting desk</span>
        </div>

        {/* Export Button actions */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleExportCSV}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 py-1.5 px-3 rounded flex items-center gap-1.5 transition cursor-pointer font-mono text-[11px]"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            CSV EXPORT
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-1.5 px-3 rounded flex items-center gap-1.5 transition cursor-pointer font-mono text-[11px]"
            title="Export Records to MS Excel (.xlsx) file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            EXCEL EXPORT
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-slate-100 py-1.5 px-3 rounded flex items-center gap-1.5 transition cursor-pointer font-semibold shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF REPORT / PRINT
          </button>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search driver profiles..."
            className="w-full bg-white border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-2.5 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value={AlertSeverity.CRITICAL}>Critical Alarm Only</option>
            <option value={AlertSeverity.HIGH}>High Severity</option>
            <option value={AlertSeverity.MEDIUM}>Medium Severity</option>
            <option value={AlertSeverity.LOW}>Low Severity</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 text-xs px-2.5 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Violations</option>
            <option value={DistractionType.TEXTING_RIGHT}>Texting (Right Hand)</option>
            <option value={DistractionType.PHONE_CALL_RIGHT}>Phone Call (Right Hand)</option>
            <option value={DistractionType.TEXTING_LEFT}>Texting (Left Hand)</option>
            <option value={DistractionType.PHONE_CALL_LEFT}>Phone Call (Left Hand)</option>
            <option value={DistractionType.ADJUSTING_RADIO}>Adjusting Radio</option>
            <option value={DistractionType.DRINKING_EATING}>Drinking or Eating</option>
            <option value={DistractionType.REACHING_BEHIND}>Reaching Behind</option>
            <option value={DistractionType.HAIR_MAKEUP}>Hair & Makeup</option>
            <option value={DistractionType.TALKING_PASSENGER}>Talking to Passenger</option>
            <option value={DistractionType.FATIGUE_DROWSINESS}>Fatigue or Drowsiness</option>
          </select>
        </div>
      </div>

      {/* Audit table logs */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white max-h-80 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500 font-mono uppercase text-[10px] tracking-wider">
              <th className="p-3">Incident / Date</th>
              <th className="p-3">Operator Driver</th>
              <th className="p-3">Trigger behavior</th>
              <th className="p-3 text-center">Severity</th>
              <th className="p-3 text-center">Hazard</th>
              <th className="p-3 text-center">Speed</th>
              <th className="p-3">Proof Snapshot</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-mono text-sm">
                  No matching driver violations or incident records found.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((inc, idx) => (
                <tr key={`${inc.id}-${idx}`} className="hover:bg-slate-50 text-slate-700 transition-all">
                  <td className="p-3">
                    <span className="font-mono text-slate-400 block text-[10px]">
                      {new Date(inc.timestamp).toLocaleDateString()}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(inc.timestamp).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{inc.driverName}</td>
                  <td className="p-3 font-mono text-slate-800 text-[11px]">{inc.type}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      inc.severity === AlertSeverity.CRITICAL ? "bg-red-50 text-red-700 border border-red-200 animate-pulse" :
                      inc.severity === AlertSeverity.HIGH ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      inc.severity === AlertSeverity.MEDIUM ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-800">{inc.hazardScore}%</td>
                  <td className="p-3 text-center font-mono text-slate-500">{inc.speed} km/h</td>
                  <td className="p-3 max-w-xs truncate text-[11px] text-slate-500 italic" title={inc.proofFrame}>
                    {inc.proofFrame}
                  </td>
                  <td className="p-3 text-right">
                    {inc.acknowledgedByDriver ? (
                      <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        RESOLVED
                      </span>
                    ) : (
                      <button
                        onClick={() => onAcknowledgeIncident(inc.id)}
                        className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded transition cursor-pointer shadow-sm"
                      >
                        RESOLVE
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
