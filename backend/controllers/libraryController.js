const mongoose = require('mongoose');
const LibraryBook = require('../models/LibraryBook');
const LibraryIssue = require('../models/LibraryIssue');
const Student = require('../models/Student');
const handleError = require('../utils/handleError');

const FINE_PER_DAY = Number(process.env.LIBRARY_FINE_PER_DAY) || 2;

async function getStudentFromUser(userId) {
  return Student.findOne({ user: userId });
}

const addBook = async (req, res) => {
  try {
    const book = await LibraryBook.create(req.body);
    const populated = await LibraryBook.findById(book._id).populate('department', 'name code');
    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not add book');
  }
};

const getBooks = async (req, res) => {
  try {
    const { title, author, category, search } = req.query;
    const filter = { isActive: true };

    if (title) filter.title = new RegExp(title.trim(), 'i');
    if (author) filter.author = new RegExp(author.trim(), 'i');
    if (category) filter.category = new RegExp(category.trim(), 'i');

    if (search) {
      const q = search.trim();
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { author: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
        { isbn: new RegExp(q, 'i') },
      ];
    }

    const books = await LibraryBook.find(filter).populate('department', 'name code').sort({ title: 1 });

    return res.status(200).json(books);
  } catch (err) {
    return handleError(res, err, 'Could not fetch books');
  }
};

const getBook = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid book id' });
    }

    const book = await LibraryBook.findById(id).populate('department', 'name code');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (err) {
    return handleError(res, err, 'Could not fetch book');
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid book id' });
    }

    const book = await LibraryBook.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('department', 'name code');

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (err) {
    return handleError(res, err, 'Could not update book');
  }
};

const issueBook = async (req, res) => {
  try {
    const { book: bookId, student: studentId, dueDate } = req.body;
    if (!bookId || !studentId || !dueDate) {
      return res.status(400).json({ message: 'book, student, and dueDate are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(bookId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid book or student id' });
    }

    const book = await LibraryBook.findOneAndUpdate(
      { _id: bookId, isActive: true, availableCopies: { $gte: 1 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );
    if (!book) {
      return res.status(404).json({ message: 'Book not found or no copies available' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      await LibraryBook.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      return res.status(404).json({ message: 'Student not found' });
    }

    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) {
      await LibraryBook.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      return res.status(400).json({ message: 'Invalid due date' });
    }

    let issue;
    try {
      issue = await LibraryIssue.create({
        book: bookId,
        student: studentId,
        dueDate: due,
        issuedBy: req.user._id,
        status: 'issued',
      });
    } catch (createErr) {
      await LibraryBook.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      throw createErr;
    }

    const populated = await LibraryIssue.findById(issue._id)
      .populate('book', 'title author isbn')
      .populate({
        path: 'student',
        select: 'rollNumber user',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('issuedBy', 'name email');

    return res.status(201).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not issue book');
  }
};

const returnBook = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid issue id' });
    }

    const issue = await LibraryIssue.findById(id).populate('book');
    if (!issue) {
      return res.status(404).json({ message: 'Issue record not found' });
    }
    if (issue.status === 'returned') {
      return res.status(400).json({ message: 'Book already returned' });
    }

    const returnDate = new Date();
    let fine = 0;
    if (returnDate > issue.dueDate) {
      const overdueMs = returnDate - issue.dueDate;
      const overdueDays = Math.ceil(overdueMs / (1000 * 60 * 60 * 24));
      fine = overdueDays * FINE_PER_DAY;
    }

    issue.returnDate = returnDate;
    issue.fine = fine;
    issue.status = 'returned';
    await issue.save();

    const book = await LibraryBook.findById(issue.book._id);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      await book.save();
    }

    const populated = await LibraryIssue.findById(issue._id)
      .populate('book', 'title author')
      .populate({
        path: 'student',
        select: 'rollNumber user',
        populate: { path: 'user', select: 'name email' },
      });

    return res.status(200).json(populated);
  } catch (err) {
    return handleError(res, err, 'Could not process return');
  }
};

const getStudentIssues = async (req, res) => {
  try {
    const studentDoc = await getStudentFromUser(req.user._id);
    if (!studentDoc) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const issues = await LibraryIssue.find({ student: studentDoc._id })
      .populate('book', 'title author isbn category')
      .sort({ issueDate: -1 });

    return res.status(200).json(issues);
  } catch (err) {
    return handleError(res, err, 'Could not fetch your issues');
  }
};

const getIssueHistory = async (req, res) => {
  try {
    const { status, student } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (student) {
      if (!mongoose.Types.ObjectId.isValid(student)) {
        return res.status(400).json({ message: 'Invalid student id' });
      }
      filter.student = student;
    }

    const issues = await LibraryIssue.find(filter)
      .populate('book', 'title author isbn')
      .populate({
        path: 'student',
        select: 'rollNumber registrationNumber user',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('issuedBy', 'name email')
      .sort({ issueDate: -1 });

    return res.status(200).json(issues);
  } catch (err) {
    return handleError(res, err, 'Could not fetch issue history');
  }
};

module.exports = {
  addBook,
  getBooks,
  getBook,
  updateBook,
  issueBook,
  returnBook,
  getStudentIssues,
  getIssueHistory,
};
