import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('schools');

  const [schools, setSchools] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [trainerPayments, setTrainerPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [contributions, setContributions] = useState([]);

  const loadData = () => {
    setSchools(mockDb.getSchools());
    setPayments(mockDb.getPayments());
    setTrainers(mockDb.getTrainers());
    setTrainerPayments(mockDb.getTrainerPayments());
    setExpenses(mockDb.getExpenses());
    setContributions(mockDb.getContributions());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('evm_db_updated', loadData);
    return () => window.removeEventListener('evm_db_updated', loadData);
  }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const getTrainerName = (trId) => {
    const trainer = trainers.find(t => t.trainer_id === trId);
    return trainer ? trainer.trainer_name : 'Unassigned';
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports Hub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Generate and review financial reports across business layers.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
        {[
          ['schools', 'School Report'],
          ['trainers', 'Trainer Report'],
          ['expenses', 'Expense Report'],
          ['contributions', 'Contribution Report'],
          ['summary', 'Business Summary (P&L)'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveReport(key)}
            className={`btn ${activeReport === key ? 'btn-primary' : 'btn-secondary'} btn-small`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ marginTop: '0.5rem' }}>

        {/* ── SCHOOL REPORT ────────────────────────────────────────────────── */}
        {activeReport === 'schools' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--color-cyan)' }}>School Billing Ledger</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Book Advance</th>
                    <th>Contract Value</th>
                    <th>Payments Received</th>
                    <th>Remaining Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(school => {
                    const schoolPaid = payments
                      .filter(p => p.school_id === school.school_id)
                      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    const balance = Number(school.contract_amount || 0) - schoolPaid;
                    return (
                      <tr key={school.school_id}>
                        <td style={{ fontWeight: 600 }}>{school.school_name}</td>
                        <td>{formatCurrency(school.advance_for_books)}</td>
                        <td>{formatCurrency(school.contract_amount)}</td>
                        <td style={{ color: 'var(--color-green)' }}>{formatCurrency(schoolPaid)}</td>
                        <td style={{ color: balance > 0 ? 'var(--color-pink)' : 'var(--color-green)', fontWeight: 600 }}>
                          {formatCurrency(balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TRAINER REPORT ───────────────────────────────────────────────── */}
        {activeReport === 'trainers' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--color-violet)' }}>Trainer Payouts Audit</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Trainer Name</th>
                    <th>Mobile</th>
                    <th>Assigned Schools</th>
                    <th>Cumulative Payouts</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers.map(trainer => {
                    const trainerPayouts = trainerPayments
                      .filter(p => p.trainer_id === trainer.trainer_id)
                      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    const assignedSchools = schools
                      .filter(s => s.trainer_id === trainer.trainer_id)
                      .map(s => s.school_name)
                      .join(', ') || 'None';
                    return (
                      <tr key={trainer.trainer_id}>
                        <td style={{ fontWeight: 600 }}>{trainer.trainer_name}</td>
                        <td>{trainer.mobile}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{assignedSchools}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-violet)' }}>{formatCurrency(trainerPayouts)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── EXPENSE REPORT ───────────────────────────────────────────────── */}
        {activeReport === 'expenses' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--color-pink)' }}>Expenses Breakdown</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Category</th><th>Total Spent</th></tr>
                </thead>
                <tbody>
                  {['Books', 'Printing', 'Travel', 'Marketing', 'Certificates', 'Stationery', 'Internet', 'Miscellaneous'].map(cat => {
                    const catSpent = expenses
                      .filter(e => e.category === cat)
                      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
                    return (
                      <tr key={cat}>
                        <td style={{ fontWeight: 600 }}>{cat}</td>
                        <td style={{ fontWeight: 600, color: catSpent > 0 ? 'var(--color-pink)' : 'var(--text-muted)' }}>
                          {formatCurrency(catSpent)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CONTRIBUTION REPORT ──────────────────────────────────────────── */}
        {activeReport === 'contributions' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--color-orange)' }}>Capital Contributions Log</h3>
            <div className="table-container">
              {contributions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1.5rem 0' }}>No partner contributions logged yet.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Partner</th>
                      <th>Injected Funds</th>
                      <th>Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const partnerGroups = contributions.reduce((acc, c) => {
                        const name = c.partner_name || 'Unknown';
                        if (!acc[name]) acc[name] = { total: 0, count: 0 };
                        acc[name].total += Number(c.amount || 0);
                        acc[name].count += 1;
                        return acc;
                      }, {});
                      const grandTotal = contributions.reduce((sum, c) => sum + Number(c.amount || 0), 0);
                      return (
                        <>
                          {Object.entries(partnerGroups).map(([partner, data]) => (
                            <tr key={partner}>
                              <td style={{ fontWeight: 600 }}>{partner}</td>
                              <td style={{ fontWeight: 600, color: 'var(--color-orange)' }}>{formatCurrency(data.total)}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{data.count} txn{data.count !== 1 ? 's' : ''}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: '2px solid var(--card-border)' }}>
                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Raised</td>
                            <td style={{ fontWeight: 700, color: 'var(--color-orange)' }}>{formatCurrency(grandTotal)}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{contributions.length} total</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── BUSINESS SUMMARY (P&L) ───────────────────────────────────────── */}
        {activeReport === 'summary' && (() => {
          const rev      = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
          const advBooks = schools.reduce((sum, s) => sum + Number(s.advance_for_books || 0), 0);
          const totalRev = rev + advBooks;
          const trPaid   = trainerPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
          const exp      = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
          const prof     = totalRev - trPaid - exp;
          const hasRev   = totalRev > 0;

          const profitPct  = hasRev ? Math.max(0, prof / totalRev) * 100 : 0;
          const trainerPct = hasRev ? (trPaid / totalRev) * 100 : 0;
          const expensePct = hasRev ? (exp / totalRev) * 100 : 0;

          const offsetProfit   = 25;
          const offsetTrainer  = 25 - profitPct;
          const offsetExpenses = 25 - profitPct - trainerPct;

          return (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Operational P&L Statement</h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'center', justifyContent: 'center', padding: '1rem 0' }}>

                {/* Financial values */}
                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '450px' }}>
                  {[
                    { label: 'School Payments (+)', value: rev, color: 'var(--color-green)', dot: 'var(--color-green)' },
                    { label: 'Advance for Books (+)', value: advBooks, color: 'var(--color-cyan)', dot: 'var(--color-cyan)' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.dot, flexShrink: 0 }}></span>
                        {row.label}
                      </span>
                      <span style={{ fontWeight: 600, color: row.color }}>{formatCurrency(row.value)}</span>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dashed rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Total Revenue</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-green)' }}>{formatCurrency(totalRev)}</span>
                  </div>

                  {[
                    { label: 'Trainer Disbursements (-)', value: trPaid, color: 'var(--color-violet)', dot: 'var(--color-violet)' },
                    { label: 'Business Expenses (-)', value: exp, color: 'var(--color-pink)', dot: 'var(--color-pink)' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.dot, flexShrink: 0 }}></span>
                        {row.label}
                      </span>
                      <span style={{ fontWeight: 600, color: row.color }}>{formatCurrency(row.value)}</span>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--card-border)', paddingTop: '0.75rem', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700 }}>Net Operational Profit</span>
                    <span style={{ fontWeight: 700, color: prof >= 0 ? 'var(--color-green)' : 'var(--color-pink)' }}>
                      {formatCurrency(prof)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>* Partner Contributions (separate):</span>
                    <span>{formatCurrency(contributions.reduce((sum, c) => sum + Number(c.amount || 0), 0))}</span>
                  </div>
                </div>

                {/* Donut chart */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                    <svg viewBox="0 0 42 42" width="100%" height="100%">
                      <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" />
                      {!hasRev ? (
                        <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--text-muted)" strokeWidth="4.5" strokeDasharray="100 0" />
                      ) : (
                        <>
                          {profitPct > 0 && (
                            <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--color-green)" strokeWidth="4.5"
                              strokeDasharray={`${profitPct} ${100 - profitPct}`} strokeDashoffset={offsetProfit} />
                          )}
                          {trainerPct > 0 && (
                            <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--color-violet)" strokeWidth="4.5"
                              strokeDasharray={`${trainerPct} ${100 - trainerPct}`} strokeDashoffset={offsetTrainer} />
                          )}
                          {expensePct > 0 && (
                            <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--color-pink)" strokeWidth="4.5"
                              strokeDasharray={`${expensePct} ${100 - expensePct}`} strokeDashoffset={offsetExpenses} />
                          )}
                        </>
                      )}
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Profit Pct</span>
                      <span style={{ fontSize: '1.6rem', fontWeight: 700, color: prof >= 0 ? 'var(--color-green)' : 'var(--color-pink)' }}>
                        {!hasRev ? '0%' : `${Math.round(prof / totalRev * 100)}%`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      ['var(--color-green)',  `Profit (${!hasRev ? '0%' : `${Math.round(profitPct)}%`})`],
                      ['var(--color-violet)', `Trainers (${!hasRev ? '0%' : `${Math.round(trainerPct)}%`})`],
                      ['var(--color-pink)',   `Expenses (${!hasRev ? '0%' : `${Math.round(expensePct)}%`})`],
                    ].map(([color, label]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: color }}></span>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </>
  );
};

export default Reports;
