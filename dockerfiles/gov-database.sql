-- =========================================================
--  CORE ORG (PLURAL TABLE NAMES)
--  PK/FK columns use your style: id_<singular>
-- =========================================================

-- Purpose: Represents the top-level organization (e.g., a specific government body or agency).
-- Relationships: Parent to departments, users, and most other entities.
CREATE TABLE orgs (
  id_org BIGINT PRIMARY KEY AUTO_INCREMENT,
  org_name VARCHAR(200) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Represents major functional divisions within an organization (e.g., HR, Finance, Health).
-- Relationships: Child of orgs. Parent to branches, department_plans, and department_roles.
CREATE TABLE departments (
  id_department BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_org BIGINT NOT NULL,
  department_name VARCHAR(200) NOT NULL,
  department_code VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_departments_orgs FOREIGN KEY (id_org) REFERENCES orgs(id_org)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Represents sub-divisions within a department that implement specific functions (e.g., Clinical Services under Health).
-- Relationships: Child of departments. Parent to units and activities. Linked to department_roles.
CREATE TABLE branches (
  id_branch BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_department BIGINT NOT NULL,
  id_parent_branch BIGINT NULL, -- For hierarchy (e.g. Office of Secretary -> Division)
  branch_name VARCHAR(200) NOT NULL,
  branch_code VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_branches_departments FOREIGN KEY (id_department) REFERENCES departments(id_department),
  CONSTRAINT fk_branches_parent FOREIGN KEY (id_parent_branch) REFERENCES branches(id_branch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Represents the smallest functional teams within a branch.
-- Relationships: Child of branches.
CREATE TABLE units (
  id_unit BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_branch BIGINT NOT NULL,
  unit_name VARCHAR(200) NOT NULL,
  unit_code VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_units_branches FOREIGN KEY (id_branch) REFERENCES branches(id_branch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Stores system users who can log in and perform actions.
-- Relationships: Linked to orgs and optionally departments. Referenced by audit logs, assignments, and creator fields.
CREATE TABLE users (
  id_user BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_org BIGINT NOT NULL,
  id_department BIGINT NULL, -- home department (optional)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  mobile_number VARCHAR(20) NULL, -- optional mobile/phone number
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  profile_image_path VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_users_email (id_org, email),
  KEY idx_users_department (id_department),
  CONSTRAINT fk_users_orgs FOREIGN KEY (id_org) REFERENCES orgs(id_org),
  CONSTRAINT fk_users_departments FOREIGN KEY (id_department) REFERENCES departments(id_department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
--  LOOKUPS (Statuses + Budget Categories + Assignment Roles)
-- =========================================================
-- Purpose: Defines categories of statuses (e.g., PLAN, ACTIVITY, TASK) to group status values.
-- Relationships: Parent to status_values.
CREATE TABLE status_types (
  id_status_type BIGINT PRIMARY KEY AUTO_INCREMENT,
  status_type_code VARCHAR(50) NOT NULL, -- PLAN, OBJECTIVE, ACTIVITY, TASK, EXPENSE, REPORT...
  status_type_name VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_status_types_code (status_type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Defines specific status options (e.g., DRAFT, APPROVED, IN_PROGRESS) for each status type.
-- Relationships: Child of status_types. Referenced by plans, objectives, activities, tasks, etc.
CREATE TABLE status_values (
  id_status_value BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_status_type BIGINT NOT NULL,
  status_code VARCHAR(50) NOT NULL,
  status_name VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_status_values (id_status_type, status_code),
  CONSTRAINT fk_status_values_types FOREIGN KEY (id_status_type) REFERENCES status_types(id_status_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Defines categories for budget lines (e.g., Travel, Equipment, Personnel).
-- Relationships: Referenced by budget_lines.
CREATE TABLE budget_categories (
  id_budget_category BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_org BIGINT NOT NULL,
  category_name VARCHAR(100) NOT NULL, -- Travel, Venue, Catering...
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_budget_categories (id_org, category_name),
  CONSTRAINT fk_budget_categories_orgs FOREIGN KEY (id_org) REFERENCES orgs(id_org)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Defines the types of assignments a role can have on an activity/task (e.g., Responsible, Accountable).
-- Relationships: Referenced by activity_assignments and task_assignments.
CREATE TABLE assignment_role_types (
  id_assignment_role_type BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_code VARCHAR(50) NOT NULL,  -- ACTION_OFFICER / SUPPORT / REVIEWER / APPROVER
  role_name VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_assignment_role_types_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
--  ROLE SCHEME (Role Types -> Department Roles -> Holders)
-- =========================================================
-- Purpose: Defines functional role templates (e.g., Manager, Planner, Clerk).
-- Relationships: Parent to department_roles.
CREATE TABLE role_types (
  id_role_type BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_type_code VARCHAR(50) NOT NULL,  -- PLANNER, DEPT_HEAD, M_E, APPROVER...
  role_type_name VARCHAR(100) NOT NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_role_types_code (role_type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Defines specific role instances within a department or branch (e.g., "Health Dept Manager").
-- Relationships: Links role_types to departments/branches. Supports hierarchy via parent_role_id. Parent to department_role_holders.
CREATE TABLE department_roles (
  id_department_role BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_org BIGINT NOT NULL,
  id_department BIGINT NOT NULL,
  id_branch BIGINT NULL, -- optional link to branch
-- Purpose: Assigns actual users to department roles for a specific time period.
-- Relationships: Links users to department_roles.
CREATE TABLE department_role_holders (
  id_department_role_holder BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_department_role BIGINT NOT NULL,
  id_user BIGINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL DEFAULT '9999-12-31',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_department_role_holders_current (id_department_role, end_date),
  KEY idx_department_role_holders_user (id_user),
  CONSTRAINT fk_department_role_holders_roles FOREIGN KEY (id_department_role) REFERENCES department_roles(id_department_role),
  CONSTRAINT fk_department_role_holders_users FOREIGN KEY (id_user) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
--  PLANNING
-- =========================================================
-- Purpose: Defines the fiscal or strategic planning periods (e.g., FY2025).
-- Relationships: Referenced by department_plans.
CREATE TABLE plan_periods (
  id_plan_period BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_org BIGINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_plan_periods_orgs FOREIGN KEY (id_org) REFERENCES orgs(id_org)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Represents the high-level strategic plan for a department within a specific period.
-- Relationships: Child of departments and plan_periods. Parent to objectives.
CREATE TABLE department_plans (
  id_department_plan BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_org BIGINT NOT NULL,
  id_department BIGINT NOT NULL,
  id_plan_period BIGINT NOT NULL,
  mission TEXT NOT NULL,
  vision TEXT NOT NULL,
  id_status_value BIGINT NOT NULL, -- status_types: PLAN
  created_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_department_plans (id_department, id_plan_period),
  KEY idx_department_plans_status (id_status_value),
  CONSTRAINT fk_department_plans_orgs FOREIGN KEY (id_org) REFERENCES orgs(id_org),
  CONSTRAINT fk_department_plans_departments FOREIGN KEY (id_department) REFERENCES departments(id_department),
  CONSTRAINT fk_department_plans_plan_periods FOREIGN KEY (id_plan_period) REFERENCES plan_periods(id_plan_period),
  CONSTRAINT fk_department_plans_status_values FOREIGN KEY (id_status_value) REFERENCES status_values(id_status_value),
  CONSTRAINT fk_department_plans_created_by FOREIGN KEY (created_by) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Defines specific strategic goals within a department plan.
-- Relationships: Child of department_plans. Parent to activities.  created_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_department_plans (id_department, id_plan_period),
  KEY idx_department_plans_status (id_status_value),
  CONSTRAINT fk_department_plans_orgs FOREIGN KEY (id_org) REFERENCES orgs(id_org),
  CONSTRAINT fk_department_plans_departments FOREIGN KEY (id_department) REFERENCES departments(id_department),
  CONSTRAINT fk_department_plans_plan_periods FOREIGN KEY (id_plan_period) REFERENCES plan_periods(id_plan_period),
  CONSTRAINT fk_department_plans_status_values FOREIGN KEY (id_status_value) REFERENCES status_values(id_status_value),
  CONSTRAINT fk_department_plans_created_by FOREIGN KEY (created_by) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE objectives (
  id_objective BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_department_plan BIGINT NOT NULL,
  objective_title VARCHAR(300) NOT NULL,
  objective_narrative TEXT NOT NULL,
  id_department_owner BIGINT NOT NULL,
  id_status_value BIGINT NOT NULL, -- status_types: OBJECTIVE
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  KEY idx_objectives_owner (id_department_owner),
  KEY idx_objectives_status (id_status_value),
-- Purpose: Represents actionable steps to achieve an objective. Linked to a specific branch for implementation.
-- Relationships: Child of objectives. Linked to branches. Parent to tasks and budget_lines.
CREATE TABLE activities (
  id_activity BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_objective BIGINT NOT NULL,
  id_branch BIGINT NULL, -- implementing branch
  activity_title VARCHAR(300) NOT NULL,
  activity_description TEXT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  id_status_value BIGINT NOT NULL, -- status_types: ACTIVITY
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  KEY idx_activities_objective (id_objective),
  KEY idx_activities_status (id_status_value),
  CONSTRAINT fk_activities_objectives FOREIGN KEY (id_objective) REFERENCES objectives(id_objective),
  CONSTRAINT fk_activities_branches FOREIGN KEY (id_branch) REFERENCES branches(id_branch),
  CONSTRAINT fk_activities_status_values FOREIGN KEY (id_status_value) REFERENCES status_values(id_status_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Represents granular work items required to complete an activity.
-- Relationships: Child of activities. Parent to expenses (optional).
CREATE TABLE tasks (
  id_task BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_activity BIGINT NOT NULL,
  task_title VARCHAR(300) NOT NULL,
  task_description TEXT NULL,
  due_date DATE NULL,
  id_status_value BIGINT NOT NULL, -- status_types: TASK
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  KEY idx_tasks_activity (id_activity),
  KEY idx_tasks_due (due_date),
  KEY idx_tasks_status (id_status_value),
  CONSTRAINT fk_tasks_activities FOREIGN KEY (id_activity) REFERENCES activities(id_activity),
  CONSTRAINT fk_tasks_status_values FOREIGN KEY (id_status_value) REFERENCES status_values(id_status_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
--  ASSIGNMENTS (Assigned to Department Roles, not directly to Users)
-- =========================================================
-- Purpose: Assigns responsibility for an activity to a specific department role.
-- Relationships: Links activities to department_roles.
CREATE TABLE activity_assignments (
  id_activity_assignment BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_activity BIGINT NOT NULL,
  id_department_role BIGINT NOT NULL,
  id_assignment_role_type BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_activity_assignments (id_activity, id_department_role, id_assignment_role_type),
  KEY idx_activity_assignments_role (id_department_role),
  CONSTRAINT fk_activity_assignments_activities FOREIGN KEY (id_activity) REFERENCES activities(id_activity),
  CONSTRAINT fk_activity_assignments_department_roles FOREIGN KEY (id_department_role) REFERENCES department_roles(id_department_role),
  CONSTRAINT fk_activity_assignments_assignment_role_types FOREIGN KEY (id_assignment_role_type) REFERENCES assignment_role_types(id_assignment_role_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Assigns responsibility for a task to a specific department role.
-- Relationships: Links tasks to department_roles.  id_assignment_role_type BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_activity_assignments (id_activity, id_department_role, id_assignment_role_type),
  KEY idx_activity_assignments_role (id_department_role),
  CONSTRAINT fk_activity_assignments_activities FOREIGN KEY (id_activity) REFERENCES activities(id_activity),
  CONSTRAINT fk_activity_assignments_department_roles FOREIGN KEY (id_department_role) REFERENCES department_roles(id_department_role),
  CONSTRAINT fk_activity_assignments_assignment_role_types FOREIGN KEY (id_assignment_role_type) REFERENCES assignment_role_types(id_assignment_role_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Defines estimated costs for an activity, categorized by budget type.
-- Relationships: Child of activities. Parent to expenses.
CREATE TABLE budget_lines (
  id_budget_line BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_activity BIGINT NOT NULL,
  id_budget_category BIGINT NOT NULL,
  line_description VARCHAR(300) NOT NULL,
  qty DECIMAL(12,2) NOT NULL DEFAULT 1,
  unit_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'PGK',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  KEY idx_budget_lines_activity (id_activity),
  CONSTRAINT fk_budget_lines_activities FOREIGN KEY (id_activity) REFERENCES activities(id_activity),
  CONSTRAINT fk_budget_lines_budget_categories FOREIGN KEY (id_budget_category) REFERENCES budget_categories(id_budget_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Records actual expenditure against a budget line or task.
-- Relationships: Child of budget_lines. Optionally linked to tasks. Parent to expense_files and expense_status_histories.
CREATE TABLE expenses (
  id_expense BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_budget_line BIGINT NOT NULL,
  id_task BIGINT NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'PGK',
  vendor VARCHAR(200) NULL,
  expense_date DATE NOT NULL,
  expense_description VARCHAR(300) NULL,
  reference_no VARCHAR(120) NULL,
  id_status_value BIGINT NOT NULL, -- status_types: EXPENSE
  submitted_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  KEY idx_expenses_budget_line (id_budget_line),
  KEY idx_expenses_status (id_status_value),
  CONSTRAINT fk_expenses_budget_lines FOREIGN KEY (id_budget_line) REFERENCES budget_lines(id_budget_line),
  CONSTRAINT fk_expenses_tasks FOREIGN KEY (id_task) REFERENCES tasks(id_task),
  CONSTRAINT fk_expenses_status_values FOREIGN KEY (id_status_value) REFERENCES status_values(id_status_value),
  CONSTRAINT fk_expenses_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Tracks the approval workflow history of an expense (e.g., Submitted -> Approved).
-- Relationships: Child of expenses.
CREATE TABLE expense_status_histories (
  id_expense_status_history BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_expense BIGINT NOT NULL,
  id_status_value BIGINT NOT NULL,
  changed_by BIGINT NOT NULL,
  change_comment TEXT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_expense_status_histories_expense (id_expense),
  CONSTRAINT fk_expense_status_histories_expenses FOREIGN KEY (id_expense) REFERENCES expenses(id_expense),
  CONSTRAINT fk_expense_status_histories_status_values FOREIGN KEY (id_status_value) REFERENCES status_values(id_status_value),
  CONSTRAINT fk_expense_status_histories_users FOREIGN KEY (changed_by) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Stores file attachments (receipts, invoices) related to an expense.
-- Relationships: Child of expenses.
CREATE TABLE expense_files (
  id_expense_file BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_org BIGINT NOT NULL,
  id_expense BIGINT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_by BIGINT NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_expense_files_expense (id_expense),
  CONSTRAINT fk_expense_files_orgs FOREIGN KEY (id_org) REFERENCES orgs(id_org),
  CONSTRAINT fk_expense_files_expenses FOREIGN KEY (id_expense) REFERENCES expenses(id_expense),
  CONSTRAINT fk_expense_files_users FOREIGN KEY (uploaded_by) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
--  M&E (Indicators)
-- =========================================================
-- Purpose: Defines metrics to measure the success of an objective or activity (e.g., "Number of people trained").
-- Relationships: Child of objectives or activities. Parent to indicator_targets and indicator_actuals.
CREATE TABLE indicators (
  id_indicator BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_objective BIGINT NULL,
  id_activity BIGINT NULL,
  indicator_name VARCHAR(300) NOT NULL,
  indicator_type VARCHAR(30) NOT NULL, -- NUMBER/PERCENT/MILESTONE
  baseline DECIMAL(14,2) NULL,
  data_source VARCHAR(200) NULL,
  frequency VARCHAR(30) NOT NULL DEFAULT 'QUARTERLY',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  KEY idx_indicators_objective (id_objective),
  KEY idx_indicators_activity (id_activity),
  CONSTRAINT fk_indicators_objectives FOREIGN KEY (id_objective) REFERENCES objectives(id_objective),
  CONSTRAINT fk_indicators_activities FOREIGN KEY (id_activity) REFERENCES activities(id_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Sets the expected value for an indicator for a specific period (e.g., Q1 Target: 50).
-- Relationships: Child of indicators.
CREATE TABLE indicator_targets (
  id_indicator_target BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_indicator BIGINT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_value DECIMAL(14,2) NULL,
  target_text VARCHAR(200) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_indicator_targets (id_indicator, period_start, period_end),
  CONSTRAINT fk_indicator_targets_indicators FOREIGN KEY (id_indicator) REFERENCES indicators(id_indicator)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Records the actual achieved value for an indicator for a specific period (e.g., Q1 Actual: 45).
-- Relationships: Child of indicators.
CREATE TABLE indicator_actuals (
  id_indicator_actual BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_indicator BIGINT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  actual_value DECIMAL(14,2) NULL,
  actual_text VARCHAR(200) NULL,
  reported_by BIGINT NOT NULL,
  reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_indicator_actuals (id_indicator, period_start, period_end),
  CONSTRAINT fk_indicator_actuals_indicators FOREIGN KEY (id_indicator) REFERENCES indicators(id_indicator),
  CONSTRAINT fk_indicator_actuals_users FOREIGN KEY (reported_by) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
--  PROGRESS UPDATES (Real FKs)
-- =========================================================
-- Purpose: Periodic narrative reports on the progress of an objective.
-- Relationships: Child of objectives.
CREATE TABLE objective_progress_updates (
  id_objective_progress_update BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_objective BIGINT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  id_status_value BIGINT NOT NULL,
  progress_text TEXT NOT NULL,
  outcome_text TEXT NULL,
  risks_issues TEXT NULL,
  next_steps TEXT NULL,
  submitted_by BIGINT NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_objective_progress_updates_objective (id_objective),
  CONSTRAINT fk_objective_progress_updates_objectives FOREIGN KEY (id_objective) REFERENCES objectives(id_objective),
  CONSTRAINT fk_objective_progress_updates_status_values FOREIGN KEY (id_status_value) REFERENCES status_values(id_status_value),
  CONSTRAINT fk_objective_progress_updates_users FOREIGN KEY (submitted_by) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Periodic narrative reports on the progress of an activity.
-- Relationships: Child of activities.
CREATE TABLE activity_progress_updates (
  id_activity_progress_update BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_activity BIGINT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  id_status_value BIGINT NOT NULL,
  progress_text TEXT NOT NULL,
  outcome_text TEXT NULL,
  risks_issues TEXT NULL,
  next_steps TEXT NULL,
  submitted_by BIGINT NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_activity_progress_updates_activity (id_activity),
  CONSTRAINT fk_activity_progress_updates_activities FOREIGN KEY (id_activity) REFERENCES activities(id_activity),
  CONSTRAINT fk_activity_progress_updates_status_values FOREIGN KEY (id_status_value) REFERENCES status_values(id_status_value),
  CONSTRAINT fk_activity_progress_updates_users FOREIGN KEY (submitted_by) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Stores file attachments related to progress updates.
-- Relationships: Linked to either objective_progress_updates or activity_progress_updates via ID and type.
CREATE TABLE progress_update_files (
  id_progress_update_file BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_org BIGINT NOT NULL,
  update_entity VARCHAR(20) NOT NULL, -- OBJECTIVE or ACTIVITY
  id_update BIGINT NOT NULL,          -- app-level rule
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_by BIGINT NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_progress_update_files (update_entity, id_update),
  CONSTRAINT fk_progress_update_files_orgs FOREIGN KEY (id_org) REFERENCES orgs(id_org),
  CONSTRAINT fk_progress_update_files_users FOREIGN KEY (uploaded_by) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
--  AUDIT LOGS
-- =========================================================
-- Purpose: Records system-wide actions for security and accountability.
-- Relationships: Linked to orgs and users. References other entities by ID and type.
CREATE TABLE audit_logs (
  id_audit_log BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_org BIGINT NOT NULL,
  id_user_actor BIGINT NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id BIGINT NOT NULL,
  action VARCHAR(40) NOT NULL,
  detail_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_logs_entity (entity_type, entity_id),
  CONSTRAINT fk_audit_logs_orgs FOREIGN KEY (id_org) REFERENCES orgs(id_org),
  CONSTRAINT fk_audit_logs_users FOREIGN KEY (id_user_actor) REFERENCES users(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purpose: Stores file attachments related to an activity (documents, invoices, etc).
-- Relationships: Child of activities.
CREATE TABLE activity_files (
  id_file BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_activity BIGINT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_files_activities FOREIGN KEY (id_activity) REFERENCES activities(id_activity) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
--  SEED DATA
-- =========================================================

-- Budget Categories (assuming org id = 1)
-- These can be adjusted based on the organization
INSERT INTO budget_categories (id_org, category_name) VALUES
(1, 'Personnel & Salaries'),
(1, 'Travel & Transportation'),
(1, 'Equipment & Supplies'),
(1, 'Venue & Facilities'),
(1, 'Catering & Refreshments'),
(1, 'Professional Services'),
(1, 'Training & Development'),
(1, 'Marketing & Communications'),
(1, 'IT & Technology'),
(1, 'Miscellaneous');

-- I was wrong about the id_org