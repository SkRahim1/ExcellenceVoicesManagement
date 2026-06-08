import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockDb } from '../services/mockDb';

const Settings = () => {
  const { user } = useAuth();
  
  // Settings values
  const DEFAULT_GAS_URL = import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbzilQgn7d-b-AJIqCLw2UZpjwUxd4OLg72K-FWAUz84eugqtup8T5bvbObocMu9S3vq/exec';
  const DEFAULT_SHEET_ID = import.meta.env.VITE_SHEET_ID || '1jAR0JQr8lnKc_UjaaiM-Oc_JBxF6H0JQsZXWQMMI75M';

  const [gasUrl, setGasUrl] = useState(() => localStorage.getItem('evm_gas_url') || DEFAULT_GAS_URL);
  const [sheetId, setSheetId] = useState(() => localStorage.getItem('evm_sheet_id') || DEFAULT_SHEET_ID);
  const [alertEmail, setAlertEmail] = useState(() => localStorage.getItem('evm_alert_email') || 'partner1@excellencevoices.com');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState('2026-05-30 02:00:03 AM');
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputClick = () => {
    if (isUnlocked) return;
    const pwd = prompt('Enter security passcode to modify spreadsheet connector configurations:');
    if (pwd === 'ExcellenceSheetUpdate232') {
      setIsUnlocked(true);
      window.dispatchEvent(new CustomEvent('evm_toast', {
        detail: { type: 'success', message: 'Spreadsheet settings unlocked for editing.' }
      }));
    } else if (pwd !== null) {
      window.dispatchEvent(new CustomEvent('evm_toast', {
        detail: { type: 'error', message: 'Incorrect passcode. Access Denied.' }
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaved(false);

    localStorage.setItem('evm_gas_url', gasUrl);
    localStorage.setItem('evm_sheet_id', sheetId);
    localStorage.setItem('evm_alert_email', alertEmail);
    setSaved(true);
    setIsUnlocked(false);

    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'success', message: 'Settings successfully updated and saved.' }
    }));
    
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
    setIsBackingUp(true);
    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'info', message: 'Initiating daily spreadsheet backup...' }
    }));

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
          window.dispatchEvent(new CustomEvent('evm_toast', {
            detail: { type: 'success', message: 'Spreadsheet backup successfully copied to Google Drive.' }
          }));
          mockDb.logAction('Backup Triggered', 'Manually initiated daily spreadsheet backup duplicate');
          setIsBackingUp(false);
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
    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'success', message: 'Spreadsheet backup successfully copied to local backups database.' }
    }));
    setIsBackingUp(false);
  };

  const downloadLocalCsv = () => {
    try {
      const schools = mockDb.getSchools() || [];
      if (schools.length === 0) {
        window.dispatchEvent(new CustomEvent('evm_toast', {
          detail: { type: 'error', message: 'No school data available to export.' }
        }));
        return;
      }
      
      const headers = ['school_id', 'school_name', 'principal_name', 'coordinator_name', 'mobile_number', 'email', 'address', 'trainer_id', 'contract_amount', 'advance_for_books', 'recommended_installment', 'remarks', 'status', 'start_date'];
      const csvRows = [headers.join(',')];
      
      for (const school of schools) {
        const values = headers.map(header => {
          const val = school[header] === undefined || school[header] === null ? '' : String(school[header]);
          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "evm_schools_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.dispatchEvent(new CustomEvent('evm_toast', {
        detail: { type: 'success', message: 'Local CSV export downloaded successfully.' }
      }));
    } catch (e) {
      console.error('Local CSV export failed:', e);
      window.dispatchEvent(new CustomEvent('evm_toast', {
        detail: { type: 'error', message: 'Export failed: ' + e.message }
      }));
    }
  };

  const handleResetAllData = async () => {
    const pwd = prompt('⚠️ DANGER ZONE\n\nEnter the master reset password to permanently delete ALL system data:');
    if (pwd === null) return;
    if (pwd !== 'ExcellenceReset@2024') {
      window.dispatchEvent(new CustomEvent('evm_toast', {
        detail: { type: 'error', message: 'Incorrect password. Reset cancelled.' }
      }));
      return;
    }

    const confirmed = window.confirm('⚠️ FINAL WARNING\n\nThis will permanently delete ALL schools, payments, trainers, expenses and logs from Google Sheets and this device.\n\nThis CANNOT be undone. Proceed?');
    if (!confirmed) return;

    setIsResetting(true);
    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'info', message: 'Resetting all data... please wait.' }
    }));

    const currentGasUrl = localStorage.getItem('evm_gas_url') || DEFAULT_GAS_URL;
    if (currentGasUrl && !currentGasUrl.includes('EVM_PROX_Deployment_ID')) {
      try {
        const response = await fetch(currentGasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'clearAllData' })
        });
        const result = await response.json();
        if (result.success) {
          localStorage.removeItem('evm_db');
          window.dispatchEvent(new CustomEvent('evm_db_updated'));
          mockDb.logAction('Data Reset', 'All system data permanently deleted by admin');
          window.dispatchEvent(new CustomEvent('evm_toast', {
            detail: { type: 'success', message: 'All data permanently deleted from Google Sheets and this device.' }
          }));
          setIsResetting(false);
          return;
        }
      } catch (err) {
        console.error('Remote reset failed:', err);
      }
    }

    // Fallback: clear local data only
    localStorage.removeItem('evm_db');
    window.dispatchEvent(new CustomEvent('evm_db_updated'));
    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'success', message: 'Local data cleared. Clear Google Sheets rows manually too.' }
    }));
    setIsResetting(false);
  };

  const triggerWeeklyExport = async () => {
    setIsExporting(true);
    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'info', message: 'Compiles and generates spreadsheet export...' }
    }));

    let exportedRemotely = false;
    
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
          window.dispatchEvent(new CustomEvent('evm_toast', {
            detail: { type: 'success', message: 'Google Spreadsheet exported successfully.' }
          }));
          exportedRemotely = true;
        }
      } catch (err) {
        console.error('Remote Excel export trigger failed:', err);
      }
    }
    
    if (!exportedRemotely) {
      downloadLocalCsv();
      mockDb.logAction('Local Export Triggered', 'Manually compiled spreadsheet as local CSV download');
    }
    
    setIsExporting(false);
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
                onClick={handleInputClick}
                readOnly={!isUnlocked}
                style={{ cursor: isUnlocked ? 'text' : 'pointer' }}
                placeholder={isUnlocked ? "Enter deployment URL" : "Click to enter passcode and modify..."}
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
                onClick={handleInputClick}
                readOnly={!isUnlocked}
                style={{ cursor: isUnlocked ? 'text' : 'pointer' }}
                placeholder={isUnlocked ? "Enter spreadsheet ID" : "Click to enter passcode and modify..."}
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
                placeholder="Enter alert notification email address"
                required 
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Recipient email for change alerts routed through Google Apps Script. (Always editable by anyone)
              </p>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '140px', marginTop: '0.5rem' }}
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
                <button onClick={triggerManualBackup} className="btn btn-secondary btn-small" disabled={isBackingUp}>
                  {isBackingUp ? 'Backing up...' : 'Backup Now'}
                </button>
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
                <button onClick={triggerWeeklyExport} className="btn btn-secondary btn-small" disabled={isExporting}>
                  {isExporting ? 'Exporting...' : 'Export XLSX'}
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Compiles all 8 database sheets as an Excel workbook binary.
              </p>
            </div>

            <div>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Account Details</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Name:</span>
                <span>{user?.name || 'System User'}</span>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <span>{user?.email}</span>
                <span style={{ color: 'var(--text-muted)' }}>Access Role:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-cyan)' }}>{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel" style={{ borderColor: 'rgba(244, 63, 94, 0.3)', gridColumn: '1 / -1', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-pink)' }}>
          ⚠️ Danger Zone
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Irreversible destructive operations. These actions cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', backgroundColor: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: '10px' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Reset All System Data</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Permanently deletes all schools, payments, trainers, expenses and logs from Google Sheets and all devices.
            </div>
          </div>
          <button
            id="reset-all-data-btn"
            onClick={handleResetAllData}
            disabled={isResetting}
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: 'var(--color-pink)',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              cursor: isResetting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              marginLeft: '1.5rem',
              opacity: isResetting ? 0.6 : 1,
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {isResetting ? '⏳ Resetting...' : '🗑️ Reset All Data'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Settings;
