// ==============================================
// Invoice Controller (Beginner Friendly)
// ==============================================
// Handles CRUD operations for invoices including
// financial year and date-sequence validation.

const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const { getFinancialYear, getVisibleUserIds } = require('../utils/helpers');


async function validateInvoiceDate({ invoiceNumber, date, financialYear }) {
  const queryBase = { financialYear };

  const [prev, next] = await Promise.all([
    Invoice.findOne({ ...queryBase, invoiceNumber: invoiceNumber - 1 }),
    Invoice.findOne({ ...queryBase, invoiceNumber: invoiceNumber + 1 }),
  ]);

  const newDate = new Date(date);

  if (prev && next) {
    if (newDate < prev.date || newDate > next.date) {
      return `Invoice date must be between ${prev.date.toISOString()} and ${next.date.toISOString()} for this financial year.`;
    }
  } else if (prev && !next) {
    if (newDate < prev.date) {
      return `Invoice date must be on or after ${prev.date.toISOString()} for this financial year.`;
    }
  } else if (!prev && next) {
    if (newDate > next.date) {
      return `Invoice date must be on or before ${next.date.toISOString()} for this financial year.`;
    }
  }

  return null; // valid
}


async function createInvoice(req, res) {
  try {
    const { invoiceNumber, date, amount, customerName } = req.body;

    if (!invoiceNumber || !date || amount == null) {
      return res
        .status(400)
        .json({ message: 'invoiceNumber, date and amount are required.' });
    }

    const financialYear = getFinancialYear(date);

    // Ensure invoice number + FY uniqueness
    const existing = await Invoice.findOne({ invoiceNumber, financialYear });
    if (existing) {
      return res.status(400).json({
        message: 'Invoice number already exists for this financial year.',
      });
    }

    const errorMessage = await validateInvoiceDate({ invoiceNumber, date, financialYear });

    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      date,
      amount,
      customerName,
      financialYear,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Invoice created successfully.', invoice });
  } catch (err) {
    console.error('Create invoice error:', err.message);
    res.status(500).json({ message: 'Failed to create invoice.' });
  }
}

async function getInvoices(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { invoiceNumber, fy, startDate, endDate, search } = req.query;

    const visibleIds = await getVisibleUserIds(req.user);

    const filter = {
      createdBy: { $in: visibleIds },
    };

    if (invoiceNumber) {
      filter.invoiceNumber = Number(invoiceNumber);
    }

    if (fy) {
      filter.financialYear = fy;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    if (search) {
      // Search by invoiceNumber loosely
      const num = Number(search);
      if (!Number.isNaN(num)) {
        filter.invoiceNumber = num;
      }
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email role userId'),
      Invoice.countDocuments(filter),
    ]);

    res.status(200).json({ page, limit, total, invoices });
  } catch (err) {
    console.error('Get invoices error:', err.message);
    res.status(500).json({ message: 'Failed to fetch invoices.' });
  }
}

async function updateInvoice(req, res) {
  try {
    const invoiceNumber = Number(req.params.invoiceNumber);
    const { date, amount, customerName } = req.body;

    if (Number.isNaN(invoiceNumber)) {
      return res.status(400).json({ message: 'Invalid invoice number.' });
    }

    // Find invoice visible to this user
    const visibleIds = await getVisibleUserIds(req.user);

    const invoice = await Invoice.findOne({
      invoiceNumber,
      createdBy: { $in: visibleIds },
    });

    if (!invoice) {
      return res
        .status(404)
        .json({ message: 'Invoice not found or you do not have access.' });
    }

    // Apply changes to a copy first to compute FY etc.
    const newDate = date ? new Date(date) : invoice.date;
    const newFY = getFinancialYear(newDate);

    // Ensure invoice number + FY uniqueness (if FY changed)
    if (newFY !== invoice.financialYear) {
      const existing = await Invoice.findOne({
        invoiceNumber,
        financialYear: newFY,
        _id: { $ne: invoice._id },
      });
      if (existing) {
        return res.status(400).json({
          message: 'Invoice number already exists for this financial year.',
        });
      }
    }

    const errorMessage = await validateInvoiceDate({
      invoiceNumber,
      date: newDate,
      financialYear: newFY,
    });

    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    // If validation passes, update
    invoice.date = newDate;
    invoice.financialYear = newFY;
    if (amount != null) invoice.amount = amount;
    if (customerName != null) invoice.customerName = customerName;

    await invoice.save();

    res.status(200).json({ message: 'Invoice updated successfully.', invoice });
  } catch (err) {
    console.error('Update invoice error:', err.message);
    res.status(500).json({ message: 'Failed to update invoice.' });
  }
}

async function deleteInvoices(req, res) {
  try {
    const { invoiceNumbers } = req.body;

    if (!Array.isArray(invoiceNumbers) || invoiceNumbers.length === 0) {
      return res
        .status(400)
        .json({ message: 'Array of invoiceNumbers is required.' });
    }

    const visibleIds = await getVisibleUserIds(req.user);

    const result = await Invoice.deleteMany({
      invoiceNumber: { $in: invoiceNumbers },
      createdBy: { $in: visibleIds },
    });

    res.status(200).json({
      message: 'Invoices deleted successfully (only those you had permission for).',
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error('Delete invoices error:', err.message);
    res.status(500).json({ message: 'Failed to delete invoices.' });
  }
}

module.exports = {
  createInvoice,
  getInvoices,
  updateInvoice,
  deleteInvoices,
};
