import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';

const Schools = () => {
  const { hasEditPermission } = useAuth();
  
  const [schools, setSchools] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Add School form
  const [schoolName, setSchoolName] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [advanceForBooks, setAdvanceForBooks] = useState('');
  const [recInstallment, setRecInstallment] = useState('');
  const [remarks, setRemarks] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('Active');

  // Edit School form
  const [editName, setEditName] = useState('');
  const [editPrincipal, setEditPrincipal] = useState('');
  const [editCoordinator, setEditCoordinator] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTrainerId, setEditTrainerId] = useState('');
  const [editContract, setEditContract] = useState('');
  const [editAdvance, setEditAdvance] = useState('');
  const [editInstallment, setEditInstallment] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editStatus, setEditStatus] = useState('Active');

  // Payment form
  const [payMonth, setPayMonth] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payRemarks, setPayRemarks] = useState('');

  const loadData = () => {
    setSchools(mockDb.getSchools());
    setPayments(mockDb.getPayments());
    setTrainers(mockDb.getTrainers());
  };

  useEffect(() => { loadData(); }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const getTrainerName = (trId) => {
    const t = trainers.find(t => t.trainer_id === trId);
    return t ? t.trainer_name : 'Unassigned';
  };

  const getSchoolPaymentsTotal = (schoolId) =>
    payments.filter(p => p.school_id === schoolId).reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const getSchoolBalance = (school) =>
    Number(school.contract_amount || 0) - getSchoolPaymentsTotal(school.school_id);

  const handleAddSchool = (e) => {
    e.preventDefault();
    if (!hasEditPermission) return;
    mockDb.addSchool({
      school_name: schoolName, principal_name: principalName, coordinator_name: coordinatorName,
      mobile_number: mobileNumber, email, address, trainer_id: trainerId,
      contract_amount: Math.max(0, Number(contractAmount || 0)),
      advance_for_books: Math.max(0, Number(advanceForBooks || 0)),
      recommended_installment: Math.max(0, Number(recInstallment || 0)),
      remarks, status, start_date: startDate
    });
    setSchoolName(''); setPrincipalName(''); setCoordinatorName(''); setMobileNumber('');
    setEmail(''); setAddress(''); setTrainerId(''); setContractAmount('');
    setAdvanceForBooks(''); setRecInstallment(''); setRemarks(''); setStartDate('');
    setShowAddForm(false);
    loadData();
  };

  const startEditSchool = (school) => {
    setEditName(school.school_name); setEditPrincipal(school.principal_name);
    setEditCoordinator(school.coordinator_name || ''); setEditMobile(school.mobile_number);
    setEditEmail(school.email); setEditAddress(school.address);
    setEditTrainerId(school.trainer_id || ''); setEditContract(school.contract_amount);
    setEditAdvance(school.advance_for_books || ''); setEditInstallment(school.recommended_installment || '');
    setEditRemarks(school.remarks || ''); setEditStartDate(school.start_date || '');
    setEditStatus(school.status); setShowEditForm(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!hasEditPermission || !selectedSchool) return;
    const updated = mockDb.updateSchool(selectedSchool.school_id, {
      school_name: editName, principal_name: editPrincipal, coordinator_name: editCoordinator,
      mobile_number: editMobile, email: editEmail, address: editAddress,
      trainer_id: editTrainerId,
      contract_amount: Math.max(0, Number(editContract || 0)),
      advance_for_books: Math.max(0, Number(editAdvance || 0)),
      recommended_installment: Math.max(0, Number(editInstallment || 0)),
      remarks: editRemarks, start_date: editStartDate, status: editStatus
    });
    setShowEditForm(false);
    setSelectedSchool(updated);
    loadData();
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!hasEditPermission || !selectedSchool) return;
    mockDb.addPayment({
      school_id: selectedSchool.school_id, month: payMonth,
      amount: Math.max(0, Number(payAmount || 0)), payment_date: payDate, remarks: payRemarks
    });
    setPayMonth(''); setPayAmount(''); setPayDate(''); setPayRemarks('');
    setShowPayForm(false);
    loadData();
    const current = mockDb.getSchools().find(s => s.school_id === selectedSchool.school_id);
    setSelectedSchool(current);
  };

  // Shared form grid style (auto-fits to 1 col on mobile)
  const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' };

  // ── School Detail Panel (shared by desktop right-pane and mobile full-view) ──
  const renderDetail = () => {
    if (!selectedSchool) return null;
    const schoolPayments = payments.filter(p => p.school_id === selectedSchool.school_id);
    return (
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Profile Summary</h3>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {hasEditPermission && (
              <button onClick={() => startEditSchool(selectedSchool)} className="btn btn-secondary btn-small" style={{ borderColor: 'var(--color-cyan)', color: 'var(--color-cyan)' }}>
                Edit Profile
              </button>
            )}
            <button onClick={() => setSelectedSchool(null)} className="btn btn-secondary btn-small">
              {isMobile ? '← Back' : 'Close'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>School Name</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-cyan)' }}>{selectedSchool.school_name}</div>
          </div>
          <div style={formGrid}>
            {[
              ['Principal Name', selectedSchool.principal_name],
              ['Coordinator', selectedSchool.coordinator_name || 'N/A'],
              ['Mobile Number', selectedSchool.mobile_number],
              ['Email', selectedSchool.email],
              ['Assigned Trainer', getTrainerName(selectedSchool.trainer_id)],
              ['Start Date', selectedSchool.start_date || 'N/A'],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Address</div>
            <div style={{ fontSize: '0.9rem' }}>{selectedSchool.address}</div>
          </div>

          {/* Financial Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
            {[
              ['Contract', formatCurrency(selectedSchool.contract_amount), 'var(--text-primary)'],
              ['Adv. Books', formatCurrency(selectedSchool.advance_for_books || 0), 'var(--color-violet)'],
              ['Paid to Date', formatCurrency(getSchoolPaymentsTotal(selectedSchool.school_id)), 'var(--color-green)'],
              ['Owed Balance', formatCurrency(getSchoolBalance(selectedSchool)), getSchoolBalance(selectedSchool) > 0 ? 'var(--color-pink)' : 'var(--color-green)'],
            ].map(([label, val, color]) => (
              <div key={label}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Installment Recommendation</div>
              <div style={{ fontWeight: 600 }}>{formatCurrency(selectedSchool.recommended_installment || 0)}</div>
            </div>
          </div>

          {selectedSchool.remarks && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remarks</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px', borderLeft: '2px solid var(--color-cyan)' }}>
                {selectedSchool.remarks}
              </p>
            </div>
          )}
        </div>

        {/* Payment Transactions */}
        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Payment Transactions</h4>
            {hasEditPermission && !showPayForm && (
              <button onClick={() => setShowPayForm(true)} className="btn btn-primary btn-small">+ Record Payment</button>
            )}
          </div>

          {showPayForm && (
            <div className="glass-panel" style={{ marginBottom: '1.5rem', background: 'rgba(15,23,42,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h5 style={{ fontWeight: 600 }}>Record Payment</h5>
                <button onClick={() => setShowPayForm(false)} className="btn btn-secondary btn-small">Cancel</button>
              </div>
              <form onSubmit={handleRecordPayment}>
                <div className="form-group">
                  <label className="form-label">Billing Month* (e.g. 2025-06)</label>
                  <input type="text" className="form-input" value={payMonth} onChange={e => setPayMonth(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (INR)*</label>
                  <input type="number" min="0" className="form-input" value={payAmount} onChange={e => setPayAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Date*</label>
                  <input type="date" className="form-input" value={payDate} onChange={e => setPayDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <input type="text" className="form-input" value={payRemarks} onChange={e => setPayRemarks(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-small" style={{ width: '100%' }}>Save Payment</button>
              </form>
            </div>
          )}

          {schoolPayments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No payments logged yet.</p>
          ) : (
            <>
              {/* Desktop payment table */}
              <div className="desktop-only">
                <div className="table-container">
                  <table className="data-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr><th>Date</th><th>Cover Month</th><th>Amount</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {schoolPayments.map(pay => (
                        <tr key={pay.payment_id}>
                          <td>{pay.payment_date}</td>
                          <td>{pay.month}</td>
                          <td style={{ color: 'var(--color-green)', fontWeight: 600 }}>{formatCurrency(pay.amount)}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{pay.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile payment cards */}
              <div className="mobile-only">
                <div className="mobile-card-list">
                  {schoolPayments.map(pay => (
                    <div className="mobile-card" key={pay.payment_id}>
                      <div className="mobile-card-header">
                        <span className="mobile-card-title">{pay.month}</span>
                        <span style={{ color: 'var(--color-green)', fontWeight: 700, fontSize: '1rem' }}>{formatCurrency(pay.amount)}</span>
                      </div>
                      <div className="mobile-card-grid">
                        <div className="mobile-card-item">
                          <span className="mobile-card-label">Date</span>
                          <span className="mobile-card-value">{pay.payment_date}</span>
                        </div>
                        {pay.remarks && (
                          <div className="mobile-card-item" style={{ gridColumn: '1 / -1' }}>
                            <span className="mobile-card-label">Remarks</span>
                            <span className="mobile-card-value" style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{pay.remarks}</span>
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
            School Management{' '}
            <span style={{ color: 'var(--color-cyan)', fontSize: '1.3rem', fontWeight: 700 }}>{`{${schools.length}}`}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Register new institutional clients, modify details, and log payments.
          </p>
        </div>
        {hasEditPermission && !showAddForm && !showEditForm && !(isMobile && selectedSchool) && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">+ Add New School</button>
        )}
      </div>

      {/* Add School Form */}
      {showAddForm && (
        <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Create School Profile</h3>
            <button onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-small">Cancel</button>
          </div>
          <form onSubmit={handleAddSchool}>
            <div style={formGrid}>
              <div className="form-group"><label className="form-label">School Name*</label><input type="text" className="form-input" value={schoolName} onChange={e => setSchoolName(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Principal Name*</label><input type="text" className="form-input" value={principalName} onChange={e => setPrincipalName(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Coordinator Name</label><input type="text" className="form-input" value={coordinatorName} onChange={e => setCoordinatorName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Mobile Number*</label><input type="text" className="form-input" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Email*</label><input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Address*</label><input type="text" className="form-input" value={address} onChange={e => setAddress(e.target.value)} required /></div>
              <div className="form-group">
                <label className="form-label">Assigned Trainer</label>
                <select className="form-input" value={trainerId} onChange={e => setTrainerId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {trainers.map(t => <option key={t.trainer_id} value={t.trainer_id}>{t.trainer_name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Contract Amount (INR)*</label><input type="number" min="0" className="form-input" value={contractAmount} onChange={e => setContractAmount(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Advance for Books (INR)</label><input type="number" min="0" className="form-input" value={advanceForBooks} onChange={e => setAdvanceForBooks(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Recommended Installment (INR)</label><input type="number" min="0" className="form-input" value={recInstallment} onChange={e => setRecInstallment(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Remarks</label><textarea className="form-input" style={{ resize: 'vertical', minHeight: '80px' }} value={remarks} onChange={e => setRemarks(e.target.value)} /></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Create School Profile</button>
          </form>
        </div>
      )}

      {/* Edit School Form */}
      {showEditForm && selectedSchool && (
        <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Modify School Details</h3>
            <button onClick={() => setShowEditForm(false)} className="btn btn-secondary btn-small">Cancel</button>
          </div>
          <form onSubmit={handleSaveEdit}>
            <div style={formGrid}>
              <div className="form-group"><label className="form-label">School Name*</label><input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Principal Name*</label><input type="text" className="form-input" value={editPrincipal} onChange={e => setEditPrincipal(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Coordinator Name</label><input type="text" className="form-input" value={editCoordinator} onChange={e => setEditCoordinator(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Mobile Number*</label><input type="text" className="form-input" value={editMobile} onChange={e => setEditMobile(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Email*</label><input type="email" className="form-input" value={editEmail} onChange={e => setEditEmail(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Address*</label><input type="text" className="form-input" value={editAddress} onChange={e => setEditAddress(e.target.value)} required /></div>
              <div className="form-group">
                <label className="form-label">Assigned Trainer</label>
                <select className="form-input" value={editTrainerId} onChange={e => setEditTrainerId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {trainers.map(t => <option key={t.trainer_id} value={t.trainer_id}>{t.trainer_name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Contract Amount (INR)*</label><input type="number" min="0" className="form-input" value={editContract} onChange={e => setEditContract(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Advance for Books (INR)</label><input type="number" min="0" className="form-input" value={editAdvance} onChange={e => setEditAdvance(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Recommended Installment (INR)</label><input type="number" min="0" className="form-input" value={editInstallment} onChange={e => setEditInstallment(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-input" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} /></div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Remarks</label><textarea className="form-input" style={{ resize: 'vertical', minHeight: '80px' }} value={editRemarks} onChange={e => setEditRemarks(e.target.value)} /></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Save Modifications</button>
          </form>
        </div>
      )}

      {/* Main Content: Directory + Detail */}
      {!showAddForm && !showEditForm && (
        <>
          {/* ── MOBILE: show list OR detail exclusively ─────────────── */}
          {isMobile ? (
            selectedSchool ? (
              renderDetail()
            ) : (
              <div className="glass-panel">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Schools Directory</h3>
                {schools.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No schools added yet.</p>
                ) : (
                  <div className="mobile-card-list">
                    {schools.map(school => {
                      const paid = getSchoolPaymentsTotal(school.school_id);
                      const balance = getSchoolBalance(school);
                      return (
                        <div className="mobile-card" key={school.school_id} onClick={() => setSelectedSchool(school)} style={{ cursor: 'pointer' }}>
                          <div className="mobile-card-header">
                            <span className="mobile-card-title">{school.school_name}</span>
                            <span className={`badge badge-${school.status.toLowerCase()}`}>{school.status}</span>
                          </div>
                          <div className="mobile-card-grid">
                            <div className="mobile-card-item">
                              <span className="mobile-card-label">Trainer</span>
                              <span className="mobile-card-value">{getTrainerName(school.trainer_id)}</span>
                            </div>
                            <div className="mobile-card-item">
                              <span className="mobile-card-label">Contract</span>
                              <span className="mobile-card-value">{formatCurrency(school.contract_amount)}</span>
                            </div>
                            <div className="mobile-card-item">
                              <span className="mobile-card-label">Adv. Books</span>
                              <span className="mobile-card-value" style={{ color: 'var(--color-violet)' }}>{formatCurrency(school.advance_for_books || 0)}</span>
                            </div>
                            <div className="mobile-card-item">
                              <span className="mobile-card-label">Paid</span>
                              <span className="mobile-card-value" style={{ color: 'var(--color-green)' }}>{formatCurrency(paid)}</span>
                            </div>
                            <div className="mobile-card-item" style={{ gridColumn: '1 / -1' }}>
                              <span className="mobile-card-label">Balance Due</span>
                              <span className="mobile-card-value" style={{ color: balance > 0 ? 'var(--color-pink)' : 'var(--color-green)', fontSize: '1rem' }}>
                                {formatCurrency(balance)}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
                            Tap to view profile & payments →
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          ) : (
            /* ── DESKTOP: split layout ─────────────────────────────── */
            <div style={{ display: 'grid', gridTemplateColumns: selectedSchool ? '1.1fr 1fr' : '1fr', gap: '1.5rem' }}>
              {/* Directory table */}
              <div className="glass-panel">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Schools Directory</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>School Name</th>
                        <th>Assigned Trainer</th>
                        <th>Contract Value</th>
                        <th>Adv. Books</th>
                        <th>Payments Received</th>
                        <th>Remaining Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schools.map(school => {
                        const totalPayments = getSchoolPaymentsTotal(school.school_id);
                        const remainingBalance = getSchoolBalance(school);
                        return (
                          <tr key={school.school_id} onClick={() => setSelectedSchool(school)}
                            style={{ cursor: 'pointer', background: selectedSchool?.school_id === school.school_id ? 'rgba(6,182,212,0.04)' : '' }}>
                            <td style={{ fontWeight: 600, color: 'var(--color-cyan)' }}>{school.school_name}</td>
                            <td>{getTrainerName(school.trainer_id)}</td>
                            <td>{formatCurrency(school.contract_amount)}</td>
                            <td style={{ color: 'var(--color-violet)', fontWeight: 600 }}>{formatCurrency(school.advance_for_books || 0)}</td>
                            <td style={{ color: 'var(--color-green)' }}>{formatCurrency(totalPayments)}</td>
                            <td style={{ color: remainingBalance > 0 ? 'var(--color-pink)' : 'var(--color-green)', fontWeight: 600 }}>{formatCurrency(remainingBalance)}</td>
                            <td><span className={`badge badge-${school.status.toLowerCase()}`}>{school.status}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detail panel */}
              {selectedSchool && renderDetail()}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Schools;
