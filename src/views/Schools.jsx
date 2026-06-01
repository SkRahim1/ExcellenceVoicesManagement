import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';

const Schools = () => {
  const { hasEditPermission } = useAuth();
  
  // Data lists
  const [schools, setSchools] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trainers, setTrainers] = useState([]);
  
  // Detail selection
  const [selectedSchool, setSelectedSchool] = useState(null);
  
  // Modals / Panels
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Form Inputs: Add School
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

  // Form Inputs: Edit School
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

  // Form Inputs: Record Payment
  const [payMonth, setPayMonth] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payRemarks, setPayRemarks] = useState('');

  // Form Inputs: Edit Payment
  const [editingPayment, setEditingPayment] = useState(null);
  const [editPayMonth, setEditPayMonth] = useState('');
  const [editPayAmount, setEditPayAmount] = useState('');
  const [editPayDate, setEditPayDate] = useState('');
  const [editPayRemarks, setEditPayRemarks] = useState('');

  // Fetch all tables
  const loadData = () => {
    const updatedSchools = mockDb.getSchools();
    setSchools(updatedSchools);
    setPayments(mockDb.getPayments());
    setTrainers(mockDb.getTrainers());
    
    // Also refresh selectedSchool reactively if one is active to update outstanding/payments views
    setSelectedSchool(prevSelected => {
      if (!prevSelected) return null;
      return updatedSchools.find(s => s.school_id === prevSelected.school_id) || null;
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

  const getTrainerName = (trId) => {
    const trainer = trainers.find(t => t.trainer_id === trId);
    return trainer ? trainer.trainer_name : 'Unassigned';
  };

  // Helper payment calculations
  const getSchoolPaymentsTotal = (schoolId) => {
    return payments
      .filter(p => p.school_id === schoolId)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  };

  const getSchoolBalance = (school) => {
    return Number(school.contract_amount || 0) - getSchoolPaymentsTotal(school.school_id);
  };

  // Add School submit handler
  const handleAddSchool = (e) => {
    e.preventDefault();
    if (!hasEditPermission) return;

    mockDb.addSchool({
      school_name: schoolName,
      principal_name: principalName,
      coordinator_name: coordinatorName,
      mobile_number: mobileNumber,
      email,
      address,
      trainer_id: trainerId,
      contract_amount: Math.max(0, Number(contractAmount || 0)),
      advance_for_books: Math.max(0, Number(advanceForBooks || 0)),
      recommended_installment: Math.max(0, Number(recInstallment || 0)),
      remarks,
      status,
      start_date: startDate
    });

    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'success', message: `School "${schoolName}" registered successfully.` }
    }));

    // Reset Form
    setSchoolName('');
    setPrincipalName('');
    setCoordinatorName('');
    setMobileNumber('');
    setEmail('');
    setAddress('');
    setTrainerId('');
    setContractAmount('');
    setAdvanceForBooks('');
    setRecInstallment('');
    setRemarks('');
    setStartDate('');
    setShowAddForm(false);
    
    loadData();
  };

  // Populate Edit Form fields
  const startEditSchool = (school) => {
    setEditName(school.school_name);
    setEditPrincipal(school.principal_name);
    setEditCoordinator(school.coordinator_name || '');
    setEditMobile(school.mobile_number);
    setEditEmail(school.email);
    setEditAddress(school.address);
    setEditTrainerId(school.trainer_id || '');
    setEditContract(school.contract_amount);
    setEditAdvance(school.advance_for_books || '');
    setEditInstallment(school.recommended_installment || '');
    setEditRemarks(school.remarks || '');
    setEditStartDate(school.start_date || '');
    setEditStatus(school.status);
    setShowEditForm(true);
  };

  // Save Edit School submit handler
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!hasEditPermission || !selectedSchool) return;

    const updated = mockDb.updateSchool(selectedSchool.school_id, {
      school_name: editName,
      principal_name: editPrincipal,
      coordinator_name: editCoordinator,
      mobile_number: editMobile,
      email: editEmail,
      address: editAddress,
      trainer_id: editTrainerId,
      contract_amount: Math.max(0, Number(editContract || 0)),
      advance_for_books: Math.max(0, Number(editAdvance || 0)),
      recommended_installment: Math.max(0, Number(editInstallment || 0)),
      remarks: editRemarks,
      start_date: editStartDate,
      status: editStatus
    });

    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'success', message: `School "${editName}" updated successfully.` }
    }));

    setShowEditForm(false);
    setSelectedSchool(updated);
    loadData();
  };

  // Record Payment submit handler
  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!hasEditPermission || !selectedSchool) return;

    mockDb.addPayment({
      school_id: selectedSchool.school_id,
      month: payMonth,
      amount: Math.max(0, Number(payAmount || 0)),
      payment_date: payDate,
      remarks: payRemarks
    });

    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'success', message: `Logged payment of $${payAmount} for "${selectedSchool.school_name}".` }
    }));

    // Reset Form
    setPayMonth('');
    setPayAmount('');
    setPayDate('');
    setPayRemarks('');
    setShowPayForm(false);

    loadData();
    
    // Refresh selected school details
    const updatedSchools = mockDb.getSchools();
    const current = updatedSchools.find(s => s.school_id === selectedSchool.school_id);
    setSelectedSchool(current);
  };

  // Populate Edit Payment Form fields
  const startEditPayment = (pay) => {
    setEditingPayment(pay);
    setEditPayMonth(pay.month);
    setEditPayAmount(pay.amount);
    setEditPayDate(pay.payment_date);
    setEditPayRemarks(pay.remarks || '');
    setShowPayForm(false); // Close add form if open
  };

  // Submit Edit Payment
  const handleUpdatePayment = (e) => {
    e.preventDefault();
    if (!hasEditPermission || !editingPayment) return;

    mockDb.updatePayment(editingPayment.payment_id, {
      month: editPayMonth,
      amount: Math.max(0, Number(editPayAmount || 0)),
      payment_date: editPayDate,
      remarks: editPayRemarks
    });

    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'success', message: `Updated payment for "${selectedSchool.school_name}".` }
    }));

    setEditingPayment(null);
    setEditPayMonth('');
    setEditPayAmount('');
    setEditPayDate('');
    setEditPayRemarks('');

    loadData();
    
    // Refresh selected school details
    const updatedSchools = mockDb.getSchools();
    const current = updatedSchools.find(s => s.school_id === selectedSchool.school_id);
    setSelectedSchool(current);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">School Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Register new institutional clients, modify details, and log payments.
          </p>
        </div>
        {hasEditPermission && !showAddForm && !showEditForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            + Add New School
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Create School Profile</h3>
            <button onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-small">Cancel</button>
          </div>

          <form onSubmit={handleAddSchool}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">School Name*</label>
                <input type="text" className="form-input" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Principal Name*</label>
                <input type="text" className="form-input" value={principalName} onChange={(e) => setPrincipalName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Coordinator Name</label>
                <input type="text" className="form-input" value={coordinatorName} onChange={(e) => setCoordinatorName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number*</label>
                <input type="text" className="form-input" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email*</label>
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Address*</label>
                <input type="text" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Trainer</label>
                <select className="form-input" value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {trainers.map(t => (
                    <option key={t.trainer_id} value={t.trainer_id}>{t.trainer_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contract Amount (INR)*</label>
                <input type="number" min="0" className="form-input" value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Advance for Books (INR)</label>
                <input type="number" min="0" className="form-input" value={advanceForBooks} onChange={(e) => setAdvanceForBooks(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Recommended Installment (INR)</label>
                <input type="number" min="0" className="form-input" value={recInstallment} onChange={(e) => setRecInstallment(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Remarks (Remarks Policy)</label>
              <textarea className="form-input" style={{ resize: 'vertical', minHeight: '80px' }} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Create School Profile
            </button>
          </form>
        </div>
      )}

      {showEditForm && selectedSchool && (
        <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Modify School Details</h3>
            <button onClick={() => setShowEditForm(false)} className="btn btn-secondary btn-small">Cancel</button>
          </div>

          <form onSubmit={handleSaveEdit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">School Name*</label>
                <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Principal Name*</label>
                <input type="text" className="form-input" value={editPrincipal} onChange={(e) => setEditPrincipal(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Coordinator Name</label>
                <input type="text" className="form-input" value={editCoordinator} onChange={(e) => setEditCoordinator(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number*</label>
                <input type="text" className="form-input" value={editMobile} onChange={(e) => setEditMobile(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email*</label>
                <input type="email" className="form-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Address*</label>
                <input type="text" className="form-input" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Trainer</label>
                <select className="form-input" value={editTrainerId} onChange={(e) => setEditTrainerId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {trainers.map(t => (
                    <option key={t.trainer_id} value={t.trainer_id}>{t.trainer_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contract Amount (INR)*</label>
                <input type="number" min="0" className="form-input" value={editContract} onChange={(e) => setEditContract(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Advance for Books (INR)</label>
                <input type="number" min="0" className="form-input" value={editAdvance} onChange={(e) => setEditAdvance(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Recommended Installment (INR)</label>
                <input type="number" min="0" className="form-input" value={editInstallment} onChange={(e) => setEditInstallment(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Remarks (Remarks Policy)</label>
              <textarea className="form-input" style={{ resize: 'vertical', minHeight: '80px' }} value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Save Modifications
            </button>
          </form>
        </div>
      )}

      {!showAddForm && !showEditForm && (
        <div className={`split-layout ${selectedSchool ? 'has-selection' : ''}`} style={{ display: 'grid', gridTemplateColumns: selectedSchool ? '1.1fr 1fr' : '1fr', gap: '1.5rem' }}>
          {/* Main List */}
          <div className="glass-panel directory-list-panel">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Schools Directory</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Assigned Trainer</th>
                    <th>Contract Value</th>
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
                      <tr 
                        key={school.school_id} 
                        onClick={() => setSelectedSchool(school)}
                        style={{ cursor: 'pointer', background: selectedSchool?.school_id === school.school_id ? 'rgba(6, 182, 212, 0.04)' : '' }}
                      >
                        <td data-label="School Name" style={{ fontWeight: 600, color: 'var(--color-cyan)' }}>{school.school_name}</td>
                        <td data-label="Trainer">{getTrainerName(school.trainer_id)}</td>
                        <td data-label="Contract Value">{formatCurrency(school.contract_amount)}</td>
                        <td data-label="Paid to Date" style={{ color: 'var(--color-green)' }}>{formatCurrency(totalPayments)}</td>
                        <td data-label="Owed Balance" style={{ color: remainingBalance > 0 ? 'var(--color-pink)' : 'var(--color-green)', fontWeight: 600 }}>
                          {formatCurrency(remainingBalance)}
                        </td>
                        <td data-label="Status">
                          <span className={`badge badge-${school.status.toLowerCase()}`}>
                            {school.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* School Details Side Panel */}
          {selectedSchool && (
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Profile Summary</h3>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {hasEditPermission && (
                    <button onClick={() => startEditSchool(selectedSchool)} className="btn btn-secondary btn-small" style={{ borderColor: 'var(--color-cyan)', color: 'var(--color-cyan)' }}>
                      Edit Profile
                    </button>
                  )}
                  <button onClick={() => setSelectedSchool(null)} className="btn btn-secondary btn-small">Close</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>School Name</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-cyan)' }}>{selectedSchool.school_name}</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Principal Name</div>
                    <div style={{ fontWeight: 600 }}>{selectedSchool.principal_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Coordinator Name</div>
                    <div style={{ fontWeight: 600 }}>{selectedSchool.coordinator_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mobile Number</div>
                    <div>{selectedSchool.mobile_number}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</div>
                    <div>{selectedSchool.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Trainer</div>
                    <div style={{ color: 'var(--accent-purple)' }}>{getTrainerName(selectedSchool.trainer_id)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Start Date</div>
                    <div>{selectedSchool.start_date || 'N/A'}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Address</div>
                  <div style={{ fontSize: '0.9rem' }}>{selectedSchool.address}</div>
                </div>

                {/* Financial Summary Block (Displaying Remaining Balance) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.75rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contract</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{formatCurrency(selectedSchool.contract_amount)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paid to Date</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-green)' }}>
                      {formatCurrency(getSchoolPaymentsTotal(selectedSchool.school_id))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Owed Balance</div>
                    <div style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: 700, 
                      color: getSchoolBalance(selectedSchool) > 0 ? 'var(--color-pink)' : 'var(--color-green)' 
                    }}>
                      {formatCurrency(getSchoolBalance(selectedSchool))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Advance for Books</div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(selectedSchool.advance_for_books)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Installment Recommendation</div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(selectedSchool.recommended_installment)}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remarks</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px', borderLeft: '2px solid var(--color-cyan)' }}>
                    {selectedSchool.remarks || 'No remarks added.'}
                  </p>
                </div>
              </div>

              {/* Payments Transaction List for this specific School */}
              <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Payment Transactions</h4>
                  {hasEditPermission && !showPayForm && (
                    <button onClick={() => setShowPayForm(true)} className="btn btn-primary btn-small">
                      + Record Payment
                    </button>
                  )}
                </div>

                 {showPayForm && (
                  <div className="glass-panel" style={{ marginBottom: '1.5rem', background: 'rgba(15,23,42,0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h5 style={{ fontWeight: 600 }}>Record Payment Form</h5>
                      <button onClick={() => setShowPayForm(false)} className="btn btn-secondary btn-small" style={{ padding: '2px 8px' }}>Cancel</button>
                    </div>

                    <form onSubmit={handleRecordPayment}>
                      <div className="form-group">
                        <label className="form-label">Billing Month*</label>
                        <input type="text" className="form-input" placeholder="e.g. 2025-06" value={payMonth} onChange={(e) => setPayMonth(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Amount (INR)*</label>
                        <input type="number" min="0" className="form-input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Payment Date*</label>
                        <input type="date" className="form-input" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Remarks (Remarks Policy)</label>
                        <input type="text" className="form-input" value={payRemarks} onChange={(e) => setPayRemarks(e.target.value)} />
                      </div>
                      <button type="submit" className="btn btn-primary btn-small" style={{ width: '100%' }}>
                        Save Payment
                      </button>
                    </form>
                  </div>
                )}

                {editingPayment && (
                  <div className="glass-panel" style={{ marginBottom: '1.5rem', background: 'rgba(15,23,42,0.4)', borderColor: 'var(--color-cyan)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h5 style={{ fontWeight: 600, color: 'var(--color-cyan)' }}>Modify Payment</h5>
                      <button onClick={() => setEditingPayment(null)} className="btn btn-secondary btn-small" style={{ padding: '2px 8px' }}>Cancel</button>
                    </div>

                    <form onSubmit={handleUpdatePayment}>
                      <div className="form-group">
                        <label className="form-label">Billing Month*</label>
                        <input type="text" className="form-input" placeholder="e.g. 2025-06" value={editPayMonth} onChange={(e) => setEditPayMonth(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Amount (INR)*</label>
                        <input type="number" min="0" className="form-input" value={editPayAmount} onChange={(e) => setEditPayAmount(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Payment Date*</label>
                        <input type="date" className="form-input" value={editPayDate} onChange={(e) => setEditPayDate(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Remarks (Remarks Policy)</label>
                        <input type="text" className="form-input" value={editPayRemarks} onChange={(e) => setEditPayRemarks(e.target.value)} />
                      </div>
                      <button type="submit" className="btn btn-primary btn-small" style={{ width: '100%' }}>
                        Save Changes
                      </button>
                    </form>
                  </div>
                )}

                <div className="table-container">
                  {payments.filter(p => p.school_id === selectedSchool.school_id).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>No payments logged yet.</p>
                  ) : (
                    <table className="data-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Cover Month</th>
                          <th>Amount</th>
                          <th>Remarks</th>
                          {hasEditPermission && <th>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {payments
                          .filter(p => p.school_id === selectedSchool.school_id)
                          .map(pay => (
                            <tr key={pay.payment_id}>
                              <td data-label="Payment Date">{pay.payment_date}</td>
                              <td data-label="Cover Month">{pay.month}</td>
                              <td data-label="Amount" style={{ color: 'var(--color-green)', fontWeight: 600 }}>{formatCurrency(pay.amount)}</td>
                              <td data-label="Remarks" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pay.remarks}</td>
                              {hasEditPermission && (
                                <td data-label="Action">
                                  <button
                                    onClick={() => startEditPayment(pay)}
                                    className="btn btn-secondary btn-small"
                                    style={{ padding: '2px 8px', fontSize: '0.75rem', borderColor: 'var(--color-cyan)', color: 'var(--color-cyan)' }}
                                  >
                                    Edit
                                  </button>
                                </td>
                              )}
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

export default Schools;
