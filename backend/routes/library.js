const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  addBook,
  getBooks,
  getBook,
  updateBook,
  issueBook,
  returnBook,
  getStudentIssues,
  getIssueHistory,
} = require('../controllers/libraryController');

const router = express.Router();

router.post('/books', protect, authorize('admin'), addBook);
router.get('/books', protect, getBooks);
router.get('/books/:id', protect, getBook);
router.put('/books/:id', protect, authorize('admin'), updateBook);
router.post('/issue', protect, authorize('admin'), issueBook);
router.put('/return/:id', protect, authorize('admin'), returnBook);
router.get('/student-issues', protect, authorize('student'), getStudentIssues);
router.get('/issues', protect, authorize('admin'), getIssueHistory);

module.exports = router;
