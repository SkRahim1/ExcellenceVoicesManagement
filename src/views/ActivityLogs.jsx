import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setLogs(mockDb.getLogs());
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Logs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Historical audit trails of all system modifications.
          </p>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>System Audit Trail</h3>
        
        <div className="table-container">
          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1.5rem 0' }}>No actions logged yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Operator</th>
                  <th>Action Category</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.log_id}>
                    <td data-label="Timestamp" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {log.date} {log.time}
                    </td>
                    <td data-label="Operator" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.user}</td>
                    <td data-label="Category">
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                        {log.action}
                      </span>
                    </td>
                    <td data-label="Details" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default ActivityLogs;
