import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';

const Trainers = () => {
  const { hasEditPermission } = useAuth();
  
  // Lists
  const [trainers, setTrainers] = useState([]);
  const [payouts, setPayouts] = useState([]);

  // Selections
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Modals / Panels
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  // Form Inputs: Add Trainer
  const [trainerName, setTrainerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState('Active');

  // Form Inputs: Record Payout
  const [payMonth, setPayMonth] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payRemarks, setPayRemarks] = useState('');

  const loadData = () => {
    const updatedTrainers = mockDb.getTrainers();
    setTrainers(updatedTrainers);
    setPayouts(mockDb.getTrainerPayments());
    
    // Also refresh selectedTrainer reactively if one is active to update payout logs
    setSelectedTrainer(prevSelected => {
      if (!prevSelected) return null;
      return updatedTrainers.find(t => t.trainer_id === prevSelected.trainer_id) || null;
    });
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

  // Add Trainer submit handler
  const handleAddTrainer = (e) => {
    e.preventDefault();
    if (!hasEditPermission) return;

    mockDb.addTrainer({
      trainer_name: trainerName,
      mobile,
      email,
      joining_date: joiningDate,
      status
    });

    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'success', message: `Trainer "${trainerName}" registered successfully.` }
    }));

    // Reset Form
    setTrainerName('');
    setMobile('');
    setEmail('');
    setJoiningDate('');
    setShowAddForm(false);

    loadData();
  };

  // Record Trainer Payment submit handler
  const handleRecordPayout = (e) => {
    e.preventDefault();
    if (!hasEditPermission || !selectedTrainer) return;

    mockDb.addTrainerPayment({
      trainer_id: selectedTrainer.trainer_id,
      month: payMonth,
      amount: Number(payAmount || 0),
      payment_date: payDate,
      remarks: payRemarks
    });

    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'success', message: `Logged payout of $${payAmount} for trainer "${selectedTrainer.trainer_name}".` }
    }));

    // Reset Form
    setPayMonth('');
    setPayAmount('');
    setPayDate('');
    setPayRemarks('');
    setShowPayoutForm(false);

    loadData();
    
    // Refresh selected trainer details
    const updatedTrainers = mockDb.getTrainers();
    const current = updatedTrainers.find(t => t.trainer_id === selectedTrainer.trainer_id);
    setSelectedTrainer(current);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trainer Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Manage instructors and log salary payouts.
          </p>
        </div>
        {hasEditPermission && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            + Add New Trainer
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Add Trainer Profile</h3>
            <button onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-small">Cancel</button>
          </div>

          <form onSubmit={handleAddTrainer}>
            <div className="form-group">
              <label className="form-label">Trainer Name*</label>
              <input type="text" className="form-input" value={trainerName} onChange={(e) => setTrainerName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number*</label>
              <input type="text" className="form-input" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email*</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Joining Date</label>
              <input type="date" className="form-input" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Create Trainer Profile
            </button>
          </form>
        </div>
      )}

      {!showAddForm && (
        <div className={`split-layout ${selectedTrainer ? 'has-selection' : ''}`} style={{ display: 'grid', gridTemplateColumns: selectedTrainer ? '1.2fr 1fr' : '1fr', gap: '1.5rem' }}>
          {/* Main List */}
          <div className="glass-panel directory-list-panel">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Trainers Directory</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Trainer Name</th>
                    <th>Email</th>
                    <th>Joining Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers.map(trainer => (
                    <tr 
                      key={trainer.trainer_id} 
                      onClick={() => setSelectedTrainer(trainer)}
                      style={{ cursor: 'pointer', background: selectedTrainer?.trainer_id === trainer.trainer_id ? 'rgba(6, 182, 212, 0.04)' : '' }}
                    >
                      <td data-label="Trainer Name" style={{ fontWeight: 600, color: 'var(--color-violet)' }}>{trainer.trainer_name}</td>
                      <td data-label="Email">{trainer.email}</td>
                      <td data-label="Joining Date">{trainer.joining_date || 'N/A'}</td>
                      <td data-label="Status">
                        <span className={`badge ${trainer.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                          {trainer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trainer detail sidebar */}
          {selectedTrainer && (
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Profile Card</h3>
                <button onClick={() => setSelectedTrainer(null)} className="btn btn-secondary btn-small">Close</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trainer Name</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-violet)' }}>{selectedTrainer.trainer_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mobile Number</div>
                  <div>{selectedTrainer.mobile}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</div>
                  <div>{selectedTrainer.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Joining Date</div>
                  <div>{selectedTrainer.joining_date || 'N/A'}</div>
                </div>
              </div>

              {/* Payout records list for this trainer */}
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
                      <button onClick={() => setShowPayoutForm(false)} className="btn btn-secondary btn-small" style={{ padding: '2px 8px' }}>Cancel</button>
                    </div>

                    <form onSubmit={handleRecordPayout}>
                      <div className="form-group">
                        <label className="form-label">Cover Month*</label>
                        <input type="text" className="form-input" placeholder="e.g. 2025-06" value={payMonth} onChange={(e) => setPayMonth(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Amount (INR)*</label>
                        <input type="number" className="form-input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Payment Date*</label>
                        <input type="date" className="form-input" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Remarks (Remarks Policy)</label>
                        <input type="text" className="form-input" value={payRemarks} onChange={(e) => setPayRemarks(e.target.value)} />
                      </div>
                      <button type="submit" className="btn btn-primary btn-small" style={{ width: '100%', backgroundColor: 'var(--color-violet)' }}>
                        Save Payout Log
                      </button>
                    </form>
                  </div>
                )}

                <div className="table-container">
                  {payouts.filter(p => p.trainer_id === selectedTrainer.trainer_id).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>No payouts recorded yet.</p>
                  ) : (
                    <table className="data-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Month</th>
                          <th>Amount</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts
                          .filter(p => p.trainer_id === selectedTrainer.trainer_id)
                          .map(po => (
                            <tr key={po.payout_id}>
                              <td data-label="Payment Date">{po.payment_date}</td>
                              <td data-label="Month">{po.month}</td>
                              <td data-label="Amount" style={{ color: 'var(--color-green)', fontWeight: 600 }}>{formatCurrency(po.amount)}</td>
                              <td data-label="Remarks" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{po.remarks}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Trainers;
