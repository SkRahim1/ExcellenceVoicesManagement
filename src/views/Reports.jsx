import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('schools');
  
  // Data lists
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
        <button onClick={() => setActiveReport('schools')} className={`btn ${activeReport === 'schools' ? 'btn-primary' : 'btn-secondary'} btn-small`}>
          School Report
        </button>
        <button onClick={() => setActiveReport('trainers')} className={`btn ${activeReport === 'trainers' ? 'btn-primary' : 'btn-secondary'} btn-small`}>
          Trainer Report
        </button>
        <button onClick={() => setActiveReport('expenses')} className={`btn ${activeReport === 'expenses' ? 'btn-primary' : 'btn-secondary'} btn-small`}>
          Expense Report
        </button>
        <button onClick={() => setActiveReport('contributions')} className={`btn ${activeReport === 'contributions' ? 'btn-primary' : 'btn-secondary'} btn-small`}>
          Contribution Report
        </button>
        <button onClick={() => setActiveReport('summary')} className={`btn ${activeReport === 'summary' ? 'btn-primary' : 'btn-secondary'} btn-small`}>
          Business Summary (P&L)
        </button>
      </div>

      <div className="glass-panel" style={{ marginTop: '0.5rem' }}>
        {/* SCHOOL REPORT */}
        {activeReport === 'schools' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--color-cyan)' }}>School Billing Ledger</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Assigned Trainer</th>
                    <th>Contract Value</th>
                    <th>Payments Received</th>
                    <th>Remaining Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(school => {
                    const schoolPayments = payments
                      .filter(p => p.school_id === school.school_id)
                      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    const balance = Number(school.contract_amount || 0) - schoolPayments;
                    return (
                      <tr key={school.school_id}>
                        <td style={{ fontWeight: 600 }}>{school.school_name}</td>
                        <td>{getTrainerName(school.trainer_id)}</td>
                        <td>{formatCurrency(school.contract_amount)}</td>
                        <td style={{ color: 'var(--color-green)' }}>{formatCurrency(schoolPayments)}</td>
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

        {/* TRAINER REPORT */}
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
                    const assignedSchools = schools.filter(s => s.trainer_id === trainer.trainer_id).map(s => s.school_name).join(', ') || 'None';
                    return (
                      <tr key={trainer.trainer_id}>
                        <td style={{ fontWeight: 600 }}>{trainer.trainer_name}</td>
                        <td>{trainer.mobile}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{assignedSchools}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(trainerPayouts)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EXPENSE REPORT */}
        {activeReport === 'expenses' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--color-pink)' }}>Expenses Breakdown</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Books', 'Printing', 'Travel', 'Marketing', 'Certificates', 'Stationery', 'Internet', 'Miscellaneous'
                  ].map(cat => {
                    const catSpent = expenses
                      .filter(e => e.category === cat)
                      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
                    return (
                      <tr key={cat}>
                        <td style={{ fontWeight: 600 }}>{cat}</td>
                        <td style={{ fontWeight: 600, color: catSpent > 0 ? 'var(--color-pink)' : '' }}>
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

        {/* CONTRIBUTION REPORT */}
        {activeReport === 'contributions' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--color-orange)' }}>Capital Contributions Log</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Partner</th>
                    <th>Injected Funds</th>
                  </tr>
                </thead>
                <tbody>
                  {['Partner 1', 'Partner 2', 'Partner 3'].map(partner => {
                    const injected = contributions
                      .filter(c => c.partner_name === partner)
                      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
                    return (
                      <tr key={partner}>
                        <td style={{ fontWeight: 600 }}>{partner}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-orange)' }}>{formatCurrency(injected)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BUSINESS SUMMARY (P&L) */}
        {activeReport === 'summary' && (() => {
          const rev = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
          const trPaid = trainerPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
          const exp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
          const prof = rev - trPaid - exp;

          const hasRev = rev > 0;
          
          // Segment percentages
          const profitPct = hasRev ? Math.max(0, prof / rev) * 100 : 0;
          const trainerPct = hasRev ? (trPaid / rev) * 100 : 0;
          const expensePct = hasRev ? (exp / rev) * 100 : 0;

          // Donut offsets (starts 12 o'clock, radius=15.9155, circumference=100)
          const offsetProfit = 25;
          const offsetTrainer = 25 - profitPct;
          const offsetExpenses = 25 - profitPct - trainerPct;

          return (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Operational P&L Statement</h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'center', justifyContent: 'center', padding: '1rem 0' }}>
                
                {/* Left side: Financial values */}
                <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '450px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-green)' }}></span>
                      Revenue Received (+)
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-green)' }}>{formatCurrency(rev)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-violet)' }}></span>
                      Trainer Disbursements (-)
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-violet)' }}>{formatCurrency(trPaid)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-pink)' }}></span>
                      Business Expenses (-)
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-pink)' }}>{formatCurrency(exp)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--card-border)', paddingTop: '0.75rem', fontSize: '1.2rem', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 700 }}>Net Operational Profit</span>
                    <span style={{ 
                      fontWeight: 700, 
                      color: prof >= 0 ? 'var(--color-green)' : 'var(--color-pink)'
                    }}>
                      {formatCurrency(prof)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>* Partner Contributions (separate):</span>
                    <span>{formatCurrency(contributions.reduce((sum, c) => sum + Number(c.amount || 0), 0))}</span>
                  </div>
                </div>

                {/* Right side: SVG Donut Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                    <svg viewBox="0 0 42 42" width="100%" height="100%">
                      {/* Base background ring */}
                      <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" />
                      
                      {!hasRev ? (
                        /* Empty state placeholder */
                        <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--text-muted)" strokeWidth="4.5" strokeDasharray="100 0" />
                      ) : (
                        <>
                          {/* Segment 1: Net Profit (Green) */}
                          {profitPct > 0 && (
                            <circle 
                              cx="21" cy="21" r="15.9155" fill="transparent" 
                              stroke="var(--color-green)" strokeWidth="4.5" 
                              strokeDasharray={`${profitPct} ${100 - profitPct}`} 
                              strokeDashoffset={offsetProfit} 
                            />
                          )}

                          {/* Segment 2: Trainer Payouts (Purple) */}
                          {trainerPct > 0 && (
                            <circle 
                              cx="21" cy="21" r="15.9155" fill="transparent" 
                              stroke="var(--color-violet)" strokeWidth="4.5" 
                              strokeDasharray={`${trainerPct} ${100 - trainerPct}`} 
                              strokeDashoffset={offsetTrainer} 
                            />
                          )}

                          {/* Segment 3: Expenses (Pink) */}
                          {expensePct > 0 && (
                            <circle 
                              cx="21" cy="21" r="15.9155" fill="transparent" 
                              stroke="var(--color-pink)" strokeWidth="4.5" 
                              strokeDasharray={`${expensePct} ${100 - expensePct}`} 
                              strokeDashoffset={offsetExpenses} 
                            />
                          )}
                        </>
                      )}
                    </svg>

                    {/* Donut hole overlay details */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Profit Pct</span>
                      <span style={{ fontSize: '1.6rem', fontWeight: 700, color: prof >= 0 ? 'var(--color-green)' : 'var(--color-pink)' }}>
                        {!hasRev ? '0%' : `${Math.round(prof / rev * 100)}%`}
                      </span>
                    </div>
                  </div>

                  {/* Chart Legend */}
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-green)' }}></span>
                      <span>Profit ({!hasRev ? '0%' : `${Math.round(profitPct)}%`})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-violet)' }}></span>
                      <span>Trainers ({!hasRev ? '0%' : `${Math.round(trainerPct)}%`})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-pink)' }}></span>
                      <span>Expenses ({!hasRev ? '0%' : `${Math.round(expensePct)}%`})</span>
                    </div>
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
