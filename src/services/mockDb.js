const SEED_SCHOOLS_LIST = [
  "SREYAS THE SCHOOL",
  "LFG DIGI HIGH SCHOOL",
  "SRI GOUTHAMI",
  "VASHISTHA BOLLARAM",
  "VASHISTHA CHITKUL",
  "VASHISTHA RAMPALLY",
  "VASHISTHA KOLLURU",
  "SANGAMITHRA MANIKONDA",
  "VASHISTHA INDRESAM",
  "SHREE VAAGDEVI -1",
  "SHREE VAAGDEVI -2",
  "GLORIOUS",
  "KVR",
  "GEETHANJALI",
  "JEEVAN JYOTHI"
];

const SEED_DATA = {
  schools: [],
  payments: [],
  trainers: [],
  trainerPayments: [],
  expenses: [],
  contributions: [],
  logs: [
    {
      log_id: 'log_1',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      user: 'System',
      action: 'Database Initialized',
      description: 'Cleared seed data and initialized database with empty profile registry.'
    }
  ]
};

// Initialize Mock database in Local Storage if not present
const getDb = () => {
  const data = localStorage.getItem('evm_db');
  if (!data) {
    localStorage.setItem('evm_db', JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  try {
    const db = JSON.parse(data);
    // If the database contains any default seed schools or mock schools, filter them out to preserve user's manually added schools!
    const hasSeedSchools = db.schools && db.schools.some(s => 
      SEED_SCHOOLS_LIST.includes(s.school_name) || s.school_name === 'Green Valley School'
    );
    if (hasSeedSchools) {
      // Keep only schools that are NOT default seed schools or mock schools
      const manuallyAddedSchools = db.schools.filter(s => 
        !SEED_SCHOOLS_LIST.includes(s.school_name) && s.school_name !== 'Green Valley School'
      );
      
      const manuallyAddedSchoolIds = new Set(manuallyAddedSchools.map(s => s.school_id));
      
      // Clean payments associated with deleted seed schools, preserving others
      const remainingPayments = (db.payments || []).filter(p => manuallyAddedSchoolIds.has(p.school_id));
      
      db.schools = manuallyAddedSchools;
      db.payments = remainingPayments;
      
      localStorage.setItem('evm_db', JSON.stringify(db));
    }
    return db;
  } catch (e) {
    localStorage.setItem('evm_db', JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
};

const saveDb = (db) => {
  localStorage.setItem('evm_db', JSON.stringify(db));
};

// Retrieve active session user email
const getActiveUserEmail = () => {
  const storedUser = sessionStorage.getItem('evm_user');
  if (storedUser) {
    try {
      return JSON.parse(storedUser).email;
    } catch (e) {
      return 'System';
    }
  }
  return 'System';
};

// background worker to POST row updates to Apps Script proxy
const syncPost = async (action, sheet, data, idKey = null, idValue = null) => {
  const gasUrl = localStorage.getItem('evm_gas_url');
  if (!gasUrl || gasUrl.includes('EVM_PROX_Deployment_ID')) return;
  
  try {
    const body = {
      action,
      sheet,
      data
    };
    if (idKey && idValue) {
      body.idKey = idKey;
      body.idValue = idValue;
    }
    body.userId = getActiveUserEmail();
    
    // Read user-defined alert notification email from Settings
    const alertEmail = localStorage.getItem('evm_alert_email');
    if (alertEmail) {
      body.alertEmail = alertEmail;
    }
    
    await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain' // Bypass CORS preflight OPTIONS check!
      },
      body: JSON.stringify(body)
    });
  } catch (e) {
    console.error(`Failed to post sync to ${sheet}:`, e);
  }
};

export const mockDb = {
  // Pull database updates from Google Sheets backend on boot
  syncData: async () => {
    const gasUrl = localStorage.getItem('evm_gas_url');
    if (!gasUrl || gasUrl.includes('EVM_PROX_Deployment_ID')) {
      console.log('Google Sheets sync not configured. Operating in local-only storage mode.');
      return { success: false, error: 'Not Configured' };
    }
    try {
      const response = await fetch(`${gasUrl}?action=readAll`);
      const result = await response.json();
      if (result.success && result.data) {
        // Load current logs map before overwriting to find new entries
        const oldDb = getDb();
        const oldLogsMap = {};
        if (oldDb && oldDb.logs) {
          oldDb.logs.forEach(l => { oldLogsMap[l.log_id] = true; });
        }

        // Cache the latest synced payload
        localStorage.setItem('evm_db', JSON.stringify(result.data));

        // Dispatch general DB update event for active views to reload
        window.dispatchEvent(new Event('evm_db_updated'));

        // Find if there are new activity logs registered by other users
        const activeUser = getActiveUserEmail();
        let newLogs = [];
        if (result.data.logs) {
          newLogs = result.data.logs.filter(l => !oldLogsMap[l.log_id] && l.user.toLowerCase() !== activeUser.toLowerCase());
        }

        // Raise a window event for the notification UI components and Toasts to consume
        if (newLogs.length > 0) {
          const event = new CustomEvent('evm_new_logs', { detail: { newLogs } });
          window.dispatchEvent(event);
        }

        return { success: true, newLogsCount: newLogs.length, newLogs };
      }
      return { success: false, error: 'Sync failed on server' };
    } catch (e) {
      console.error('Failed to sync data from Google Sheets API:', e);
      return { success: false, error: e.toString() };
    }
  },

  // Read Lists
  getSchools: () => getDb().schools,
  getPayments: () => getDb().payments,
  getTrainers: () => getDb().trainers,
  getTrainerPayments: () => getDb().trainerPayments,
  getExpenses: () => getDb().expenses,
  getContributions: () => getDb().contributions,
  getLogs: () => getDb().logs,

  // Create Operations with replication
  addSchool: (schoolData) => {
    const db = getDb();
    const newSchool = {
      ...schoolData,
      school_id: `sch_${Date.now()}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    db.schools.push(newSchool);
    
    // Log action
    const newLog = {
      log_id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      user: getActiveUserEmail(),
      action: 'School Added',
      description: `Added school profile for ${newSchool.school_name}`
    };
    db.logs.unshift(newLog);

    saveDb(db);

    // Async sync to Google Sheets
    syncPost('addRow', 'schools', newSchool);
    syncPost('addRow', 'logs', newLog);

    return newSchool;
  },

  updateSchool: (schoolId, schoolData) => {
    const db = getDb();
    const index = db.schools.findIndex(s => s.school_id === schoolId);
    if (index !== -1) {
      db.schools[index] = {
        ...db.schools[index],
        ...schoolData,
        updated_date: new Date().toISOString()
      };

      // Log action
      const newLog = {
        log_id: `log_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        user: getActiveUserEmail(),
        action: 'School Updated',
        description: `Updated profile details for school: ${db.schools[index].school_name}`
      };
      db.logs.unshift(newLog);

      saveDb(db);

      // Async sync to Google Sheets
      syncPost('updateRow', 'schools', db.schools[index], 'school_id', schoolId);
      syncPost('addRow', 'logs', newLog);

      return db.schools[index];
    }
    throw new Error('School not found');
  },

  addPayment: (paymentData) => {
    const db = getDb();
    const newPayment = {
      ...paymentData,
      payment_id: `pay_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: getActiveUserEmail()
    };
    db.payments.push(newPayment);

    // Fetch school name
    const school = db.schools.find(s => s.school_id === paymentData.school_id);
    const schoolName = school ? school.school_name : 'Unknown';

    // Log action
    const newLog = {
      log_id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      user: newPayment.created_by,
      action: 'Payment Added',
      description: `Logged school payment of $${newPayment.amount} for ${schoolName}`
    };
    db.logs.unshift(newLog);

    saveDb(db);

    // Async sync to Google Sheets
    syncPost('addRow', 'payments', newPayment);
    syncPost('addRow', 'logs', newLog);

    return newPayment;
  },

  updatePayment: (paymentId, paymentData) => {
    const db = getDb();
    const index = db.payments.findIndex(p => p.payment_id === paymentId);
    if (index !== -1) {
      const oldAmount = db.payments[index].amount;
      db.payments[index] = {
        ...db.payments[index],
        ...paymentData,
        updated_at: new Date().toISOString()
      };
      
      const school = db.schools.find(s => s.school_id === db.payments[index].school_id);
      const schoolName = school ? school.school_name : 'Unknown';

      const newLog = {
        log_id: `log_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        user: getActiveUserEmail(),
        action: 'Payment Updated',
        description: `Updated payment details for ${schoolName} (Amount changed from $${oldAmount} to $${db.payments[index].amount})`
      };
      db.logs.unshift(newLog);

      saveDb(db);

      // Async sync to Google Sheets
      syncPost('updateRow', 'payments', db.payments[index], 'payment_id', paymentId);
      syncPost('addRow', 'logs', newLog);

      return db.payments[index];
    }
    throw new Error('Payment not found');
  },

  addTrainer: (trainerData) => {
    const db = getDb();
    const newTrainer = {
      ...trainerData,
      trainer_id: `tr_${Date.now()}`
    };
    db.trainers.push(newTrainer);

    // Log action
    const newLog = {
      log_id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      user: getActiveUserEmail(),
      action: 'Trainer Added',
      description: `Created trainer profile for ${newTrainer.trainer_name}`
    };
    db.logs.unshift(newLog);

    saveDb(db);

    // Async sync to Google Sheets
    syncPost('addRow', 'trainers', newTrainer);
    syncPost('addRow', 'logs', newLog);

    return newTrainer;
  },

  addTrainerPayment: (payoutData) => {
    const db = getDb();
    const newPayout = {
      ...payoutData,
      payout_id: `po_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: getActiveUserEmail()
    };
    db.trainerPayments.push(newPayout);

    // Fetch trainer name
    const trainer = db.trainers.find(t => t.trainer_id === payoutData.trainer_id);
    const trainerName = trainer ? trainer.trainer_name : 'Unknown';

    // Log action
    const newLog = {
      log_id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      user: newPayout.created_by,
      action: 'Trainer Payout Added',
      description: `Paid $${newPayout.amount} to trainer ${trainerName} for month ${newPayout.month}`
    };
    db.logs.unshift(newLog);

    saveDb(db);

    // Async sync to Google Sheets
    syncPost('addRow', 'trainerPayments', newPayout);
    syncPost('addRow', 'logs', newLog);

    return newPayout;
  },

  addExpense: (expenseData) => {
    const db = getDb();
    const newExpense = {
      ...expenseData,
      expense_id: `exp_${Date.now()}`,
      created_at: new Date().toISOString(),
      added_by: getActiveUserEmail()
    };
    db.expenses.push(newExpense);

    // Log action
    const newLog = {
      log_id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      user: newExpense.added_by,
      action: 'Expense Added',
      description: `Logged expense of $${newExpense.amount} under category ${newExpense.category}`
    };
    db.logs.unshift(newLog);

    saveDb(db);

    // Async sync to Google Sheets
    syncPost('addRow', 'expenses', newExpense);
    syncPost('addRow', 'logs', newLog);

    return newExpense;
  },

  addContribution: (contributionData) => {
    const db = getDb();
    const newContribution = {
      ...contributionData,
      contribution_id: `con_${Date.now()}`,
      created_at: new Date().toISOString(),
      added_by: getActiveUserEmail()
    };
    db.contributions.push(newContribution);

    // Log action
    const newLog = {
      log_id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      user: newContribution.added_by,
      action: 'Contribution Added',
      description: `Recorded capital contribution of $${newContribution.amount} from partner ${newContribution.partner_name}`
    };
    db.logs.unshift(newLog);

    saveDb(db);

    // Async sync to Google Sheets
    syncPost('addRow', 'contributions', newContribution);
    syncPost('addRow', 'logs', newLog);

    return newContribution;
  },

  logAction: (action, description) => {
    const db = getDb();
    const newLog = {
      log_id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      user: getActiveUserEmail(),
      action,
      description
    };
    db.logs.unshift(newLog);
    saveDb(db);

    // Async sync to Google Sheets
    syncPost('addRow', 'logs', newLog);
  }
};
