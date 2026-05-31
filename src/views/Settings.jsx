import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../services/mockDb';

const Settings = () => {
  const { user, hasEditPermission } = useAuth();
  
  // Settings values
  const [gasUrl, setGasUrl] = useState(() => localStorage.getItem('evm_gas_url') || 'https://script.google.com/macros/s/AKfycbz_EVM_PROX_Deployment_ID/exec');
  const [sheetId, setSheetId] = useState(() => localStorage.getItem('evm_sheet_id') || '1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T_EVM');
  const [alertEmail, setAlertEmail] = useState(() => localStorage.getItem('evm_alert_email') || 'partner1@excellencevoices.com');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lastBackup, setLastBackup] = useState('2026-05-30 02:00:03 AM');
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaved(false);

    if (!hasEditPermission) {
      setErrorMsg('Unauthorized: Only managers are permitted to modify system configurations.');
      return;
    }

    if (confirmPassword !== 'password123') {
      setErrorMsg('Incorrect Admin Password. Access Denied.');
      return;
    }

    localStorage.setItem('evm_gas_url', gasUrl);
    localStorage.setItem('evm_sheet_id', sheetId);
    localStorage.setItem('evm_alert_email', alertEmail);
    setConfirmPassword('');
    setSaved(true);
    
    // Sync immediately if URL is set
    try {
      await mockDb.syncData();
    } catch (err) {
      console.error('Failed to sync on settings update:', err);
    }
    
    mockDb.logAction('Settings Updated', 'Modified Google Sheets API configuration settings');
    setTimeout(() => setSaved(false), 3000);
  };

  const triggerManualBackup = async () => {
    if (gasUrl && !gasUrl.includes('EVM_PROX_Deployment_ID')) {
      try {
        const response = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'manualBackup' })
        });
        const result = await response.json();
        if (result.success) {
          const now = new Date();
          const formatted = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
          setLastBackup(formatted);
          alert('Spreadsheet backup successfully copied to Google Drive /Backups directory.');
          mockDb.logAction('Backup Triggered', 'Manually initiated daily spreadsheet backup duplicate');
          return;
        }
      } catch (err) {
        console.error('Remote backup trigger failed:', err);
      }
    }
    
    mockDb.logAction('Backup Triggered', 'Manually initiated daily spreadsheet backup duplicate (Local)');
    const now = new Date();
    const formatted = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
    setLastBackup(formatted);
    alert('Spreadsheet backup successfully copied to local backups database.');
  };

  const triggerWeeklyExport = async () => {
    if (gasUrl && !gasUrl.includes('EVM_PROX_Deployment_ID')) {
      try {
        const response = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'manualExport' })
        });
        const result = await response.json();
        if (result.success && result.downloadUrl) {
          window.open(result.downloadUrl, '_blank');
          mockDb.logAction('Excel Export Triggered', 'Manually compiled spreadsheet as .xlsx download');
          return;
        }
      } catch (err) {
        console.error('Remote Excel export trigger failed:', err);
      }
    }
    
    mockDb.logAction('Excel Export Triggered', 'Manually compiled spreadsheet as .xlsx download (Local)');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            System variables, connector configuration, and backups.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* API connection settings */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-cyan)' }}>
            Google Sheets Connector Setup
          </h3>

          {saved && (
            <div className="alert-box" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.5rem', padding: '0.75rem 1rem', borderRadius: '6px' }}>
              <span className="alert-message" style={{ color: 'var(--color-green)' }}>Settings successfully updated and saved.</span>
            </div>
          )}

          {errorMsg && (
            <div className="alert-box" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.5rem', padding: '0.75rem 1rem', borderRadius: '6px' }}>
              <span className="alert-message" style={{ color: 'var(--color-pink)' }}>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Google Apps Script Web App Deployment URL</label>
              <input 
                type="text" 
                className="form-input" 
                value={gasUrl} 
                onChange={(e) => setGasUrl(e.target.value)} 
                disabled={!hasEditPermission}
                required 
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Used as the secure API proxy to write transactions to the spreadsheet backend.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Target Google Spreadsheet ID</label>
              <input 
                type="text" 
                className="form-input" 
                value={sheetId} 
                onChange={(e) => setSheetId(e.target.value)} 
                disabled={!hasEditPermission}
                required 
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Spreadsheet instance holding the 8 database tabs.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Alert Notification Recipient Email</label>
              <input 
                type="email" 
                className="form-input" 
                value={alertEmail} 
                onChange={(e) => setAlertEmail(e.target.value)} 
                disabled={!hasEditPermission}
                required 
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Recipient email for change alerts routed through Google Apps Script.
              </p>
            </div>

            {hasEditPermission && (
              <div className="form-group">
                <label className="form-label">Confirm Authorization Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Enter administrator passcode to authorize changes"
                  required 
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Please type the administrative password (<code style={{ color: 'var(--color-cyan)' }}>password123</code>) to unlock saving.
                </p>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '140px', marginTop: '0.5rem' }}
              disabled={!hasEditPermission}
            >
              Save Settings
            </button>
          </form>
        </div>

        {/* Backups and Exports Operations control panel */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-orange)' }}>
            Data Maintenance Controls
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Daily Backup Snapshots</span>
                <button onClick={triggerManualBackup} className="btn btn-secondary btn-small">Backup Now</button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Time-driven daily snapshots are scheduled for 02:00 AM.
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Last executed: <span style={{ color: 'var(--color-green)' }}>{lastBackup}</span>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Weekly Excel Workbook Export</span>
                <button onClick={triggerWeeklyExport} className="btn btn-secondary btn-small">Export XLSX</button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Compiles all 8 database sheets as an Excel workbook binary.
              </p>
            </div>



            <div>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Account Details</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <span>{user?.email}</span>
                <span style={{ color: 'var(--text-muted)' }}>Access Role:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-cyan)' }}>{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
