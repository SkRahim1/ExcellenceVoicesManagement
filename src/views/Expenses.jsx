import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';

const Expenses = () => {
  const { hasEditPermission } = useAuth();
  
  // Lists
  const [expenses, setExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form Inputs
  const [category, setCategory] = useState('Books');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const loadData = () => {
    setExpenses(mockDb.getExpenses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Strictly defined expense categories in specification
  const CATEGORIES = [
    'Books',
    'Printing',
    'Travel',
    'Marketing',
    'Certificates',
    'Stationery',
    'Internet',
    'Miscellaneous'
  ];

  // Submit Handler
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!hasEditPermission) return;

    mockDb.addExpense({
      category,
      amount: Number(amount || 0),
      date,
      remarks
    });

    window.dispatchEvent(new CustomEvent('evm_toast', {
      detail: { type: 'success', message: `Expense of $${amount} under "${category}" recorded successfully.` }
    }));

    // Reset Form
    setCategory('Books');
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
          <h1 className="page-title">Expense Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Record and categorize corporate outlays.
          </p>
        </div>
        {hasEditPermission && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary" style={{ backgroundColor: 'var(--color-pink)' }}>
            + Log Business Expense
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Log Expense</h3>
            <button onClick={() => setShowAddForm(false)} className="btn btn-secondary btn-small">Cancel</button>
          </div>

          <form onSubmit={handleAddExpense}>
            <div className="form-group">
              <label className="form-label">Expense Category*</label>
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', backgroundColor: 'var(--color-pink)' }}>
              Log Expense
            </button>
          </form>
        </div>
      )}

      {!showAddForm && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Operational Outlays List</h3>
          
          <div className="table-container">
            {expenses.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1.5rem 0' }}>No business expenses recorded.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                    <th>Logged By</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.expense_id}>
                      <td data-label="Date">{exp.date}</td>
                      <td data-label="Category" style={{ fontWeight: 600, color: 'var(--color-pink)' }}>{exp.category}</td>
                      <td data-label="Amount" style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                      <td data-label="Remarks" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{exp.remarks}</td>
                      <td data-label="Logged By" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.added_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Expenses;
