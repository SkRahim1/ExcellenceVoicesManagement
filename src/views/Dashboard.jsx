import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, hasEditPermission } = useAuth();
  
  // States
  const [schools, setSchools] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [trainerPayments, setTrainerPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [logs, setLogs] = useState([]);

  const loadDashboardData = () => {
    setSchools(mockDb.getSchools());
    setPayments(mockDb.getPayments());
    setTrainers(mockDb.getTrainers());
    setTrainerPayments(mockDb.getTrainerPayments());
    setExpenses(mockDb.getExpenses());
    setContributions(mockDb.getContributions());
    setLogs(mockDb.getLogs());
  };

  // Fetch all data
  useEffect(() => {
    loadDashboardData();

    window.addEventListener('evm_db_updated', loadDashboardData);
    return () => window.removeEventListener('evm_db_updated', loadDashboardData);
  }, []);

  // Formatter for currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // --- Calculations (Strictly conforming to Section 15 of spec) ---
  const totalContractValue = schools.reduce((sum, s) => sum + Number(s.contract_amount || 0), 0);
  const revenueReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const outstandingRevenue = totalContractValue - revenueReceived;
  
  const totalTrainerPaid = trainerPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const businessExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const capitalContributions = contributions.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  
  const availableFunds = revenueReceived + capitalContributions;
  const currentCashPosition = revenueReceived + capitalContributions - totalTrainerPaid - businessExpenses;
  const netProfit = revenueReceived - totalTrainerPaid - businessExpenses;

  // --- Alert System: Schools with Outstanding Balances ---
  const schoolsWithBalances = schools
    .map(school => {
      const schoolPayments = payments
        .filter(p => p.school_id === school.school_id)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const balance = Number(school.contract_amount || 0) - schoolPayments;
      return { ...school, balance };
    })
    .filter(s => s.balance > 0 && s.status === 'Active');

  // --- WhatsApp Trigger (Manual pre-fill logic) ---
  const handleSendReminder = (school) => {
    const message = `Hello Principal/Coordinator of ${school.school_name},\n\nWe hope you are doing well. This is a friendly reminder regarding the outstanding balance of ${formatCurrency(school.balance)} for the Excellence Voices program.\n\nPlease find the details below:\n- Total Contract: ${formatCurrency(school.contract_amount)}\n- Total Received to Date: ${formatCurrency(school.contract_amount - school.balance)}\n- Remaining Balance: ${formatCurrency(school.balance)}\n\nThank you,\nExcellence Voices Management Team`;
    const encodedText = encodeURIComponent(message);
    const url = `https://wa.me/${school.mobile_number || ''}?text=${encodedText}`;
    
    // Log reminder sent
    mockDb.logAction('Reminder Sent', `Triggered WhatsApp reminder for ${school.school_name}`);
    setLogs(mockDb.getLogs()); // Refresh log stream
    
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            System overview and core financial indicators.
          </p>
        </div>
        <div className="user-badge">
          <div className="user-avatar">{(user?.name || user?.email || 'U')[0].toUpperCase()}</div>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name || user?.role}</span>
        </div>
      </div>

      {/* Metrics widgets */}
      <div className="metrics-grid">
        <div className="glass-panel">
          <div className="metric-header">Total Contract Value</div>
          <div className="metric-value" style={{ color: 'var(--color-cyan)' }}>
            {formatCurrency(totalContractValue)}
          </div>
          <div className="metric-footer">Across all active & inactive schools</div>
        </div>

        <div className="glass-panel">
          <div className="metric-header">Revenue Received</div>
          <div className="metric-value" style={{ color: 'var(--color-green)' }}>
            {formatCurrency(revenueReceived)}
          </div>
          <div className="metric-footer">Total payments logged</div>
        </div>

        <div className="glass-panel">
          <div className="metric-header">Outstanding Revenue</div>
          <div className="metric-value" style={{ color: 'var(--color-pink)' }}>
            {formatCurrency(outstandingRevenue)}
          </div>
          <div className="metric-footer">Unpaid contract balances</div>
        </div>

        <div className="glass-panel">
          <div className="metric-header">Capital Contributions</div>
          <div className="metric-value" style={{ color: 'var(--color-orange)' }}>
            {formatCurrency(capitalContributions)}
          </div>
          <div className="metric-footer">Funding injected by partners</div>
        </div>
      </div>

      {/* Business Summary Stats */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
        Business Summary
      </h3>
      <div className="metrics-grid">
        <div className="glass-panel">
          <div className="metric-header">Available Funds</div>
          <div className="metric-value">{formatCurrency(availableFunds)}</div>
          <div className="metric-footer">Revenue + Capital Contributions</div>
        </div>

        <div className="glass-panel">
          <div className="metric-header">Current Cash Position</div>
          <div className="metric-value">{formatCurrency(currentCashPosition)}</div>
          <div className="metric-footer">Available - Trainer Paid - Expenses</div>
        </div>

        <div className="glass-panel">
          <div className="metric-header">Net Profit</div>
          <div className="metric-value" style={{ color: netProfit >= 0 ? 'var(--color-green)' : 'var(--color-pink)' }}>
            {formatCurrency(netProfit)}
          </div>
          <div className="metric-footer">Revenue - Trainer Paid - Expenses</div>
        </div>
      </div>

      {/* Dashboard Details Split Grid */}
      <div className="dashboard-details-layout" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Left pane: Alerts table for Outstanding Balances */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-pink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Alerts: Schools with Outstanding Balances
          </h3>

          <div className="table-container">
            {schoolsWithBalances.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                All active schools have paid their balances.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Remaining Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolsWithBalances.map(school => (
                    <tr key={school.school_id}>
                      <td data-label="School Name" style={{ fontWeight: 600 }}>{school.school_name}</td>
                      <td data-label="Remaining Balance" style={{ color: 'var(--color-pink)', fontWeight: 600 }}>
                        {formatCurrency(school.balance)}
                      </td>
                      <td data-label="Action">
                        {hasEditPermission ? (
                          <button
                            onClick={() => handleSendReminder(school)}
                            className="btn btn-primary btn-small btn-danger"
                            style={{ gap: '0.25rem' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            Send Reminder
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Read-Only Mode</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Middle pane: P&L Donut Chart Breakdown */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-green)', width: '100%', textAlign: 'left' }}>
            Operational P&L Breakdown
          </h3>
          
          <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '1rem' }}>
            <svg viewBox="0 0 42 42" width="100%" height="100%">
              <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" />
              {revenueReceived === 0 ? (
                <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--text-muted)" strokeWidth="4.5" strokeDasharray="100 0" />
              ) : (
                <>
                  {/* Profit slice */}
                  {netProfit > 0 && (
                    <circle 
                      cx="21" cy="21" r="15.9155" fill="transparent" 
                      stroke="var(--color-green)" strokeWidth="4.5" 
                      strokeDasharray={`${(netProfit / revenueReceived) * 100} ${100 - ((netProfit / revenueReceived) * 100)}`} 
                      strokeDashoffset={25} 
                    />
                  )}
                  {/* Trainers slice */}
                  {totalTrainerPaid > 0 && (
                    <circle 
                      cx="21" cy="21" r="15.9155" fill="transparent" 
                      stroke="var(--color-violet)" strokeWidth="4.5" 
                      strokeDasharray={`${(totalTrainerPaid / revenueReceived) * 100} ${100 - ((totalTrainerPaid / revenueReceived) * 100)}`} 
                      strokeDashoffset={25 - (revenueReceived > 0 ? (Math.max(0, netProfit) / revenueReceived) * 100 : 0)} 
                    />
                  )}
                  {/* Expenses slice */}
                  {businessExpenses > 0 && (
                    <circle 
                      cx="21" cy="21" r="15.9155" fill="transparent" 
                      stroke="var(--color-pink)" strokeWidth="4.5" 
                      strokeDasharray={`${(businessExpenses / revenueReceived) * 100} ${100 - ((businessExpenses / revenueReceived) * 100)}`} 
                      strokeDashoffset={25 - (revenueReceived > 0 ? (Math.max(0, netProfit) / revenueReceived) * 100 : 0) - (revenueReceived > 0 ? (totalTrainerPaid / revenueReceived) * 100 : 0)} 
                    />
                  )}
                </>
              )}
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>MARGIN</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: netProfit >= 0 ? 'var(--color-green)' : 'var(--color-pink)' }}>
                {revenueReceived === 0 ? '0%' : `${Math.round(netProfit / revenueReceived * 100)}%`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', fontSize: '0.75rem', padding: '0 0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-green)' }}></span>
                <span>Net Operational Profit</span>
              </div>
              <span style={{ fontWeight: 600 }}>{revenueReceived === 0 ? '0%' : `${Math.round(Math.max(0, netProfit) / revenueReceived * 100)}%`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-violet)' }}></span>
                <span>Trainer Disbursements</span>
              </div>
              <span style={{ fontWeight: 600 }}>{revenueReceived === 0 ? '0%' : `${Math.round(totalTrainerPaid / revenueReceived * 100)}%`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-pink)' }}></span>
                <span>Operational Expenses</span>
              </div>
              <span style={{ fontWeight: 600 }}>{revenueReceived === 0 ? '0%' : `${Math.round(businessExpenses / revenueReceived * 100)}%`}</span>
            </div>
          </div>
        </div>

        {/* Right pane: Recent Actions list */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-cyan)' }}>
            Recent Activities
          </h3>

          <div className="activity-stream">
            {logs.slice(0, 10).map((log) => (
              <div className="activity-item" key={log.log_id}>
                <div>
                  <div className="activity-time">{log.time.slice(0, 5)} | {log.date}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                    {log.user} ({log.action})
                  </div>
                  <div className="activity-desc">{log.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
