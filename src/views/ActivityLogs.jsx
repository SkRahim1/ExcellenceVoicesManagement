import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);

  const loadData = () => {
    setLogs(mockDb.getLogs());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('evm_db_updated', loadData);
    return () => window.removeEventListener('evm_db_updated', loadData);
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

        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1.5rem 0' }}>No actions logged yet.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="desktop-only">
              <div className="table-container">
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
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {log.date} {log.time}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.user}</td>
                        <td>
                          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: activity stream cards */}
            <div className="mobile-only">
              <div className="activity-stream">
                {logs.map(log => (
                  <div className="activity-item" key={log.log_id}>
                    <div>
                      <div className="activity-time">{log.time.slice(0, 5)} · {log.date}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{log.user}</span>
                        <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                          {log.action}
                        </span>
                      </div>
                      <div className="activity-desc" style={{ marginTop: '0.25rem' }}>{log.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ActivityLogs;
