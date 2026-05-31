# EVM Business Logic & Calculation Manual

This document details the financial metrics, transaction rules, validation workflows, and messaging structures required for the **Excellence Voices Management (EVM)** application.

---

## 1. Key Performance Indicators (KPIs) & Financial Metrics

The dashboard relies on calculated figures computed from transactions logged across different sheets. Below are the formulas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          OPERATIONAL REVENUE                           │
└────────────────────────────────────────────────────────────────────────┘
  Total Contract Value  = SUM(Schools.contract_amount)
  Revenue Received      = SUM(SchoolPayments.amount)
  Outstanding Revenue   = Total Contract Value - Revenue Received

┌────────────────────────────────────────────────────────────────────────┐
│                            TRAINER PAYOUTS                             │
└────────────────────────────────────────────────────────────────────────┘
  Total Trainer Paid    = SUM(TrainerPayments.amount)

┌────────────────────────────────────────────────────────────────────────┐
│                           BUSINESS EXPENSES                            │
└────────────────────────────────────────────────────────────────────────┘
  Business Expenses     = SUM(Expenses.amount)

┌────────────────────────────────────────────────────────────────────────┐
│                          CAPITAL CONTRIBUTIONS                         │
└────────────────────────────────────────────────────────────────────────┘
  Capital Contributions = SUM(CapitalContributions.amount)

┌────────────────────────────────────────────────────────────────────────┐
│                            BUSINESS SUMMARY                            │
└────────────────────────────────────────────────────────────────────────┘
  Available Funds       = Revenue Received + Capital Contributions
  Current Cash Position = Revenue Received + Capital Contributions 
                          - Total Trainer Paid - Business Expenses
  Net Profit            = Revenue Received - Total Trainer Paid - Business Expenses
```

> [!WARNING]
> **Capital Contributions are NOT revenue.**
> They must be tracked separately and never included in standard Net Profit calculations. However, they directly increase **Available Funds** and **Current Cash Position**.

---

## 2. School Payments Transaction Rules

To prevent issues common to traditional spreadsheet tracking, school payments do not use static `Paid/Pending` fields on the school profile. Instead, all collections are logged in a separate transaction list.

### Core Payment Rules
1. **Partial Payments**: Schools can make payments of any amount lower than the installment target or contract balance.
2. **Extra Payments**: Overpayments are supported and will reduce the overall outstanding balance.
3. **Multi-Month Bundling**: A single transaction can cover multiple months (e.g. paying for June, July, and August at once).
   * *Implementation*: The `month` field can store a comma-separated list of months (e.g., `2026-06, 2026-07`) or a separate log entry can be split automatically.

---

## 3. Manual WhatsApp Reminder Flow

If a school has an outstanding balance, an alert is shown on the dashboard prompting the user to send a reminder.

### Flow Details
1. **Trigger**: An outstanding balance is detected:
   $$\text{Outstanding Balance} = \text{Contract Amount} - \text{Total Payments Received for School}$$
2. **Action**: The user clicks the **Send Reminder** button.
3. **URL Generation**: The application formats a WhatsApp API link:
   ```
   https://wa.me/<mobile_number>?text=<urlencoded_message>
   ```
4. **Message Template**:
   ```
   Hello Principal/Coordinator of [School Name],

   We hope you are doing well. This is a friendly reminder regarding the outstanding balance of [Outstanding Balance] for the Excellence Voices program.

   Please find the payment details below:
   - Total Contract: [Contract Amount]
   - Total Received to Date: [Revenue Received for School]
   - Remaining Balance: [Outstanding Balance]

   Thank you,
   Excellence Voices Management Team
   ```
5. **Execution**: The browser opens WhatsApp Web (or the WhatsApp mobile app), pre-fills the message, and leaves the final click to the user (manual action).

---

## 4. Remarks Policy

A manual, free-text `remarks` field is required to allow human adjustments and context logging. 

* **Required In**:
  * Schools
  * School Payments
  * Trainer Payments
  * Expenses
  * Capital Contributions
* **Guidelines**: No character limits or structure constraints; allows free-form text input to keep records clear and understandable.

---

## 5. Data Lifecycle & Maintenance Logic

### A. Backup Logic (Daily Snapshots)
* **Trigger Schedule**: Time-driven execution every day at 02:00 AM (local time).
* **Processing Rules**:
  1. Fetch active Google Spreadsheet ID.
  2. Duplicate the spreadsheet instance using the Drive API.
  3. Rename the copy using the standard format: `EVM_Backup_YYYY_MM_DD`.
  4. Move the copy to the designated `/Backups` folder.
  5. Audit Retention Limit: If number of backups > 30, delete the oldest file.

### B. Weekly Excel Export Logic
* **Trigger Schedule**: Every Sunday at 23:59 PM.
* **Processing Rules**:
  1. Package all spreadsheet sheets dynamically.
  2. Perform an export conversion to the standard Microsoft Excel format `.xlsx`.
  3. Save the exported workbook to `/Exports` folder with file format `EVM_Weekly_Export_YYYY_WW.xlsx` (where WW is the week number).
  4. Generate and send a notification link to the Dashboard/Activity Logs.

### C. Archiving Logic
To maintain front-end performance, historical or closed items are migrated to the `Archive Sheet`.
* **Archiving Criteria**:
  * **Schools**: Status is set to `Inactive` or program has been concluded for > 12 months.
  * **Trainer Payments & Expenses**: Older than 2 fiscal years.
* **Archiving Process Flow**:
  1. Copy the target row(s) to the corresponding `Archive` sheet tables.
  2. Populate the archiving metadata columns: `archived_date` (current DateTime) and `archived_by` (email of the current active user).
  3. Confirm write operation in the Archive sheet.
  4. Delete the source row from the primary working sheet.
  5. Log the action in the `Activity Logs` sheet: `[User] archived [Record ID] from [Sheet Name]`.

