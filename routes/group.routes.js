const express = require('express');
const router = express.Router();

const {
  createAdminGroup,
  createUnitManagerGroup,
  addAdminToGroup,
  addUnitManagerToGroup,
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

// All group routes must be protected
router.use(protect);

// POST /api/groups/admin/create
router.post('/admin/create', createAdminGroup);

// POST /api/groups/unit/create
router.post('/unit/create', createUnitManagerGroup);

// PATCH /api/groups/admin/:id/add
router.patch('/admin/:id/add', addAdminToGroup);

// PATCH /api/groups/unit/:id/add
router.patch('/unit/:id/add', addUnitManagerToGroup);

module.exports = router;
