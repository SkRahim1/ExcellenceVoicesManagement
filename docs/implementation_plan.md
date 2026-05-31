# EVM Implementation Plan & Development Scope Boundary

This document outlines the strict functional scopes, technical tasks, and development boundaries for building the **Excellence Voices Management (EVM)** application. This document serves as our master roadmap. **We must verify compliance with this plan before starting, during, and after any code development.**

---

## 1. Scope Boundaries (Strict Conformity)

> [!IMPORTANT]
> **Strict Specification Compliance Policy**
> We will implement **ONLY** the items explicitly listed below. Any feature or entity not detailed in the specification is strictly out of scope.

### In-Scope Functional Modules
1. **Authentication Screen**: Logins restricted to approved credentials checked against the `Users` sheet.
2. **Dashboard**: Metrics widgets (Contract Values, Payments, Expenses, Payouts, Capital, Business Summary) + Alerts table for outstanding balances + Recent Activities stream.
3. **School Management**: Profile management for schools, assigning trainers, tracking total contract values.
4. **School Payments**: Purely transaction-based payment logs (supporting partial, extra, and multi-month bundled payments).
5. **Trainer Management**: Trainer directory and active statuses.
6. **Trainer Payments**: Logged payouts per trainer per month.
7. **Expense Management**: Log business expenses strictly limited to the 8 specified categories.
8. **Capital Contributions**: Log partner capital injections (tracked separately from operational revenue).
9. **Reports Hub**: Generate School, Trainer, Expense, Contribution, and Business Summary reports.
10. **Activity Logs**: System audit logs recording the specified actions.
11. **Operations**: Daily backups (30-day retention), weekly Excel export, and historical row archiving.
12. **WhatsApp Integration**: **Manual triggers only** (opens `wa.me` links to pre-fill WhatsApp messages).

### Out-of-Scope (Do NOT Implement)
* ❌ **No Students / Student Management**: No student profiles, student balances, class rosters, grades, or attendance.
* ❌ **No Automatic Payment Gateways**: No integration with Razorpay, Stripe, PayPal, or card networks. Payments are recorded manually.
* ❌ **No Automated WhatsApp API**: No automated Twilio or WhatsApp Business API integration. Reminders must remain manual through user-sent `wa.me` browser templates.

---

## 2. Master Checklist of Development Phases

We will build the application in a series of logical phases, assigning specific tasks to specialized AI Subagents to optimize parallel development:

### Phase 1: Setup & Styling Base (Owner: Agent-UI)
- [ ] Initialize the React project inside the workspace using Vite.
- [ ] Implement the styling system (`index.css`) using custom CSS variables supporting a premium Glassmorphism design and deep dark mode (Slate theme).
- [ ] Set up routing using React Router matching the spec paths.

### Phase 2: Google Sheets Proxy Connector (Owner: Agent-DB)
- [ ] Implement the Apps Script proxy file containing handlers for reading/writing the 8 sheet tables.
- [ ] Implement the client API layer (`googleSheetsApi.js`) connecting the frontend React code to the spreadsheet macros securely.

### Phase 3: Auth & Security Guards (Owner: Agent-SecOps)
- [ ] Create `AuthContext` to handle user login state.
- [ ] Protect routes so only logged-in users can enter.
- [ ] Implement role checking: Partner 1/Manager are permitted to execute Add/Edit actions; Partner 2/Partner 3 are locked to read-only views.

### Phase 4: Core Module UI Development (Owner: Agent-UI)
- [ ] **Dashboard**: Financial charts, alerts table, and the latest 10 activity log streams.
- [ ] **Schools / Payments**: School table grid and the dynamic transactional payment forms.
- [ ] **Trainers / Payouts**: Trainer profiles and payouts registry.
- [ ] **Expenses / Capital**: Standard expense registry forms and capital injection ledger.

### Phase 5: Operations & Export Scripts (Owner: Agent-SecOps)
- [ ] Deploy the daily backup Google Apps Script trigger.
- [ ] Deploy the weekly Excel export Google Apps Script trigger.
- [ ] Set up the archiving logic on the Apps Script backend.

---

## 3. Verification Plan (Owner: Agent-QA)

### Automated/Unit Verification
- Verification that API calls return the precise schemas detailed in the `database_schema.md`.
- Test calculation logic formulas for Available Funds, Net Profit, and Current Cash Position against mock spreadsheet values.

### Manual Verification Checklist
* Sign in with a Partner 2 account and verify that write/edit controls are disabled/hidden.
* Trigger a WhatsApp reminder and confirm the generated browser URL points to `https://wa.me/...` with correct pre-filled values.
* Perform a school payment transaction and confirm it creates a transaction log rather than changing a static "Paid" field.
