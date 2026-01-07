const express = require("express");
const router = express.Router();

const departmentPlansRouter = require("./departmentPlans");
const departmentsRouter = require("./departments");
const objectivesRouter = require("./objectives");
const activitiesRouter = require("./activities");
const usersRouter = require("./users");
const branchesRouter = require("./branches");
const departmentRolesRouter = require("./departmentRoles");
const roleTypesRouter = require("./roleTypes");
const roleHoldersRouter = require("./roleHolders");

router.use("/department-plans", departmentPlansRouter);
router.use("/departments", departmentsRouter);
router.use("/objectives", objectivesRouter);
router.use("/activities", activitiesRouter);
router.use("/users", usersRouter);
router.use("/branches", branchesRouter);
router.use("/department-roles", departmentRolesRouter);
router.use("/role-types", roleTypesRouter);
router.use("/role-holders", roleHoldersRouter);

module.exports = router;
