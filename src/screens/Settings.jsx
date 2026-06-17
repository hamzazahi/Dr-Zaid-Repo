import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Settings, Shield, Wrench, Edit, DollarSign, RefreshCw } from 'lucide-react';

export default function SettingsScreen() {
  const { 
    procedures, 
    procedureCategories, 
    roles, 
    users, 
    updateProcedureCost,
    currentUser,
    setCurrentUser
  } = useDatabase();

  const [editingProcId, setEditingProcId] = useState(null);
  const [editCost, setEditCost] = useState('');

  const handleEditCost = (proc) => {
    setEditingProcId(proc.ProcedureId);
    setEditCost(proc.DefaultCost.toString());
  };

  const handleSaveCost = (procId) => {
    if (isNaN(Number(editCost)) || Number(editCost) < 0) {
      alert("Invalid price amount.");
      return;
    }
    updateProcedureCost(procId, Number(editCost));
    setEditingProcId(null);
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-sm text-muted">Configure clinic procedures, view system roles, and toggle user profiles.</p>
      </div>

      {/* Role and User switching */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel flex flex-col gap-3">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Shield size={18} className="text-primary" /> Active User Simulation
          </h3>
          <p className="text-xs text-muted mb-2">Toggle between different users to test permission levels on the frontend application.</p>
          
          <div className="flex flex-col gap-2">
            <label className="form-label">Active User Session:</label>
            <select 
              className="form-select"
              value={currentUser.UserId}
              onChange={e => {
                const sel = users.find(u => u.UserId === Number(e.target.value));
                setCurrentUser(sel);
              }}
            >
              {users.map(u => {
                const r = roles.find(role => role.RoleId === u.RoleId);
                return (
                  <option key={u.UserId} value={u.UserId}>
                    {u.FirstName} {u.LastName} ({r ? r.RoleName : 'User'})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="mt-4 p-3 bg-sidebar border border-color rounded text-xs">
            <div className="font-semibold text-primary">Current Session Privileges:</div>
            <p className="text-muted mt-1 leading-relaxed">
              Role: <strong>{roles.find(r => r.RoleId === currentUser.RoleId)?.RoleName}</strong><br/>
              Access notes: {roles.find(r => r.RoleId === currentUser.RoleId)?.Description}
            </p>
          </div>
        </div>

        {/* Categories panel */}
        <div className="glass-panel flex flex-col gap-3">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Wrench size={18} className="text-primary" /> Procedure Categories
          </h3>
          <div className="flex flex-col gap-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {procedureCategories.map(cat => (
              <div key={cat.CategoryId} className="p-2.5 rounded bg-sidebar border border-color flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-primary">{cat.CategoryName}</span>
                  <span className="block text-muted mt-0.5" style={{ fontSize: '11px' }}>{cat.Description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Procedures Catalog Editor */}
      <div className="glass-panel">
        <h3 className="text-base font-bold flex items-center gap-2 mb-3">
          <DollarSign size={18} className="text-primary" /> CDT Dental Procedures & Pricing Catalogue
        </h3>

        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table className="custom-table" style={{ fontSize: '12.5px' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-sidebar)', zIndex: 1 }}>
                <th>ADA Code</th>
                <th>Procedure Name</th>
                <th>Category</th>
                <th>Est. Time</th>
                <th>Default Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {procedures.map(proc => {
                const category = procedureCategories.find(c => c.CategoryId === proc.CategoryId);
                const isEditing = editingProcId === proc.ProcedureId;
                
                return (
                  <tr key={proc.ProcedureId}>
                    <td className="font-bold text-xs text-muted">{proc.ProcedureCode}</td>
                    <td className="font-semibold">{proc.ProcedureName}</td>
                    <td className="text-muted">{category ? category.CategoryName : 'Diagnostic'}</td>
                    <td>{proc.DefaultDurationMinutes} Mins</td>
                    <td>
                      {isEditing ? (
                        <div className="flex items-center gap-1" style={{ maxWidth: '100px' }}>
                          <span className="text-muted">$</span>
                          <input 
                            type="number" 
                            className="form-input text-xs" 
                            style={{ padding: '4px 8px' }}
                            value={editCost} 
                            onChange={e => setEditCost(e.target.value)} 
                          />
                        </div>
                      ) : (
                        <strong className="text-teal-400">${proc.DefaultCost.toFixed(2)}</strong>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleSaveCost(proc.ProcedureId)}>
                            Save
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setEditingProcId(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-secondary flex items-center gap-1" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleEditCost(proc)}>
                          <Edit size={12} /> Edit Cost
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
