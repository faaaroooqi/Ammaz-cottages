const Expense = require('../models/Expense');
const catchAsync = require('../utils/catchAsync');
const response = require('../utils/response');

/**
 * Get all expenses (optionally filtered by date) — excludes soft-deleted
 */
exports.getExpenses = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  let filter = { isDeleted: { $ne: true } };
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const expenses = await Expense.find(filter).sort({ date: -1 });
  return response.success(res, { expenses }, 'Expenses retrieved successfully');
});

/**
 * Create a new expense
 */
exports.createExpense = catchAsync(async (req, res) => {
  const { name, amount, date } = req.body;

  const newExpense = await Expense.create({
    name,
    amount,
    date: date || Date.now()
  });

  return response.created(res, { expense: newExpense }, 'Expense added successfully');
});

/**
 * Update an expense
 */
exports.updateExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, amount, date } = req.body;

  const expense = await Expense.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { name, amount, date },
    { new: true, runValidators: true }
  );

  if (!expense) {
    return response.error(res, 'Expense not found', 404);
  }

  return response.success(res, { expense }, 'Expense updated successfully');
});

/**
 * Soft-delete an expense
 */
exports.deleteExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const expense = await Expense.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );

  if (!expense) {
    return response.error(res, 'Expense not found', 404);
  }

  return response.success(res, {}, 'Expense deleted successfully');
});
