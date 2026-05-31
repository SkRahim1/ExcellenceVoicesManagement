# EVM Database Schema Design (Google Sheets Structure)

This document details the column structure, data types, validation rules, and relational links for the 8 Google Sheets used as the database backend for **Excellence Voices Management (EVM)**.

---

## Sheet 1: Schools
This sheet stores information about client schools, contract figures, assigned trainers, and onboarding dates.

| Column Name | Data Type | Validation/Constraints | Description |
| :--- | :--- | :--- | :--- |
| `school_id` | String (UUID or Key) | Unique, Primary Key | Auto-generated unique identifier for the school. |
| `school_name` | String | Required | Official name of the school. |
| `principal_name` | String | Required | Name of the school principal. |
| `coordinator_name`| String | Optional | Name of the program coordinator at the school. |
| `mobile_number` | String | Valid phone format | Coordinator or school contact number. |
| `email` | String | Valid email format | Primary contact email address. |
| `address` | String | Required | Physical address of the school. |
| `trainer_id` | String | Foreign Key -> `Trainers.trainer_id` | ID of the trainer assigned to the school. |
| `contract_amount` | Decimal / Currency | >= 0 | Total contract value for the academic year. |
| `advance_for_books`| Decimal / Currency | >= 0 | Amount paid upfront specifically for books. |
| `recommended_installment`| Decimal / Currency| >= 0 | Suggested recurring installment amount. |
| `remarks` | String | Optional, Free-text | Internal remarks (Remarks Policy). |
| `status` | Enum | `Active`, `Inactive`, `Suspended` | Current status of the school program. |
| `start_date` | Date | `YYYY-MM-DD` | Program start date. |
| `created_date` | DateTime | Auto-set on creation | Creation timestamp. |
| `updated_date` | DateTime | Auto-set on update | Last modification timestamp. |

---

## Sheet 2: School Payments
Tracks actual revenue collection transactions from schools. Payments are purely transaction-based.

| Column Name | Data Type | Validation/Constraints | Description |
| :--- | :--- | :--- | :--- |
| `payment_id` | String (UUID or Key) | Unique, Primary Key | Auto-generated unique transaction ID. |
| `school_id` | String | Foreign Key -> `Schools.school_id` | The school making the payment. |
| `month` | String | Valid Month (e.g., `2026-05`) | The billing month(s) this payment covers. |
| `amount` | Decimal / Currency | > 0 | Amount paid in this transaction. |
| `payment_date` | Date | `YYYY-MM-DD` | Date when the payment was received. |
| `remarks` | String | Optional, Free-text | Transaction remarks (Remarks Policy). |
| `created_by` | String | Foreign Key -> `Users.email` | User who logged this payment. |
| `created_at` | DateTime | Auto-set on creation | Insertion timestamp. |

---

## Sheet 3: Trainers
Stores profiles of educators/trainers who run the program in schools.

| Column Name | Data Type | Validation/Constraints | Description |
| :--- | :--- | :--- | :--- |
| `trainer_id` | String (UUID or Key) | Unique, Primary Key | Auto-generated unique trainer ID. |
| `trainer_name` | String | Required | Full name of the trainer. |
| `mobile` | String | Valid phone format | Mobile number of the trainer. |
| `email` | String | Valid email format | Primary contact email. |
| `joining_date` | Date | `YYYY-MM-DD` | Date the trainer joined Excellence Voices. |
| `status` | Enum | `Active`, `Inactive` | Trainer availability status. |

---

## Sheet 4: Trainer Payments
Logs disbursements made to trainers.

| Column Name | Data Type | Validation/Constraints | Description |
| :--- | :--- | :--- | :--- |
| `payout_id` | String (UUID or Key) | Unique, Primary Key | Auto-generated payout transaction ID. |
| `trainer_id` | String | Foreign Key -> `Trainers.trainer_id` | Trainer receiving the payment. |
| `month` | String | Valid Month (e.g., `2026-05`) | Payout month. |
| `amount` | Decimal / Currency | > 0 | Disbursed amount. |
| `payment_date` | Date | `YYYY-MM-DD` | Date of disbursement. |
| `remarks` | String | Optional, Free-text | Payment notes (Remarks Policy). |
| `created_by` | String | Foreign Key -> `Users.email` | User who logged this payment. |
| `created_at` | DateTime | Auto-set on creation | Log timestamp. |

---

## Sheet 5: Expenses
Tracks company expenses categorized by nature of expenditure.

| Column Name | Data Type | Validation/Constraints | Description |
| :--- | :--- | :--- | :--- |
| `expense_id` | String (UUID or Key) | Unique, Primary Key | Auto-generated expense ID. |
| `category` | Enum | Strict: See categories below | Classification of the expense. |
| `amount` | Decimal / Currency | > 0 | Amount spent. |
| `date` | Date | `YYYY-MM-DD` | Date of the transaction. |
| `remarks` | String | Optional, Free-text | Reason/Notes (Remarks Policy). |
| `added_by` | String | Foreign Key -> `Users.email` | User who recorded the expense. |
| `created_at` | DateTime | Auto-set on creation | Log timestamp. |

### Expense Categories
* `Books`
* `Printing`
* `Travel`
* `Marketing`
* `Certificates`
* `Stationery`
* `Internet`
* `Miscellaneous`

---

## Sheet 6: Activity Logs
Logs all audit events occurring inside the system.

| Column Name | Data Type | Validation/Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | String (UUID or Key) | Unique, Primary Key | Unique log identifier. |
| `date` | Date | `YYYY-MM-DD` | Date of activity. |
| `time` | Time | `HH:MM:SS` | Time of activity. |
| `user` | String | User identifier/email | Person who performed the action. |
| `action` | Enum | Strict: See actions below | Categorized action. |
| `description` | String | Detailed log description | Detailed context of the change. |

### Logged Actions
* `Login`
* `School Added`
* `School Updated`
* `Payment Added`
* `Trainer Payment Added`
* `Expense Added`
* `Contribution Added`
* `Reminder Sent`

---

## Sheet 7: Users
Stores authentication and authorization settings for system access.

| Column Name | Data Type | Validation/Constraints | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | Primary Key, Valid email | Unique email address. |
| `password_hash`| String | Required | Securely hashed password. |
| `role` | Enum | `Partner 1`, `Manager`, `Partner 2`, `Partner 3` | Access role defining editing capability. |
| `status` | Enum | `Active`, `Suspended` | Access status. |

---

## Sheet 8: Capital Contributions
Tracks manual funding/investments injected into the business by the partners.

| Column Name | Data Type | Validation/Constraints | Description |
| :--- | :--- | :--- | :--- |
| `contribution_id`| String (UUID or Key)| Unique, Primary Key | Unique contribution record ID. |
| `partner_name` | String | Required | Name of the contributing partner. |
| `amount` | Decimal / Currency | > 0 | Amount contributed. |
| `date` | Date | `YYYY-MM-DD` | Date of the contribution. |
| `remarks` | String | Optional, Free-text | Remarks (Remarks Policy). |
| `added_by` | String | Foreign Key -> `Users.email` | User who logged the contribution. |
| `created_at` | DateTime | Auto-set on creation | Log timestamp. |

---

## 9. System Operations & Data Lifecycle Sheets

To support corporate compliance, data durability, and historical auditing, the Google Sheets engine includes dedicated sheets and tasks for operations.

### A. Activity Logs
* **Purpose**: Records all auditable user modifications (as described in Sheet 6 above).
* **Retention**: Persistent, never auto-cleared. Maintains the operational history of all transactions and profile changes.

### B. Daily Backups
* **Process**: Automated snapshot of the entire Google Spreadsheet database.
* **Mechanism**: Handled via Google Apps Script Time-driven triggers.
* **Backup Destination**: Google Drive folder dedicated to backups, naming convention: `EVM_Backup_YYYY_MM_DD_HHMM`.
* **Retention Policy**: Keeps daily snapshots for up to 30 days.

### C. Weekly Excel Export
* **Process**: Auto-exports the Google Spreadsheet as an `.xlsx` workbook.
* **Trigger**: Scheduled weekly trigger (e.g., every Sunday night at 23:59).
* **Format**: Standard Microsoft Excel workbook with tabs corresponding to each sheet.
* **Mechanism**: Google Apps Script compiles data and generates a download link or saves it to a designated Drive export folder.

### D. Archive Sheet
* **Purpose**: Stores historical or completed records (e.g. inactive schools, archived trainers, or past fiscal year transactions) to maintain core table performance.
* **Structure**: Mirrors the structure of the primary sheets (`Schools`, `School Payments`, etc.) with an additional column: `archived_date` (DateTime) and `archived_by` (String).
* **Lifecycle**: Triggered manually by Partner 1 / Manager or automatically during year-end closing operations.

