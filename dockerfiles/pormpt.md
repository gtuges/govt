You are a senior full-stack engineer + solution architect.

Build an MVP web app for GOVERNMENT (later reusable for a church) that manages:
Mission/Vision → Objectives → Activities → Tasks → Budget Lines → Expenses + Evidence → Progress Reports + M&E (Indicators/Targets/Actuals).
This is a “RBM / Performance Management + Work Planning + Budget & Expenditure + M&E” system.

TECH STACK (use these defaults unless you strongly recommend better):

- Backend: Node.js + Express + TypeScript
- DB: MySQL 8 (with migrations)
- Frontend: React + TypeScript (simple UI, no fancy design needed)
- Auth: JWT + Role-Based Access Control (RBAC)
- File uploads: store locally for MVP (filesystem path in DB), design it so it can later switch to S3.
- Run locally with Docker Compose (api + mysql + optional adminer).

CORE BUSINESS MODEL (must implement this structure):

1. Department creates:

   - Mission (text)
   - Vision (text)
   - Objectives (each objective has a narrative explaining how it supports mission/vision)

2. Under each Objective:

   - Activities (top-level work packages)
   - Each Activity can have Tasks (sub-activities, like hire conference room, buy tickets, etc.)
   - Each Activity has a planned budget (sum of Budget Lines / cost items)
   - Each Budget Line: category, description, qty, unit_cost, total_cost (calculated), currency, notes

3. Spending / claims:

   - Expenses can be entered against a Budget Line or Task
   - Each Expense has: amount, date, vendor, description, reference number, and attachments (invoice/receipt/ticket)
   - Expenses must go through a simple workflow: Draft → Submitted → Reviewed → Approved/Rejected
   - Track approvals (who/when/comment)

4. Accountability / assignments:

   - Users belong to a “home department”
   - But any user can be assigned to other department activities/tasks as:
     - Action Officer (primary accountable)
     - Support Officer (can help)
     - Reviewer / Approver
   - Allow cross-department assistance (a role/user from Dept B can support Dept A’s activity).

5. Monitoring & Evaluation (M&E):

   - Indicators can be linked to Objective and/or Activity
   - Each Indicator has: name, type (number/percent/milestone), baseline (optional), data source, reporting frequency
   - Targets by period (monthly/quarterly/yearly)
   - Actuals by period entered by Action Officer (or M&E role)
   - Progress updates (per period) with:
     - status (Green/Amber/Red OR Not Started/In Progress/Done/Blocked)
     - narrative: progress, outcomes, issues/risks, next steps
     - evidence attachments (optional)

6. Dashboards / Reports (MVP):
   - Budget vs Actual by Department / Objective / Activity
   - Overdue tasks list (by officer + department)
   - “Missing evidence” list (expenses without receipts, or required evidence not attached)
   - Progress summary by Objective (RAG counts)

NON-FUNCTIONAL REQUIREMENTS:

- Use proper relational modeling + foreign keys
- Use transactions where needed (especially for expenses + totals)
- Add audit logging for key records (create/update/status change): who, what, when
- Soft delete for most entities (deleted_at)
- Basic validation and consistent error responses
- Pagination + filtering (by department, period, status, owner)

DELIVERABLES YOU MUST OUTPUT:
A) A domain model explanation (entities + relationships) in simple terms
B) A MySQL schema (DDL) + migration plan
C) Suggested folder structure for backend and frontend
D) REST API design (endpoint list + example request/response JSON)
E) Minimal UI pages list (routes) and what each page does
F) Docker Compose file (mysql + api + optional adminer) + env examples
G) Seed data script for a demo department, users, and a sample objective/activity/budget/expense
H) A step-by-step “how to run” README

IMPORTANT:

- Keep the MVP buildable and consistent.
- Make reasonable assumptions when something is not specified, but state them clearly.
- Prefer clean, boring solutions over complex frameworks.
