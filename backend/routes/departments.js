const express = require('express');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getDepartments);
router.get('/:id', getDepartment);
router.post('/', protect, authorize('admin'), createDepartment);
router.put('/:id', protect, authorize('admin'), updateDepartment);
router.delete('/:id', protect, authorize('admin'), deleteDepartment);

module.exports = router;
