import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';

const Capital = () => {
  const { hasEditPermission } = useAuth();
  
  // Lists
  const [contributions, setContributions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form Inputs
  const [partnerName, setPartnerName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const loadData = () => {
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

  // Submit Handler
  const handleAddContribution = (e) => {
    e.preventDefault();
    if (!hasEditPermission) return;

    mockDb.addContribution({
      partner_name: partnerName,
      amount: Number(amount || 0),
      date,
      remarks
    });

    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'success', message: `Recorded capital contribution of $${amount} from partner "${partnerName}".` }
    }));

    // Reset Form
    setPartnerName('');
    setAmount('');
    setDate('');
    setRemarks('');
    setShowAddForm(false);

    loadData();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Capital Contributions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Register non-revenue cash injections from partners.
          </p>
        </div>
        {hasEditPermission && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary" style={{ backgroundColor: 'var(--color-orange)' }}>
            + Log Capital Contribution
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Log Contribution</h3>
            <button onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-small">Cancel</button>
          </div>

          <form onSubmit={handleAddContribution}>
            <div className="form-group">
              <label className="form-label">Partner Name*</label>
              <input type="text" className="form-input" placeholder="e.g. Partner 1" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Amount (INR)*</label>
              <input type="number" className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Transaction Date*</label>
              <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Remarks (Remarks Policy)</label>
              <textarea className="form-input" style={{ resize: 'vertical', minHeight: '80px' }} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', backgroundColor: 'var(--color-orange)', color: '#000' }}>
              Log Contribution
            </button>
          </form>
        </div>
      )}

      {!showAddForm && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Capital Ledger</h3>

          {contributions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1.5rem 0' }}>No partner contributions logged.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="desktop-only">
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Partner</th><th>Amount</th><th>Remarks</th><th>Logged By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contributions.map(con => (
                        <tr key={con.contribution_id}>
                          <td>{con.date}</td>
                          <td style={{ fontWeight: 600, color: 'var(--color-orange)' }}>{con.partner_name}</td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(con.amount)}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{con.remarks}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{con.added_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="mobile-only">
                <div className="mobile-card-list">
                  {contributions.map(con => (
                    <div className="mobile-card" key={con.contribution_id}>
                      <div className="mobile-card-header">
                        <span className="mobile-card-title" style={{ color: 'var(--color-orange)' }}>{con.partner_name}</span>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-orange)' }}>{formatCurrency(con.amount)}</span>
                      </div>
                      <div className="mobile-card-grid">
                        <div className="mobile-card-item">
                          <span className="mobile-card-label">Date</span>
                          <span className="mobile-card-value">{con.date}</span>
                        </div>
                        <div className="mobile-card-item">
                          <span className="mobile-card-label">Logged By</span>
                          <span className="mobile-card-value">{con.added_by}</span>
                        </div>
                        {con.remarks && (
                          <div className="mobile-card-item" style={{ gridColumn: '1 / -1' }}>
                            <span className="mobile-card-label">Remarks</span>
                            <span className="mobile-card-value" style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{con.remarks}</span>
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
      )}

    </>
  );
};

export default Capital;
