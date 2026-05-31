import React, { useState, useEffect, useRef } from 'react';
import { mockDb } from '../services/mockDb';

const NotificationBell = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [unread, setUnread] = useState(false);
  const dropdownRef = useRef(null);

  // Load logs and check for unread
  const loadNotifications = () => {
    try {
      const dbLogs = mockDb.getLogs() || [];
      // Take only the last 5 logs for the notification dropdown
      setLogs(dbLogs.slice(0, 5));

      const lastReadId = localStorage.getItem('evm_last_read_log_id');
      if (dbLogs.length > 0) {
        const latestId = dbLogs[0].log_id;
        if (!lastReadId || lastReadId !== latestId) {
          setUnread(true);
        } else {
          setUnread(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Listen for sync updates
    const handleNewLogs = () => {
      loadNotifications();
    };

    window.addEventListener('evm_new_logs', handleNewLogs);
    // Also listen to local actions (e.g. logAction pushes directly to cache)
    window.addEventListener('storage', handleNewLogs);

    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('evm_new_logs', handleNewLogs);
      window.removeEventListener('storage', handleNewLogs);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (!dropdownOpen && logs.length > 0) {
      // Mark as read
      const latestId = logs[0].log_id;
      localStorage.setItem('evm_last_read_log_id', latestId);
      setUnread(false);
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="notification-bell-btn" onClick={toggleDropdown} aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread && <span className="notification-badge" />}
      </button>

      {dropdownOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span>Recent Updates</span>
            {unread && <span style={{ color: 'var(--color-pink)', fontSize: '0.65rem' }}>New</span>}
          </div>
          <div className="notification-list">
            {logs.length === 0 ? (
              <div className="notification-empty">No updates recorded yet.</div>
            ) : (
              logs.map((log) => (
                <div key={log.log_id} className="notification-item">
                  <span className="notification-item-desc">{log.description}</span>
                  <span className="notification-item-time">{log.date} {log.time} by {log.user.split('@')[0]}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
