# EVM Access Control & User Guide

This document outlines the user interface structure, system navigation, and access control model for the **Excellence Voices Management (EVM)** application.

---

## 1. Main Navigation Hierarchy

The application features a single sidebar/navigation header with links to all core modules. Access to individual sections is universal (all roles can view all sections), but write privileges are restricted based on roles.

* **Dashboard**: Key metrics, charts, alert systems, and activity feed.
* **Schools**: View school directories, contract details, and assign trainers.
* **Trainers**: Directory of trainers, details, and active statuses.
* **Expenses**: Register and categorize company outlays.
* **Capital Contributions**: Log partner-contributed capital injections.
* **Reports**: Standardized templates for reporting on schools, trainers, expenses, and overall business health.
* **Activity Logs**: Global history audit trail.
* **Settings**: Basic profile options and user management.
* **Logout**: Terminate session.

---

## 2. Permissions Model

The user base is capped at **4 specific users** mapped to **4 roles**.

### Permissions Matrix

| Section / Action | Partner 1 | Manager | Partner 2 | Partner 3 |
| :--- | :--- | :--- | :--- | :--- |
| **View Dashboard** | Yes | Yes | Yes | Yes |
| **View Reports** | Yes | Yes | Yes | Yes |
| **Add / Edit Schools** | Yes | Yes | Yes | Yes |
| **Add School Payments** | Yes | Yes | Yes | Yes |
| **Add / Edit Trainers** | Yes | Yes | Yes | Yes |
| **Add Trainer Payments**| Yes | Yes | Yes | Yes |
| **Add / Edit Expenses** | Yes | Yes | Yes | Yes |
| **Add Contributions** | Yes | Yes | Yes | Yes |
| **Trigger Reminders** | Yes | Yes | Yes | Yes |
| **View Activity Logs** | Yes | Yes | Yes | Yes |

### Edit Access (All Roles: Partner 1, Manager, Partner 2, Partner 3)
* Full read/write control.
* Can create records, update fields, delete items, and process financial inputs.
* Responsible for administrative and collaborative functions.

### View-Only Access (Fallback Roles)
* Users who are not mapped to the specific partner/manager email addresses default to Read-Only access.
* Buttons such as "Add New School", "Record Payment", or "Send Reminder" are hidden, disabled, or prompt an access-denied error.
* Can view pages, filters, reports, and search fields.

---

## 3. Auditing & Activity Logs

To ensure accountability across all 4 users, **every modifying action is recorded** in the `Activity Logs` sheet.

### Standardized Actions

1. **Login**: Logs when a user logs in.
2. **School Added**: Logs the creation of a school profile.
3. **School Updated**: Logs changes to a school profile.
4. **Payment Added**: Logs when a payment is received from a school.
5. **Trainer Payment Added**: Logs payouts made to trainers.
6. **Expense Added**: Logs business expenses.
7. **Contribution Added**: Logs partner capital injections.
8. **Reminder Sent**: Logs when a WhatsApp reminder action is triggered.

### Log Format Example
```json
{
  "date": "2026-05-31",
  "time": "09:15:00",
  "user": "manager@excellencevoices.com",
  "action": "School Updated",
  "description": "Updated Contract Amount for Green Valley School from 50,000 to 55,000."
}
```
---

## 4. Report Specifications

The reporting module generates summaries on-demand:
* **School Report**: Breakdowns of contract values, payments received, and balances per school.
* **Trainer Report**: List of trainers, assigned schools, and cumulative payouts.
* **Expense Report**: Aggregated cost analysis broken down by expense category.
* **Contribution Report**: Injected capital by partner over time.
* **Business Summary Report**: Operational P&L (Profit & Loss) using formulas from the business logic manual.
