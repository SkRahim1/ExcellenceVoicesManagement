import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';

const Trainers = () => {
  const { hasEditPermission } = useAuth();

  const [trainers, setTrainers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Add Trainer form
  const [trainerName, setTrainerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState('Active');

  // Payout form
  const [payMonth, setPayMonth] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payRemarks, setPayRemarks] = useState('');

  const loadData = () => {
    setTrainers(mockDb.getTrainers());
    setPayouts(mockDb.getTrainerPayments());
  };

  useEffect(() => { loadData(); }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const getTrainerTotal = (trainerId) =>
    payouts.filter(p => p.trainer_id === trainerId).reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const handleAddTrainer = (e) => {
    e.preventDefault();
    if (!hasEditPermission) return;
    mockDb.addTrainer({ trainer_name: trainerName, mobile, email, joining_date: joiningDate, status });
    setTrainerName(''); setMobile(''); setEmail(''); setJoiningDate('');
    setShowAddForm(false);
    loadData();
  };

  const handleRecordPayout = (e) => {
    e.preventDefault();
    if (!hasEditPermission || !selectedTrainer) return;
    mockDb.addTrainerPayment({
      trainer_id: selectedTrainer.trainer_id, month: payMonth,
      amount: Number(payAmount || 0), payment_date: payDate, remarks: payRemarks
    });
    setPayMonth(''); setPayAmount(''); setPayDate(''); setPayRemarks('');
    setShowPayoutForm(false);
    loadData();
    const current = mockDb.getTrainers().find(t => t.trainer_id === selectedTrainer.trainer_id);
    setSelectedTrainer(current);
  };

  // ── Trainer Detail Panel ──────────────────────────────────────────────────
  const renderDetail = () => {
    if (!selectedTrainer) return null;
    const trainerPayouts = payouts.filter(p => p.trainer_id === selectedTrainer.trainer_id);
    const totalPaid = trainerPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return (
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Profile Card</h3>
          <button onClick={() => setSelectedTrainer(null)} className="btn btn-secondary btn-small">
            {isMobile ? '← Back' : 'Close'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trainer Name</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-violet)' }}>{selectedTrainer.trainer_name}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {[
              ['Mobile', selectedTrainer.mobile],
              ['Email', selectedTrainer.email],
              ['Joining Date', selectedTrainer.joining_date || 'N/A'],
              ['Status', selectedTrainer.status],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Disbursed</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-violet)' }}>{formatCurrency(totalPaid)}</div>
          </div>
        </div>

        {/* Disbursement History */}
        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Disbursement History</h4>
            {hasEditPermission && !showPayoutForm && (
              <button onClick={() => setShowPayoutForm(true)} className="btn btn-primary btn-small" style={{ backgroundColor: 'var(--color-violet)' }}>
                + Record Payout
              </button>
            )}
          </div>

          {showPayoutForm && (
            <div className="glass-panel" style={{ marginBottom: '1.5rem', background: 'rgba(15,23,42,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h5 style={{ fontWeight: 600 }}>Disburse Payout</h5>
                <button onClick={() => setShowPayoutForm(false)} className="btn btn-secondary btn-small">Cancel</button>
              </div>
              <form onSubmit={handleRecordPayout}>
                <div className="form-group"><label className="form-label">Cover Month* (e.g. 2025-06)</label><input type="text" className="form-input" value={payMonth} onChange={e => setPayMonth(e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Amount (INR)*</label><input type="number" className="form-input" value={payAmount} onChange={e => setPayAmount(e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Payment Date*</label><input type="date" className="form-input" value={payDate} onChange={e => setPayDate(e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Remarks</label><input type="text" className="form-input" value={payRemarks} onChange={e => setPayRemarks(e.target.value)} /></div>
                <button type="submit" className="btn btn-primary btn-small" style={{ width: '100%', backgroundColor: 'var(--color-violet)' }}>Save Payout Log</button>
              </form>
            </div>
          )}

          {trainerPayouts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No payouts recorded yet.</p>
          ) : (
            <>
              {/* Desktop payout table */}
              <div className="desktop-only">
                <div className="table-container">
                  <table className="data-table" style={{ fontSize: '0.85rem' }}>
                    <thead><tr><th>Date</th><th>Month</th><th>Amount</th><th>Remarks</th></tr></thead>
                    <tbody>
                      {trainerPayouts.map(po => (
                        <tr key={po.payout_id}>
                          <td>{po.payment_date}</td>
                          <td>{po.month}</td>
                          <td style={{ color: 'var(--color-violet)', fontWeight: 600 }}>{formatCurrency(po.amount)}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{po.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile payout cards */}
              <div className="mobile-only">
                <div className="mobile-card-list">
                  {trainerPayouts.map(po => (
                    <div className="mobile-card" key={po.payout_id}>
                      <div className="mobile-card-header">
                        <span className="mobile-card-title">{po.month}</span>
                        <span style={{ color: 'var(--color-violet)', fontWeight: 700, fontSize: '1rem' }}>{formatCurrency(po.amount)}</span>
                      </div>
                      <div className="mobile-card-grid">
                        <div className="mobile-card-item">
                          <span className="mobile-card-label">Date</span>
                          <span className="mobile-card-value">{po.payment_date}</span>
                        </div>
                        {po.remarks && (
                          <div className="mobile-card-item" style={{ gridColumn: '1 / -1' }}>
                            <span className="mobile-card-label">Remarks</span>
                            <span className="mobile-card-value" style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{po.remarks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Trainer Management{' '}
            <span style={{ color: 'var(--color-violet)', fontSize: '1.3rem', fontWeight: 700 }}>{`{${trainers.length}}`}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Manage instructors and log salary payouts.
          </p>
        </div>
        {hasEditPermission && !showAddForm && !(isMobile && selectedTrainer) && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">+ Add New Trainer</button>
        )}
      </div>

      {/* Add Trainer Form */}
      {showAddForm && (
        <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Add Trainer Profile</h3>
            <button onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-small">Cancel</button>
          </div>
          <form onSubmit={handleAddTrainer}>
            <div className="form-group"><label className="form-label">Trainer Name*</label><input type="text" className="form-input" value={trainerName} onChange={e => setTrainerName(e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Mobile Number*</label><input type="text" className="form-input" value={mobile} onChange={e => setMobile(e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Email*</label><input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Joining Date</label><input type="date" className="form-input" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} /></div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="Active">Active</option><option value="Inactive">Inactive</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Create Trainer Profile</button>
          </form>
        </div>
      )}

      {/* Main Content */}
      {!showAddForm && (
        <>
          {/* ── MOBILE ──────────────────────────────────────────────────── */}
          {isMobile ? (
            selectedTrainer ? (
              renderDetail()
            ) : (
              <div className="glass-panel">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Trainers Directory</h3>
                {trainers.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No trainers added yet.</p>
                ) : (
                  <div className="mobile-card-list">
                    {trainers.map(trainer => {
                      const total = getTrainerTotal(trainer.trainer_id);
                      return (
                        <div className="mobile-card" key={trainer.trainer_id} onClick={() => setSelectedTrainer(trainer)} style={{ cursor: 'pointer' }}>
                          <div className="mobile-card-header">
                            <span className="mobile-card-title">{trainer.trainer_name}</span>
                            <span className={`badge ${trainer.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>{trainer.status}</span>
                          </div>
                          <div className="mobile-card-grid">
                            <div className="mobile-card-item">
                              <span className="mobile-card-label">Mobile</span>
                              <span className="mobile-card-value">{trainer.mobile}</span>
                            </div>
                            <div className="mobile-card-item">
                              <span className="mobile-card-label">Joining Date</span>
                              <span className="mobile-card-value">{trainer.joining_date || 'N/A'}</span>
                            </div>
                            <div className="mobile-card-item" style={{ gridColumn: '1 / -1' }}>
                              <span className="mobile-card-label">Total Disbursed</span>
                              <span className="mobile-card-value" style={{ color: 'var(--color-violet)', fontSize: '1rem' }}>{formatCurrency(total)}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
                            Tap to view profile & payouts →
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          ) : (
            /* ── DESKTOP split layout ───────────────────────────────── */
            <div style={{ display: 'grid', gridTemplateColumns: selectedTrainer ? '1.2fr 1fr' : '1fr', gap: '1.5rem' }}>
              <div className="glass-panel">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Trainers Directory</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr><th>Trainer Name</th><th>Email</th><th>Joining Date</th><th>Total Disbursed</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {trainers.map(trainer => (
                        <tr key={trainer.trainer_id} onClick={() => setSelectedTrainer(trainer)}
                          style={{ cursor: 'pointer', background: selectedTrainer?.trainer_id === trainer.trainer_id ? 'rgba(139,92,246,0.04)' : '' }}>
                          <td style={{ fontWeight: 600, color: 'var(--color-violet)' }}>{trainer.trainer_name}</td>
                          <td>{trainer.email}</td>
                          <td>{trainer.joining_date || 'N/A'}</td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(getTrainerTotal(trainer.trainer_id))}</td>
                          <td><span className={`badge ${trainer.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>{trainer.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {selectedTrainer && renderDetail()}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Trainers;
