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

  // Active detail panel (which metric card is expanded)
  const [activeDetail, setActiveDetail] = useState(null);

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

  const getTrainerName = (trId) => {
    const trainer = trainers.find(t => t.trainer_id === trId);
    return trainer ? trainer.trainer_name : 'Unassigned';
  };

  // --- Calculations ---
  const totalContractValue = schools.reduce((sum, s) => sum + Number(s.contract_amount || 0), 0);
  const revenueReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalAdvanceForBooks = schools.reduce((sum, s) => sum + Number(s.advance_for_books || 0), 0);
  const outstandingRevenue = totalContractValue - revenueReceived;

  const totalTrainerPaid = trainerPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const businessExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const capitalContributions = contributions.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const totalRevenue = revenueReceived + totalAdvanceForBooks;
  const availableFunds = totalRevenue + capitalContributions;
  const currentCashPosition = totalRevenue + capitalContributions - totalTrainerPaid - businessExpenses;
  const netProfit = totalRevenue - totalTrainerPaid - businessExpenses;

  // Per-school aggregations (used by detail panels)
  const schoolsWithStats = schools.map(school => {
    const schoolPaid = payments
      .filter(p => p.school_id === school.school_id)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balance = Number(school.contract_amount || 0) - schoolPaid;
    return { ...school, schoolPaid, balance };
  });

  // --- Alert System ---
  const schoolsWithBalances = schoolsWithStats.filter(s => s.balance > 0 && s.status === 'Active');

  // --- WhatsApp Trigger ---
  const handleSendReminder = (school) => {
    const message = `Hello Principal/Coordinator of ${school.school_name},\n\nThis is a friendly reminder regarding the outstanding balance of ${formatCurrency(school.balance)} for the Excellence Voices program.\n\nDetails:\n- Total Contract: ${formatCurrency(school.contract_amount)}\n- Total Received: ${formatCurrency(school.contract_amount - school.balance)}\n- Remaining Balance: ${formatCurrency(school.balance)}\n\nThank you,\nExcellence Voices Management Team`;
    const url = `https://wa.me/${school.mobile_number || ''}?text=${encodeURIComponent(message)}`;
    mockDb.logAction('Reminder Sent', `Triggered WhatsApp reminder for ${school.school_name}`);
    setLogs(mockDb.getLogs());
    window.open(url, '_blank');
  };

  // Toggle detail panel — clicking same card again closes it
  const handleCardClick = (key) => {
    setActiveDetail(prev => prev === key ? null : key);
  };

  // Shared style for clickable metric cards
  const clickableCard = (key, accentColor) => ({
    cursor: 'pointer',
    outline: activeDetail === key ? `2px solid ${accentColor}` : '2px solid transparent',
    outlineOffset: '2px',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  });

  // ── Modal detail renderer ─────────────────────────────────────────────────
  const renderDetailPanel = () => {
    if (!activeDetail) return null;

    const closeBtn = (
      <button
        onClick={() => setActiveDetail(null)}
        className="btn btn-secondary btn-small"
        style={{ marginLeft: 'auto', flexShrink: 0 }}
      >
        ✕ Close
      </button>
    );

    const modalContent = getModalContent(closeBtn);

    return (
      /* Backdrop — click outside to close */
      <div
        onClick={() => setActiveDetail(null)}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'backdropFadeIn 0.18s ease',
        }}
      >
        {/* Modal box — stop propagation so clicking inside doesn't close */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--card-bg, #0f172a)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '740px',
            maxHeight: '82vh',
            overflowY: 'auto',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            animation: 'modalSlideIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {modalContent}
        </div>
      </div>
    );
  };

  const getModalContent = (closeBtn) => {
    const hdr = (title, color) => (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', gap: '0.75rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.85rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color }}>{title}</h3>
        {closeBtn}
      </div>
    );

    // Helper to render a school table
    const schoolTable = (cols, rows) => (
      <div className="table-container">
        {rows.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No data available.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>{cols.map(c => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        )}
      </div>
    );

    if (activeDetail === 'contract') {
      const sorted = [...schoolsWithStats].sort((a, b) => b.contract_amount - a.contract_amount);
      return (
        <div>
          {hdr('Contract Values — All Schools', 'var(--color-cyan)')}
          {schoolTable(
            ['School Name', 'Assigned Trainer', 'Contract Value', 'Status'],
            sorted.map(s => (
              <tr key={s.school_id}>
                <td style={{ fontWeight: 600, color: 'var(--color-cyan)' }}>{s.school_name}</td>
                <td>{getTrainerName(s.trainer_id)}</td>
                <td style={{ fontWeight: 700 }}>{formatCurrency(s.contract_amount)}</td>
                <td><span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span></td>
              </tr>
            ))
          )}
          <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--card-border)', paddingTop: '0.6rem' }}>
            Total: <strong style={{ color: 'var(--color-cyan)' }}>{formatCurrency(totalContractValue)}</strong> across {schools.length} schools
          </div>
        </div>
      );
    }

    if (activeDetail === 'revenue') {
      const sorted = [...schoolsWithStats].sort((a, b) => {
        const totalA = a.schoolPaid + Number(a.advance_for_books || 0);
        const totalB = b.schoolPaid + Number(b.advance_for_books || 0);
        return totalB - totalA;
      });
      return (
        <div>
          {hdr('Revenue Received — School-wise Breakdown', 'var(--color-green)')}
          {schoolTable(
            ['School Name', 'Payments Received', 'Book Advance', 'Total Received'],
            sorted.map(s => {
              const bookAdv = Number(s.advance_for_books || 0);
              const totalSchRev = s.schoolPaid + bookAdv;
              return (
                <tr key={s.school_id}>
                  <td style={{ fontWeight: 600 }}>{s.school_name}</td>
                  <td>{formatCurrency(s.schoolPaid)}</td>
                  <td style={{ color: 'var(--color-violet)' }}>{formatCurrency(bookAdv)}</td>
                  <td style={{ color: 'var(--color-green)', fontWeight: 700 }}>{formatCurrency(totalSchRev)}</td>
                </tr>
              );
            })
          )}
          <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--card-border)', paddingTop: '0.6rem' }}>
            Total Received: <strong style={{ color: 'var(--color-green)' }}>{formatCurrency(revenueReceived + totalAdvanceForBooks)}</strong>
          </div>
        </div>
      );
    }

    if (activeDetail === 'advance') {
      const sorted = [...schoolsWithStats]
        .filter(s => Number(s.advance_for_books || 0) > 0)
        .sort((a, b) => b.advance_for_books - a.advance_for_books);
      const noAdv = schoolsWithStats.filter(s => !Number(s.advance_for_books));
      return (
        <div>
          {hdr('Advance for Books — School-wise', 'var(--color-violet)')}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            This amount is <strong>separate</strong> from the contract fee and counted independently in P&amp;L revenue.
          </p>
          {schoolTable(
            ['School Name', 'Trainer', 'Advance for Books', 'Contract Value'],
            [
              ...sorted.map(s => (
                <tr key={s.school_id}>
                  <td style={{ fontWeight: 600 }}>{s.school_name}</td>
                  <td>{getTrainerName(s.trainer_id)}</td>
                  <td style={{ color: 'var(--color-violet)', fontWeight: 700 }}>{formatCurrency(s.advance_for_books)}</td>
                  <td>{formatCurrency(s.contract_amount)}</td>
                </tr>
              )),
              ...noAdv.map(s => (
                <tr key={s.school_id} style={{ opacity: 0.45 }}>
                  <td style={{ fontWeight: 600 }}>{s.school_name}</td>
                  <td>{getTrainerName(s.trainer_id)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>—</td>
                  <td>{formatCurrency(s.contract_amount)}</td>
                </tr>
              ))
            ]
          )}
          <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--card-border)', paddingTop: '0.6rem' }}>
            Total Advance: <strong style={{ color: 'var(--color-violet)' }}>{formatCurrency(totalAdvanceForBooks)}</strong>
          </div>
        </div>
      );
    }

    if (activeDetail === 'outstanding') {
      const sorted = [...schoolsWithStats]
        .filter(s => s.status === 'Active')
        .sort((a, b) => b.balance - a.balance);
      return (
        <div>
          {hdr('Outstanding Revenue — Active Schools', 'var(--color-pink)')}
          {schoolTable(
            ['School Name', 'Contract Value', 'Paid to Date', 'Balance Due'],
            sorted.map(s => (
              <tr key={s.school_id}>
                <td style={{ fontWeight: 600 }}>{s.school_name}</td>
                <td>{formatCurrency(s.contract_amount)}</td>
                <td style={{ color: 'var(--color-green)' }}>{formatCurrency(s.schoolPaid)}</td>
                <td style={{ color: s.balance > 0 ? 'var(--color-pink)' : 'var(--color-green)', fontWeight: 700 }}>
                  {formatCurrency(Math.max(0, s.balance))}
                </td>
              </tr>
            ))
          )}
          <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--card-border)', paddingTop: '0.6rem' }}>
            Total Outstanding: <strong style={{ color: 'var(--color-pink)' }}>{formatCurrency(outstandingRevenue)}</strong>
          </div>
        </div>
      );
    }

    if (activeDetail === 'capital') {
      const partnerGroups = contributions.reduce((acc, c) => {
        const name = c.partner_name || 'Unknown';
        if (!acc[name]) acc[name] = { total: 0, count: 0, entries: [] };
        acc[name].total += Number(c.amount || 0);
        acc[name].count += 1;
        acc[name].entries.push(c);
        return acc;
      }, {});
      return (
        <div>
          {hdr('Capital Contributions — Partner Breakdown', 'var(--color-orange)')}
          <div className="table-container">
            {contributions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No contributions logged yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Partner</th>
                    <th>Total Injected</th>
                    <th>Transactions</th>
                    <th>Last Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(partnerGroups).map(([partner, data]) => {
                    const sorted = [...data.entries].sort((a, b) => new Date(b.date) - new Date(a.date));
                    return (
                      <tr key={partner}>
                        <td style={{ fontWeight: 700 }}>{partner}</td>
                        <td style={{ color: 'var(--color-orange)', fontWeight: 700 }}>{formatCurrency(data.total)}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{data.count} txn{data.count !== 1 ? 's' : ''}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{sorted[0]?.date || '—'}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: '2px solid var(--card-border)' }}>
                    <td style={{ fontWeight: 700 }}>Grand Total</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-orange)' }}>{formatCurrency(capitalContributions)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{contributions.length} total</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      );
    }

    if (activeDetail === 'available') {
      return (
        <div>
          {hdr('Available Funds — Composition', 'var(--text-primary)')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '460px' }}>
            {[
              { label: 'School Payments Received', value: revenueReceived, color: 'var(--color-green)' },
              { label: 'Advance for Books (separate from contract)', value: totalAdvanceForBooks, color: 'var(--color-violet)' },
              { label: 'Capital Contributions from Partners', value: capitalContributions, color: 'var(--color-orange)' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: row.color }}>{formatCurrency(row.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '2px solid var(--card-border)', fontSize: '1.05rem' }}>
              <span style={{ fontWeight: 700 }}>= Available Funds</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(availableFunds)}</span>
            </div>
          </div>
        </div>
      );
    }

    if (activeDetail === 'cashposition') {
      return (
        <div>
          {hdr('Current Cash Position — Breakdown', 'var(--text-primary)')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '460px' }}>
            {[
              { label: 'Total Revenue (Payments + Advance for Books)', value: totalRevenue, color: 'var(--color-green)', sign: '+' },
              { label: 'Capital Contributions from Partners', value: capitalContributions, color: 'var(--color-orange)', sign: '+' },
              { label: 'Trainer Disbursements (paid out)', value: totalTrainerPaid, color: 'var(--color-violet)', sign: '−' },
              { label: 'Business Expenses (all categories)', value: businessExpenses, color: 'var(--color-pink)', sign: '−' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span style={{ color: row.color, fontWeight: 700, marginRight: '0.4rem' }}>{row.sign}</span>
                  {row.label}
                </span>
                <span style={{ fontWeight: 700, color: row.color }}>{formatCurrency(row.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '2px solid var(--card-border)', fontSize: '1.05rem' }}>
              <span style={{ fontWeight: 700 }}>= Current Cash Position</span>
              <span style={{ fontWeight: 700, color: currentCashPosition >= 0 ? 'var(--color-green)' : 'var(--color-pink)' }}>{formatCurrency(currentCashPosition)}</span>
            </div>
          </div>
        </div>
      );
    }

    if (activeDetail === 'netprofit') {
      return (
        <div>
          {hdr('Net Profit — P&L Summary', netProfit >= 0 ? 'var(--color-green)' : 'var(--color-pink)')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '460px' }}>
            {[
              { label: 'School Payments Received', value: revenueReceived, color: 'var(--color-green)', sign: '+' },
              { label: 'Advance for Books (separate from contract)', value: totalAdvanceForBooks, color: 'var(--color-cyan)', sign: '+' },
              { label: 'Trainer Disbursements', value: totalTrainerPaid, color: 'var(--color-violet)', sign: '−' },
              { label: 'Business Expenses', value: businessExpenses, color: 'var(--color-pink)', sign: '−' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span style={{ color: row.color, fontWeight: 700, marginRight: '0.4rem' }}>{row.sign}</span>
                  {row.label}
                </span>
                <span style={{ fontWeight: 700, color: row.color }}>{formatCurrency(row.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '2px solid var(--card-border)', fontSize: '1.05rem' }}>
              <span style={{ fontWeight: 700 }}>= Net Operational Profit</span>
              <span style={{ fontWeight: 700, color: netProfit >= 0 ? 'var(--color-green)' : 'var(--color-pink)' }}>{formatCurrency(netProfit)}</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '0.25rem' }}>
              * Capital contributions ({formatCurrency(capitalContributions)}) are tracked separately and excluded from Net Profit.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Modal overlay — rendered first so it covers all page content */}
      {renderDetailPanel()}

      {/* Animations */}
      <style>{`
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.93) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .metric-card-clickable:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 16px 48px 0 rgba(0,0,0,0.35) !important;
        }
        .metric-card-clickable .tap-hint {
          opacity: 0;
          transition: opacity 0.2s ease;
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: right;
          margin-top: 0.35rem;
          letter-spacing: 0.3px;
        }
        .metric-card-clickable:hover .tap-hint {
          opacity: 1;
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            System overview and core financial indicators. <span style={{ color: 'var(--text-muted)' }}>Click any card for details.</span>
          </p>
        </div>
        <div className="user-badge">
          <div className="user-avatar">{(user?.name || user?.email || 'U')[0].toUpperCase()}</div>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name || user?.role}</span>
        </div>
      </div>

      {/* ── Row 1: Revenue Metrics ───────────────────────────────────────── */}
      <div className="metrics-grid">
        {/* Total Contract Value */}
        <div
          className="glass-panel metric-card-clickable"
          style={clickableCard('contract', 'var(--color-cyan)')}
          onClick={() => handleCardClick('contract')}
        >
          <div className="metric-header">Total Contract Value</div>
          <div className="metric-value" style={{ color: 'var(--color-cyan)' }}>
            {formatCurrency(totalContractValue)}
          </div>
          <div className="metric-footer">School fees only — advance for books excluded</div>
          <div className="tap-hint">tap to expand ↓</div>
        </div>

        {/* Revenue Received */}
        <div
          className="glass-panel metric-card-clickable"
          style={clickableCard('revenue', 'var(--color-green)')}
          onClick={() => handleCardClick('revenue')}
        >
          <div className="metric-header">Revenue Received</div>
          <div className="metric-value" style={{ color: 'var(--color-green)' }}>
            {formatCurrency(revenueReceived + totalAdvanceForBooks)}
          </div>
          <div className="metric-footer">Payments + Book Advances</div>
          <div className="tap-hint">tap to expand ↓</div>
        </div>

        {/* Advance for Books */}
        <div
          className="glass-panel metric-card-clickable"
          style={clickableCard('advance', 'var(--color-violet)')}
          onClick={() => handleCardClick('advance')}
        >
          <div className="metric-header">Advance for Books</div>
          <div className="metric-value" style={{ color: 'var(--color-violet)' }}>
            {formatCurrency(totalAdvanceForBooks)}
          </div>
          <div className="metric-footer">Separate from contract value · counted in revenue</div>
          <div className="tap-hint">tap to expand ↓</div>
        </div>

        {/* Outstanding Revenue */}
        <div
          className="glass-panel metric-card-clickable"
          style={clickableCard('outstanding', 'var(--color-pink)')}
          onClick={() => handleCardClick('outstanding')}
        >
          <div className="metric-header">Outstanding Revenue</div>
          <div className="metric-value" style={{ color: 'var(--color-pink)' }}>
            {formatCurrency(outstandingRevenue)}
          </div>
          <div className="metric-footer">Unpaid contract balances</div>
          <div className="tap-hint">tap to expand ↓</div>
        </div>

        {/* Capital Contributions */}
        <div
          className="glass-panel metric-card-clickable"
          style={clickableCard('capital', 'var(--color-orange)')}
          onClick={() => handleCardClick('capital')}
        >
          <div className="metric-header">Capital Contributions</div>
          <div className="metric-value" style={{ color: 'var(--color-orange)' }}>
            {formatCurrency(capitalContributions)}
          </div>
          <div className="metric-footer">Funding injected by partners</div>
          <div className="tap-hint">tap to expand ↓</div>
        </div>
      </div>

      {/* ── Row 2: Business Summary ──────────────────────────────────────── */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
        Business Summary
      </h3>
      <div className="metrics-grid">
        <div
          className="glass-panel metric-card-clickable"
          style={clickableCard('available', 'var(--color-cyan)')}
          onClick={() => handleCardClick('available')}
        >
          <div className="metric-header">Available Funds</div>
          <div className="metric-value">{formatCurrency(availableFunds)}</div>
          <div className="metric-footer">Revenue + Capital Contributions</div>
          <div className="tap-hint">tap to expand ↓</div>
        </div>

        <div
          className="glass-panel metric-card-clickable"
          style={clickableCard('cashposition', 'var(--color-cyan)')}
          onClick={() => handleCardClick('cashposition')}
        >
          <div className="metric-header">Current Cash Position</div>
          <div className="metric-value">{formatCurrency(currentCashPosition)}</div>
          <div className="metric-footer">Available - Trainer Paid - Expenses</div>
          <div className="tap-hint">tap to expand ↓</div>
        </div>

        <div
          className="glass-panel metric-card-clickable"
          style={clickableCard('netprofit', netProfit >= 0 ? 'var(--color-green)' : 'var(--color-pink)')}
          onClick={() => handleCardClick('netprofit')}
        >
          <div className="metric-header">Net Profit</div>
          <div className="metric-value" style={{ color: netProfit >= 0 ? 'var(--color-green)' : 'var(--color-pink)' }}>
            {formatCurrency(netProfit)}
          </div>
          <div className="metric-footer">Revenue - Trainer Paid - Expenses</div>
          <div className="tap-hint">tap to expand ↓</div>
        </div>
      </div>


      {/* ── Bottom: Alerts + Chart + Activity ───────────────────────────── */}
      <div className="dashboard-details-layout" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Alerts: Outstanding Balances */}
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

        {/* P&L Donut Chart */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-green)', width: '100%', textAlign: 'left' }}>
            Operational P&L Breakdown
          </h3>
          
          <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '1rem' }}>
            <svg viewBox="0 0 42 42" width="100%" height="100%">
              <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" />
              {totalRevenue === 0 ? (
                <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--text-muted)" strokeWidth="4.5" strokeDasharray="100 0" />
              ) : (
                <>
                  {netProfit > 0 && (
                    <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--color-green)" strokeWidth="4.5"
                      strokeDasharray={`${(netProfit / totalRevenue) * 100} ${100 - ((netProfit / totalRevenue) * 100)}`}
                      strokeDashoffset={25} />
                  )}
                  {totalTrainerPaid > 0 && (
                    <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--color-violet)" strokeWidth="4.5"
                      strokeDasharray={`${(totalTrainerPaid / totalRevenue) * 100} ${100 - ((totalTrainerPaid / totalRevenue) * 100)}`}
                      strokeDashoffset={25 - (totalRevenue > 0 ? (Math.max(0, netProfit) / totalRevenue) * 100 : 0)} />
                  )}
                  {businessExpenses > 0 && (
                    <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--color-pink)" strokeWidth="4.5"
                      strokeDasharray={`${(businessExpenses / totalRevenue) * 100} ${100 - ((businessExpenses / totalRevenue) * 100)}`}
                      strokeDashoffset={25 - (totalRevenue > 0 ? (Math.max(0, netProfit) / totalRevenue) * 100 : 0) - (totalRevenue > 0 ? (totalTrainerPaid / totalRevenue) * 100 : 0)} />
                  )}
                </>
              )}
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>MARGIN</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: netProfit >= 0 ? 'var(--color-green)' : 'var(--color-pink)' }}>
                {totalRevenue === 0 ? '0%' : `${Math.round(netProfit / totalRevenue * 100)}%`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', fontSize: '0.75rem', padding: '0 0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-green)' }}></span>
                <span>Net Operational Profit</span>
              </div>
              <span style={{ fontWeight: 600 }}>{totalRevenue === 0 ? '0%' : `${Math.round(Math.max(0, netProfit) / totalRevenue * 100)}%`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-violet)' }}></span>
                <span>Trainer Disbursements</span>
              </div>
              <span style={{ fontWeight: 600 }}>{totalRevenue === 0 ? '0%' : `${Math.round(totalTrainerPaid / totalRevenue * 100)}%`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-pink)' }}></span>
                <span>Operational Expenses</span>
              </div>
              <span style={{ fontWeight: 600 }}>{totalRevenue === 0 ? '0%' : `${Math.round(businessExpenses / totalRevenue * 100)}%`}</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
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
