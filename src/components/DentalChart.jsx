import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { ShieldAlert, Trash2, Heart, History, UserCheck, HelpCircle } from 'lucide-react';

export default function DentalChart({ patientId }) {
  const { dentalCharts, toothRecords, toothHistory, updateToothRecord, users } = useDatabase();
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [editStatus, setEditStatus] = useState('Healthy');
  const [editSurfaces, setEditSurfaces] = useState({ M: false, D: false, O: false, B: false, L: false });
  const [editNotes, setEditNotes] = useState('');

  const chart = dentalCharts.find(c => c.PatientId === Number(patientId));
  if (!chart) {
    return <div className="text-muted">No dental chart found for this patient.</div>;
  }

  const patientTeeth = toothRecords.filter(tr => tr.ChartId === chart.ChartId);

  // Divide into upper (1-16) and lower (17-32) arches
  const upperTeeth = patientTeeth.filter(tr => tr.ToothNumber >= 1 && tr.ToothNumber <= 16);
  // Lower teeth: 17 to 32. Usually rendered 32 to 17 left-to-right to align with upper teeth structurally
  const lowerTeeth = patientTeeth
    .filter(tr => tr.ToothNumber >= 17 && tr.ToothNumber <= 32)
    .sort((a, b) => b.ToothNumber - a.ToothNumber);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Healthy': return 'var(--tooth-healthy)';
      case 'Caries': return 'var(--tooth-caries)';
      case 'Filled': return 'var(--tooth-filled)';
      case 'Crown': return 'var(--tooth-crown)';
      case 'Missing': return 'var(--tooth-missing)';
      case 'Root Canal': return 'var(--tooth-rootcanal)';
      case 'Bridge': return 'var(--tooth-bridge)';
      case 'Implant': return 'var(--tooth-implant)';
      case 'Extraction Needed': return 'var(--tooth-caries)';
      case 'Fractured': return 'var(--tooth-caries)';
      case 'Impacted': return 'var(--tooth-watch)';
      case 'Watch': return 'var(--tooth-watch)';
      default: return 'var(--border-color)';
    }
  };

  const handleToothClick = (tooth) => {
    setSelectedTooth(tooth);
    setEditStatus(tooth.ToothStatus);
    setEditNotes(tooth.Notes || '');
    
    // Parse surfaces from DB (MDOBL string)
    const surfs = { M: false, D: false, O: false, B: false, L: false };
    if (tooth.Surface) {
      tooth.Surface.split('').forEach(char => {
        if (surfs.hasOwnProperty(char)) surfs[char] = true;
      });
    }
    setEditSurfaces(surfs);
  };

  const handleSave = () => {
    if (!selectedTooth) return;

    // Compile surfaces back to string
    const surfStr = Object.keys(editSurfaces)
      .filter(k => editSurfaces[k])
      .join('');

    updateToothRecord(
      chart.ChartId,
      selectedTooth.ToothNumber,
      editStatus,
      surfStr || null,
      editNotes
    );
    setSelectedTooth(null);
  };

  const toggleSurface = (surf) => {
    setEditSurfaces(prev => ({ ...prev, [surf]: !prev[surf] }));
  };

  // Render a visual representation of 5 surfaces for a tooth
  const renderToothSVG = (tooth, size = 32) => {
    const isMissing = tooth.ToothStatus === 'Missing';
    const isCrown = tooth.ToothStatus === 'Crown' || tooth.ToothStatus === 'Bridge' || tooth.ToothStatus === 'Implant';
    const hasSurfaceMod = ['Caries', 'Filled', 'Watch'].includes(tooth.ToothStatus);
    
    // Get colors
    const baseColor = getStatusColor(tooth.ToothStatus);
    const fillForSurface = (surf) => {
      if (isCrown) return baseColor;
      if (hasSurfaceMod && tooth.Surface && tooth.Surface.includes(surf)) {
        return baseColor;
      }
      return 'transparent';
    };

    return (
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ opacity: isMissing ? 0.25 : 1 }}>
        {/* Outer boundaries */}
        <rect x="0" y="0" width="40" height="40" fill="none" stroke="var(--border-color)" strokeWidth="1" />
        
        {/* Occlusal / Incisal (Center) */}
        <rect x="12" y="12" width="16" height="16" 
          fill={fillForSurface('O')} 
          stroke="var(--text-muted)" strokeWidth="1" />
        
        {/* Buccal / Labial (Top) */}
        <polygon points="0,0 40,0 28,12 12,12" 
          fill={fillForSurface('B')} 
          stroke="var(--text-muted)" strokeWidth="1" />
        
        {/* Lingual (Bottom) */}
        <polygon points="12,28 28,28 40,40 0,40" 
          fill={fillForSurface('L')} 
          stroke="var(--text-muted)" strokeWidth="1" />
        
        {/* Mesial (Left) */}
        <polygon points="0,0 12,12 12,28 0,40" 
          fill={fillForSurface('M')} 
          stroke="var(--text-muted)" strokeWidth="1" />
        
        {/* Distal (Right) */}
        <polygon points="40,0 40,40 28,28 28,12" 
          fill={fillForSurface('D')} 
          stroke="var(--text-muted)" strokeWidth="1" />

        {/* If entire tooth status is something like Root Canal, show a red center line */}
        {tooth.ToothStatus === 'Root Canal' && (
          <line x1="20" y1="2" x2="20" y2="38" stroke="var(--tooth-rootcanal)" strokeWidth="4" />
        )}
      </svg>
    );
  };

  // Get audit trail for this patient's teeth
  const getPatientHistory = () => {
    const recordsMap = {};
    patientTeeth.forEach(r => { recordsMap[r.ToothRecordId] = r.ToothNumber; });
    return toothHistory.filter(h => recordsMap.hasOwnProperty(h.ToothRecordId));
  };

  const currentPatientHistory = getPatientHistory();

  return (
    <div className="dental-chart-container animate-fade">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Interactive 3D Dental Chart</h3>
          <p className="text-xs text-muted">Universal Tooth Numbering System (1 - 32). Click a tooth to view details or modify status.</p>
        </div>
        
        {/* Color Legend */}
        <div className="flex flex-wrap gap-2 text-xs" style={{ maxWidth: '600px' }}>
          <span className="badge badge-success" style={{ textTransform: 'none', background: 'rgba(16, 185, 129, 0.08)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tooth-healthy)' }}></span> Healthy
          </span>
          <span className="badge badge-danger" style={{ textTransform: 'none', background: 'rgba(239, 68, 68, 0.08)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tooth-caries)' }}></span> Caries
          </span>
          <span className="badge badge-info" style={{ textTransform: 'none', background: 'rgba(14, 165, 233, 0.08)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tooth-filled)' }}></span> Filled
          </span>
          <span className="badge" style={{ textTransform: 'none', background: 'rgba(59, 130, 246, 0.08)', color: 'var(--tooth-crown)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tooth-crown)' }}></span> Crown/Bridge
          </span>
          <span className="badge" style={{ textTransform: 'none', background: 'rgba(139, 92, 246, 0.08)', color: 'var(--tooth-rootcanal)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tooth-rootcanal)' }}></span> Root Canal
          </span>
          <span className="badge" style={{ textTransform: 'none', background: 'rgba(236, 72, 153, 0.08)', color: 'var(--tooth-implant)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tooth-implant)' }}></span> Implant
          </span>
          <span className="badge badge-warning" style={{ textTransform: 'none', background: 'rgba(245, 158, 11, 0.08)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tooth-watch)' }}></span> Watch
          </span>
          <span className="badge" style={{ textTransform: 'none', background: 'rgba(107, 114, 128, 0.08)', color: '#9ca3af' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--tooth-missing)' }}></span> Missing
          </span>
        </div>
      </div>

      {/* Upper Arch (1-16) */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-muted mb-2 text-center" style={{ letterSpacing: '0.05em' }}>UPPER ARCH (MAXILLA)</div>
        <div className="tooth-grid">
          {upperTeeth.map(tooth => (
            <div 
              key={tooth.ToothRecordId} 
              className={`tooth-item ${selectedTooth?.ToothRecordId === tooth.ToothRecordId ? 'selected' : ''}`}
              onClick={() => handleToothClick(tooth)}
            >
              <div className="tooth-number">{tooth.ToothNumber}</div>
              <div className="tooth-visual">{renderToothSVG(tooth)}</div>
              <div className="text-center font-semibold text-muted" style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                {tooth.ToothStatus === 'Healthy' ? '' : tooth.ToothStatus.split(' ')[0]}
              </div>
              {tooth.Surface && (
                <div className="text-center text-primary font-bold" style={{ fontSize: '8px', color: 'var(--primary)' }}>
                  {tooth.Surface}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lower Arch (17-32) */}
      <div className="mb-6">
        <div className="tooth-grid">
          {lowerTeeth.map(tooth => (
            <div 
              key={tooth.ToothRecordId} 
              className={`tooth-item ${selectedTooth?.ToothRecordId === tooth.ToothRecordId ? 'selected' : ''}`}
              onClick={() => handleToothClick(tooth)}
            >
              {tooth.Surface && (
                <div className="text-center text-primary font-bold" style={{ fontSize: '8px', color: 'var(--primary)' }}>
                  {tooth.Surface}
                </div>
              )}
              <div className="text-center font-semibold text-muted" style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                {tooth.ToothStatus === 'Healthy' ? '' : tooth.ToothStatus.split(' ')[0]}
              </div>
              <div className="tooth-visual">{renderToothSVG(tooth)}</div>
              <div className="tooth-number">{tooth.ToothNumber}</div>
            </div>
          ))}
        </div>
        <div className="text-xs font-semibold text-muted mt-2 text-center" style={{ letterSpacing: '0.05em' }}>LOWER ARCH (MANDIBLE)</div>
      </div>

      {/* Interactive Tooth Editor Modal */}
      {selectedTooth && (
        <div className="modal-overlay" onClick={() => setSelectedTooth(null)}>
          <div className="modal-content animate-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="text-base font-bold">Chart Tooth #{selectedTooth.ToothNumber}</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setSelectedTooth(null)} style={{ border: 'none', background: 'transparent' }}>&times;</button>
            </div>
            <div className="modal-body flex flex-col gap-4">
              {/* SVG Graphic */}
              <div className="flex justify-center items-center py-4 bg-app rounded-lg border border-color gap-8">
                {renderToothSVG(selectedTooth, 96)}
                
                {/* Surface selectors if applicable */}
                {['Caries', 'Filled', 'Watch'].includes(editStatus) ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-muted">Select Damaged/Treated Surfaces:</span>
                    <div className="flex gap-2">
                      {['B', 'O', 'L', 'M', 'D'].map(s => (
                        <button 
                          key={s} 
                          className={`btn ${editSurfaces[s] ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 12px', minWidth: '40px', fontSize: '12px' }}
                          onClick={() => toggleSurface(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <span className="text-xxs text-muted">(B=Buccal, O=Occlusal, L=Lingual, M=Mesial, D=Distal)</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted" style={{ maxWidth: '180px' }}>
                    Surfaces selection only active for Caries, Filled, or Watch statuses.
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="form-label">Tooth Status</label>
                <select 
                  className="form-select"
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                >
                  <option value="Healthy">Healthy</option>
                  <option value="Caries">Caries (Decay)</option>
                  <option value="Filled">Filled (Restoration)</option>
                  <option value="Crown">Crown (Prosthetic)</option>
                  <option value="Root Canal">Root Canal</option>
                  <option value="Bridge">Bridge Pontic/Abutment</option>
                  <option value="Implant">Implant</option>
                  <option value="Missing">Missing</option>
                  <option value="Extraction Needed">Extraction Needed</option>
                  <option value="Fractured">Fractured</option>
                  <option value="Impacted">Impacted</option>
                  <option value="Watch">Watch (Monitor)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="form-label">Clinical Notes</label>
                <textarea 
                  className="form-textarea" 
                  rows="3" 
                  placeholder="Enter clinical notes for this tooth..."
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedTooth(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Record</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Log */}
      <div className="mt-4 border-t border-color pt-4">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <History size={16} className="text-primary" /> Tooth Clinical History Log
        </h4>
        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
          {currentPatientHistory.length === 0 ? (
            <p className="text-xs text-muted">No historical clinical actions logged for this chart.</p>
          ) : (
            <table className="custom-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 12px' }}>Changed At</th>
                  <th style={{ padding: '6px 12px' }}>Tooth #</th>
                  <th style={{ padding: '6px 12px' }}>Prev State</th>
                  <th style={{ padding: '6px 12px' }}>New State</th>
                  <th style={{ padding: '6px 12px' }}>Surfaces</th>
                  <th style={{ padding: '6px 12px' }}>Notes</th>
                  <th style={{ padding: '6px 12px' }}>Dentist</th>
                </tr>
              </thead>
              <tbody>
                {currentPatientHistory.map(h => {
                  const dentist = users.find(u => u.UserId === h.ChangedByUserId);
                  return (
                    <tr key={h.HistoryId}>
                      <td style={{ padding: '6px 12px' }}>{new Date(h.ChangedAt).toLocaleString()}</td>
                      <td style={{ padding: '6px 12px', fontWeight: 'bold' }}>{toothRecords.find(t => t.ToothRecordId === h.ToothRecordId)?.ToothNumber || 'N/A'}</td>
                      <td style={{ padding: '6px 12px' }}>
                        <span className="badge" style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', color: getStatusColor(h.PreviousStatus) }}>
                          {h.PreviousStatus || 'None'}
                        </span>
                      </td>
                      <td style={{ padding: '6px 12px' }}>
                        <span className="badge" style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', color: getStatusColor(h.NewStatus) }}>
                          {h.NewStatus}
                        </span>
                      </td>
                      <td style={{ padding: '6px 12px', fontWeight: 'bold', color: 'var(--primary)' }}>{h.NewSurface || '-'}</td>
                      <td style={{ padding: '6px 12px' }} className="text-muted">{h.Notes || '-'}</td>
                      <td style={{ padding: '6px 12px' }}>{dentist ? `Dr. ${dentist.LastName}` : 'System'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
