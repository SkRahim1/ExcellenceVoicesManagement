# Excellence Voices Management (EVM)
## Portal Admin & User Manual (Manager Role)

Welcome to the **Excellence Voices Management (EVM)** system. This guide is written specifically for your administrator role to manage the application, sync live data, and monitor the financial logs.

---

## 1. Accessing the Portal

* **Web Portal URL**: [https://management.excellencevoices.in](https://management.excellencevoices.in)
* **Your Login Email**: `raviteja@excellencevoices.in`
* **Access Level**: **Manager** (Full administrative privileges, write/edit permissions)

### First-Time Sign In
1. Open your web browser and navigate to the portal.
2. Enter your email (`raviteja@excellencevoices.in`) and the password created for you in the Firebase console.
3. Once logged in, your active session will be remembered, and your permission token will unlock the editing features across the site.

---

## 2. Managing Schools and Billing Ledgers

As a **Manager**, you have full access to view, add, and modify school records.

### Adding a New School
1. Navigate to the **Schools** page.
2. Click the **+ Add School** button.
3. Fill out the profile fields:
   * **School Name** (e.g. *SREYAS THE SCHOOL*)
   * **Contract Amount (INR)** (e.g. *50000*)
   * **Advance for Books (INR)** (e.g. *5000*)
   * **Installment Recommendation** (e.g. *10000*)
   * **Assigned Trainer** (Select from the dropdown list of active trainers)
   * **Start Date**, **Principal Name**, **Mobile Number**, **Email**, and **Address**
4. Click **Save School**. The system will save it locally and write it immediately to your Google Sheet database.

### Recording a School Payment
1. Select the school in the left-hand directory list.
2. Scroll to the **Payment Transactions** section at the bottom of the school details card.
3. Click **+ Record Payment**.
4. Input the **Billing Month** (e.g. *2026-05*), **Amount**, **Payment Date**, and any **Remarks** (e.g., *1st Installment*).
5. Click **Save Payment**. The system will log the payment, adjust the remaining balance, and sync the transaction to the sheet.

### Modifying past payments
If you make a data-entry mistake while logging a payment:
1. Open the school details card and scroll down to the payments list.
2. Locate the row containing the mistake and click the blue **Edit** button.
3. An inline form will open. Correct the Billing Month, Amount, Date, or Remarks.
4. Click **Save Changes**. The transaction will update, recalculate financial totals, and push the update to your Google Sheet automatically.

---

## 3. Managing Trainers and Expenses

### Trainers Directory
1. Go to the **Trainers** page.
2. Click **+ Add Trainer** to register a new trainer profile.
3. To payout a trainer, select them from the list, click **+ Record Payout**, enter the billing month and payout amount, and save.

### Logging Business Expenses
1. Go to the **Expenses** page.
2. Click **+ Add Expense**.
3. Choose a category (e.g. *Books*, *Printing*, *Travel*, *Internet*, *Miscellaneous*).
4. Enter the amount spent, transaction date, and description remarks.
5. Saving pushes the ledger record to the Google Sheet and updates the Business Summary (P&L) dashboard.

### Partner Capital Contributions
1. Go to the **Capital** page.
2. Click **+ Add Contribution**.
3. Select which partner is injecting funds (*Partner 1*, *Partner 2*, or *Partner 3*), enter the amount, and save.

---

## 4. Reports Hub & Visual Analytics

Navigate to the **Reports Hub** to view generated tables:
* **School Report**: A visual ledger of all 15 partner schools. It tracks contract values, cumulative payments received, and remaining balances owed. 
* **Trainer Report**: Details which trainers are assigned to which schools and their cumulative payouts.
* **Expense / Contribution Reports**: Detailed tables of categories and injected capitals.
* **Business Summary (P&L)**: Displays live Net Operational Profit/Loss margins and renders an interactive donut chart segmenting revenues, payouts, and expenses.

> [!TIP]
> **Mobile Layout Optimization**: 
> The reports hub is built to fit mobile viewports exactly. Column paddings are tight and text wraps on word boundaries to prevent scrollbars or word splitting (e.g. words will not split in half across lines).

---

## 5. Collaborative Notification Center & Background Sync

To keep all team members aligned, the portal includes a **Collaborative Notification Network**:

### Real-Time In-App Toast Alerts
* The portal runs a background sync job every **30 seconds** to fetch updates from Google Sheets.
* If another team member (e.g., a Partner or Manager) makes a change, your screen will automatically refresh, and a **visual Toast popup notification** will slide in from the top-right corner, explaining what action was performed and by whom.
* For your own actions, a green success toast immediately confirms your database writes (e.g., recording a payment or adding a trainer).

### Persistent Notification Bell Dropdown
* A persistent **Notification Bell icon** is located at the bottom of the sidebar on desktop, and in the top-header bar on mobile devices.
* When new updates occur while you are offline or online, a **pink notification badge dot** lights up.
* Clicking the bell displays a dropdown listing the **5 most recent system logs** (who performed what modification and when).
* Clicking the dropdown automatically marks all loaded updates as read, clearing the pink badge.

### Google Apps Script Automated Email Alerts
* You can configure an email recipient in the settings screen to receive automated email notifications.
* Whenever a database-modifying action is performed (e.g. recording a payment, adding a school/trainer, or logging expenses), Google Apps Script triggers an automated email alert summarizing the change details.

---

## 6. Settings Security, Backups, and Excel Exports

The settings panel controls database replication and security configurations.

### Security Access Lock & Passcode Verification
* **Passcode Verification**: The Google Sheets URL and Spreadsheet ID are locked by default to prevent accidental edits. Any partner can click on either input field to prompt for the security passcode (**`ExcellenceSheetUpdate232`**). Upon entering the correct passcode, both fields unlock and can be modified.
* **Unrestricted Fields**: The **Alert Notification Recipient Email** field is fully unlocked and can be edited by any partner at any time without restrictions or passcode requirements.

### Spreadsheet Sync Setup
* **Google Apps Script Web App URL**: Your database backend endpoint connector URL. (Passcode protected)
* **Spreadsheet ID**: The target spreadsheet containing the 8 database tabs. (Passcode protected)
* **Alert Notification Recipient Email**: The email address where automated system change alerts will be sent. (Always editable by anyone)

### Automated Daily Backup
* Every day at **02:00 AM**, a copy of your Google Sheet database is created and saved to your Google Drive backup folder. The script automatically rotates snapshots, keeping the last 30 daily backups.

### Manual Backup (Instant Copy)
1. Go to the **Settings** page.
2. Under the *Data Maintenance Controls* block, click the **Backup Now** button.
3. A snapshot backup copy will be immediately generated on Google Drive.

### Excel Export (Download .xlsx)
1. Navigate to the **Settings** page.
2. Click **Export XLSX**.
3. The system compiles all 8 database sheets and immediately downloads a standard Microsoft Excel `.xlsx` workbook.

---

## 7. Permissions Hierarchy & Security

The portal secures your business calculations through a strict access control layout:

| Role Name | Access Type | Privileges |
| :--- | :--- | :--- |
| **Partner 1** | Read & Write | Add/Modify Schools, Payments, Payouts, Expenses, and Settings (requires passcode) |
| **Manager** (You) | Read & Write | Add/Modify Schools, Payments, Payouts, Expenses, and Settings (requires passcode) |
| **Partner 2** | Read & Write | Add/Modify Schools, Payments, Payouts, Expenses, and Settings (requires passcode) |
| **Partner 3** | Read & Write | Add/Modify Schools, Payments, Payouts, Expenses, and Settings (requires passcode) |

### Technical Security Information
* **Public GitHub Repository**: The website code is hosted publicly on GitHub to enable free pages hosting. **This is completely secure.** No database passwords, spreadsheet keys, or client credentials are saved in the GitHub code repository.
* **Local Settings Cache**: Your specific Sheet ID and connector URLs are saved locally inside your computer browser storage (`localStorage`). No external visitors can access or view your configuration parameters.
* **Database Preservation**: Rest assured that updates, deployments, or upgrades to the code **will never reset your data** or delete your records. The app syncs from your live Google Sheet and preserves all schools, payments, and histories.
