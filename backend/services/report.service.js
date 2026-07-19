const Booking = require('../models/Booking');
const Expense = require('../models/Expense');
const Note = require('../models/Note');
const BOOKING_STATUS = require('../constants/bookingStatus');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Confirmed/paid statuses that count as revenue
const REVENUE_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.CONFIRMED_HALF_PAID,
  BOOKING_STATUS.COMPLETED
];

/**
 * Helper to apply professional styling to Excel Worksheets
 */
const formatExcelSheet = (ws, title, columnWidths) => {
  // Title Row
  ws.insertRow(1, [title]);
  ws.mergeCells(1, 1, 1, columnWidths.length);
  const titleRow = ws.getRow(1);
  titleRow.height = 40;
  const titleCell = titleRow.getCell(1);
  titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } }; // Dark Blue
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Empty Spacer Row
  ws.insertRow(2, []);
  ws.getRow(2).height = 12;

  // Header Row (Row 3)
  const headerRow = ws.getRow(3);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } }; // Slate Dark
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      top: { style: 'medium', color: { argb: '0F172A' } },
      bottom: { style: 'medium', color: { argb: '0F172A' } }
    };
  });

  // Data Rows (Row 4 onwards)
  ws.eachRow((row, rowNumber) => {
    if (rowNumber <= 3) return; // skip header and title spacer

    row.height = 22;

    // Determine if it is a Summary row (e.g. TOTAL, NET REVENUE)
    let isSummary = false;
    row.eachCell((cell) => {
      const val = String(cell.value || '').toUpperCase();
      if (
        val.includes('TOTAL') || 
        val.includes('NET REVENUE') || 
        val.includes('TOTAL REVENUE') || 
        val.includes('TOTAL EXPENSES')
      ) {
        isSummary = true;
      }
    });

    const isEven = rowNumber % 2 === 0;
    const bgHex = isSummary ? 'EFF6FF' : (isEven ? 'F8FAFC' : 'FFFFFF'); // Soft light blue for summary, else zebra striping

    row.eachCell((cell) => {
      cell.font = { 
        name: 'Segoe UI', 
        size: 9.5, 
        bold: isSummary, 
        color: { argb: isSummary ? '1E3A8A' : '1F2937' } 
      };
      cell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: bgHex } 
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        top: { style: isSummary ? 'medium' : 'thin', color: { argb: isSummary ? '1E3A8A' : 'E2E8F0' } },
        bottom: { style: isSummary ? 'double' : 'thin', color: { argb: isSummary ? '1E3A8A' : 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } }
      };
    });
  });

  // Apply widths
  columnWidths.forEach((width, index) => {
    ws.getColumn(index + 1).width = width;
  });
};

/**
 * Helper to draw a beautiful header banner in PDFKit
 */
const drawPDFReportHeader = (doc, title, period) => {
  // Draw primary dark-blue top banner
  doc.rect(30, 30, 552, 60).fill('#1e3a8a');
  
  // Title text
  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(20)
     .text(title, 45, 42);
     
  // Sub-header / Period
  doc.fillColor('#bfdbfe')
     .font('Helvetica')
     .fontSize(10)
     .text(period, 45, 68);
     
  doc.moveDown(2);
};

/**
 * Helper to draw structured, page-overflow-safe tabular rows in PDFKit
 */
const drawPDFTable = (doc, startY, headers, data, columnWidths) => {
  let y = startY;
  
  // Calculate X offset positions
  const xOffsets = [30];
  columnWidths.forEach((width, index) => {
    xOffsets.push(xOffsets[index] + width);
  });
  
  // 1. Draw Table Header Row
  doc.rect(30, y, 552, 22).fill('#0f172a');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  headers.forEach((header, i) => {
    doc.text(header, xOffsets[i] + 5, y + 6, {
      width: columnWidths[i] - 10,
      align: 'left',
      ellipsis: true
    });
  });
  y += 22;
  
  // 2. Draw Data Rows
  data.forEach((row, rowIndex) => {
    // Check if we are running out of page height (Standard margin: 30, max height ~750)
    if (y > 720) {
      doc.addPage();
      y = 40; // Reset Y on new page
      
      // Redraw Table Headers on the new page
      doc.rect(30, y, 552, 22).fill('#0f172a');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
      headers.forEach((header, i) => {
        doc.text(header, xOffsets[i] + 5, y + 6, {
          width: columnWidths[i] - 10,
          align: 'left'
        });
      });
      y += 22;
    }
    
    // Zebra Striping background color
    const isEven = rowIndex % 2 === 0;
    const bg = isEven ? '#f8fafc' : '#ffffff';
    doc.rect(30, y, 552, 20).fill(bg);
    
    doc.fillColor('#1f2937').font('Helvetica').fontSize(8.5);
    row.forEach((cell, i) => {
      doc.text(String(cell !== undefined ? cell : ''), xOffsets[i] + 5, y + 5, {
        width: columnWidths[i] - 10,
        align: 'left',
        ellipsis: true
      });
    });
    
    // Bottom thin line grid border
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(30, y + 20).lineTo(582, y + 20).stroke();
    y += 20;
  });
  
  return y;
};

/**
 * Revenue report — booking-centric (single source of truth)
 */
exports.getRevenueReport = async ({ startDate, endDate }) => {
  const bookings = await Booking.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        status: { $in: REVENUE_STATUSES },
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $cond: {
              if: { $eq: ['$status', 'confirmed_half_paid'] },
              then: { $multiply: ['$totalAmount', 0.5] },
              else: '$totalAmount'
            }
          }
        },
        transactions: { $sum: 1 }
      }
    }
  ]);

  const expenses = await Expense.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' }
      }
    }
  ]);

  const report = bookings[0] || { totalRevenue: 0, transactions: 0 };
  report.totalExpenses = expenses[0]?.totalExpenses || 0;
  
  return [report];
};

/**
 * Daily revenue (dashboard graph) — booking-centric
 */
exports.getDailyRevenue = async () => {
  const revenue = await Booking.aggregate([
    {
      $match: {
        isDeleted: { $ne: true },
        status: { $in: REVENUE_STATUSES }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        revenue: {
          $sum: {
            $cond: {
              if: { $eq: ['$status', 'confirmed_half_paid'] },
              then: { $multiply: ['$totalAmount', 0.5] },
              else: '$totalAmount'
            }
          }
        }
      }
    }
  ]);

  const expenses = await Expense.aggregate([
    {
      $match: { isDeleted: { $ne: true } }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$date'
          }
        },
        expense: { $sum: '$amount' }
      }
    }
  ]);

  const dateMap = {};

  revenue.forEach(r => {
    dateMap[r._id] = { date: r._id, revenue: r.revenue, expense: 0 };
  });

  expenses.forEach(e => {
    if (!dateMap[e._id]) {
      dateMap[e._id] = { date: e._id, revenue: 0, expense: e.expense };
    } else {
      dateMap[e._id].expense = e.expense;
    }
  });

  return Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));
};

/**
 * Generate Excel report — booking-centric with notes
 */
exports.generateExcelReport = async (startDate, endDate) => {
  const bookings = await Booking.find({
    isDeleted: { $ne: true },
    status: { $in: REVENUE_STATUSES },
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
  })
  .populate('room')
  .sort({ createdAt: -1 });

  const expenses = await Expense.find({
    isDeleted: { $ne: true },
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).sort({ date: -1 });

  const notes = await Note.find({
    isDeleted: { $ne: true },
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).populate('bookingId').sort({ date: -1 });

  const workbook = new ExcelJS.Workbook();

  // 1. --- Revenue Sheet ---
  const revenueSheet = workbook.addWorksheet('Revenue Report');
  revenueSheet.columns = [
    { header: 'Date', key: 'date' },
    { header: 'Booking ID', key: 'bookingId' },
    { header: 'Customer', key: 'customer' },
    { header: 'Room', key: 'room' },
    { header: 'Nights', key: 'nights' },
    { header: 'Status', key: 'status' },
    { header: 'Amount (PKR)', key: 'amount' }
  ];

  let totalRevenue = 0;
  bookings.forEach(booking => {
    const isHalfPaid = booking.status === 'confirmed_half_paid';
    const revAmount = isHalfPaid ? (booking.totalAmount * 0.5) : (booking.totalAmount || 0);
    totalRevenue += revAmount;

    revenueSheet.addRow({
      date: booking.createdAt ? booking.createdAt.toISOString().split('T')[0] : 'N/A',
      bookingId: booking.bookingId,
      customer: booking.customer?.name || 'N/A',
      room: booking.room?.name || 'N/A',
      nights: booking.nights || 0,
      status: isHalfPaid ? 'Confirmed (Half Paid)' : (booking.status || 'N/A'),
      amount: revAmount
    });
  });
  formatExcelSheet(revenueSheet, 'Revenue Report', [15, 18, 25, 20, 10, 24, 18]);

  // 2. --- Expenses Sheet ---
  const expenseSheet = workbook.addWorksheet('Expenses');
  expenseSheet.columns = [
    { header: 'Date', key: 'date' },
    { header: 'Expense Name', key: 'name' },
    { header: 'Amount (PKR)', key: 'amount' }
  ];

  let totalExpenses = 0;
  expenses.forEach(expense => {
    totalExpenses += expense.amount || 0;
    expenseSheet.addRow({
      date: expense.date ? expense.date.toISOString().split('T')[0] : 'N/A',
      name: expense.name,
      amount: expense.amount
    });
  });
  formatExcelSheet(expenseSheet, 'Expenses Report', [15, 35, 18]);

  // 3. --- Notes Sheet ---
  const notesSheet = workbook.addWorksheet('Notes');
  notesSheet.columns = [
    { header: 'Date', key: 'date' },
    { header: 'Title', key: 'title' },
    { header: 'Content', key: 'content' },
    { header: 'Linked Booking', key: 'booking' }
  ];

  notes.forEach(note => {
    notesSheet.addRow({
      date: note.date ? note.date.toISOString().split('T')[0] : 'N/A',
      title: note.title,
      content: note.content,
      booking: note.bookingId?.bookingId || '—'
    });
  });
  formatExcelSheet(notesSheet, 'Admin Notes', [15, 25, 55, 18]);

  // 4. --- Summary Sheet ---
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric' },
    { header: 'Amount (PKR)', key: 'amount' }
  ];
  summarySheet.addRow({ metric: 'Total Revenue', amount: totalRevenue });
  summarySheet.addRow({ metric: 'Total Expenses', amount: totalExpenses });
  summarySheet.addRow({ metric: 'Net Revenue', amount: totalRevenue - totalExpenses });
  formatExcelSheet(summarySheet, 'Financial Summary', [25, 20]);

  return workbook.xlsx.writeBuffer();
};

/**
 * Generate PDF report — booking-centric with notes (Beautified)
 */
exports.generatePdfReport = async (startDate, endDate) => {
  const bookings = await Booking.find({
    isDeleted: { $ne: true },
    status: { $in: REVENUE_STATUSES },
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
  })
  .populate('room')
  .sort({ createdAt: -1 });

  const expenses = await Expense.find({
    isDeleted: { $ne: true },
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).sort({ date: -1 });

  const notes = await Note.find({
    isDeleted: { $ne: true },
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).populate('bookingId').sort({ date: -1 });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const displayStart = new Date(startDate).toLocaleDateString();
    const displayEnd = new Date(endDate).toLocaleDateString();
    
    // 1. Header Banner
    drawPDFReportHeader(doc, 'Revenue & Expense Report', `Period: ${displayStart} to ${displayEnd}`);

    let currentY = 110;

    // 2. Revenues Table Section
    doc.fillColor('#1e3a8a').font('Helvetica-Bold').fontSize(14).text('Revenues', 30, currentY);
    currentY += 22;

    if (bookings.length === 0) {
      doc.fillColor('#6b7280').font('Helvetica').fontSize(10).text('No revenue bookings recorded in this period.', 30, currentY);
      currentY += 25;
    } else {
      const headers = ['#', 'Date', 'Booking ID', 'Customer', 'Room', 'Amount'];
      const colWidths = [25, 65, 85, 120, 160, 97];
      const rows = bookings.map((b, i) => {
        const isHalf = b.status === 'confirmed_half_paid';
        const displayAmt = isHalf ? (b.totalAmount * 0.5) : b.totalAmount;
        return [
          i + 1,
          b.createdAt ? b.createdAt.toISOString().split('T')[0] : 'N/A',
          b.bookingId,
          b.customer?.name || 'N/A',
          b.room?.name || 'N/A',
          `PKR ${Number(displayAmt).toLocaleString()}${isHalf ? ' (Half)' : ''}`
        ];
      });
      currentY = drawPDFTable(doc, currentY, headers, rows, colWidths);
      currentY += 25;
    }

    // 3. Expenses Table Section
    if (currentY > 600) {
      doc.addPage();
      currentY = 40;
    }
    doc.fillColor('#b91c1c').font('Helvetica-Bold').fontSize(14).text('Expenses', 30, currentY);
    currentY += 22;

    if (expenses.length === 0) {
      doc.fillColor('#6b7280').font('Helvetica').fontSize(10).text('No expenses recorded in this period.', 30, currentY);
      currentY += 25;
    } else {
      const headers = ['#', 'Date', 'Expense Name', 'Amount'];
      const colWidths = [30, 80, 320, 122];
      const rows = expenses.map((e, i) => [
        i + 1,
        e.date ? e.date.toISOString().split('T')[0] : 'N/A',
        e.name,
        `PKR ${Number(e.amount).toLocaleString()}`
      ]);
      currentY = drawPDFTable(doc, currentY, headers, rows, colWidths);
      currentY += 25;
    }

    // 4. Notes Section
    if (currentY > 600) {
      doc.addPage();
      currentY = 40;
    }
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('Notes', 30, currentY);
    currentY += 22;

    if (notes.length === 0) {
      doc.fillColor('#6b7280').font('Helvetica').fontSize(10).text('No notes recorded in this period.', 30, currentY);
      currentY += 25;
    } else {
      const headers = ['#', 'Date', 'Title', 'Content', 'Linked Booking'];
      const colWidths = [25, 65, 110, 260, 92];
      const rows = notes.map((n, i) => [
        i + 1,
        n.date ? n.date.toISOString().split('T')[0] : 'N/A',
        n.title,
        n.content,
        n.bookingId?.bookingId || '—'
      ]);
      currentY = drawPDFTable(doc, currentY, headers, rows, colWidths);
      currentY += 25;
    }

    // 5. Total Performance Summary
    if (currentY > 600) {
      doc.addPage();
      currentY = 40;
    }
    const totalRev = bookings.reduce((sum, b) => {
      const displayAmt = b.status === 'confirmed_half_paid' ? (b.totalAmount * 0.5) : (b.totalAmount || 0);
      return sum + displayAmt;
    }, 0);
    const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    doc.rect(30, currentY, 552, 70).fill('#f8fafc');
    doc.strokeColor('#1e3a8a').lineWidth(1).rect(30, currentY, 552, 70).stroke();

    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11).text('Total Revenue:', 45, currentY + 15);
    doc.fillColor('#166534').font('Helvetica-Bold').fontSize(11).text(`PKR ${totalRev.toLocaleString()}`, 150, currentY + 15);

    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11).text('Total Expenses:', 45, currentY + 32);
    doc.fillColor('#991b1b').font('Helvetica-Bold').fontSize(11).text(`PKR ${totalExp.toLocaleString()}`, 150, currentY + 32);

    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text('Net Performance:', 320, currentY + 25);
    doc.fillColor(totalRev - totalExp >= 0 ? '#166534' : '#991b1b')
       .font('Helvetica-Bold')
       .fontSize(14)
       .text(`PKR ${(totalRev - totalExp).toLocaleString()}`, 430, currentY + 23);

    doc.end();
  });
};

/**
 * Export expenses only (PDF) — Beautified
 */
exports.generateExpensesPdf = async (startDate, endDate) => {
  const expenses = await Expense.find({
    isDeleted: { $ne: true },
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).sort({ date: -1 });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const displayStart = new Date(startDate).toLocaleDateString();
    const displayEnd = new Date(endDate).toLocaleDateString();

    drawPDFReportHeader(doc, 'Expenses Audit Report', `Period: ${displayStart} to ${displayEnd}`);

    let currentY = 110;

    if (expenses.length === 0) {
      doc.fillColor('#6b7280').font('Helvetica').fontSize(10).text('No expenses recorded in this period.', 30, currentY);
    } else {
      const headers = ['#', 'Date', 'Expense Name', 'Amount'];
      const colWidths = [35, 85, 300, 132];
      const rows = expenses.map((e, i) => [
        i + 1,
        e.date ? e.date.toISOString().split('T')[0] : 'N/A',
        e.name,
        `PKR ${Number(e.amount).toLocaleString()}`
      ]);
      currentY = drawPDFTable(doc, currentY, headers, rows, colWidths);
      
      currentY += 20;
      const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      
      doc.rect(30, currentY, 552, 30).fill('#eff6ff');
      doc.fillColor('#1e3a8a').font('Helvetica-Bold').fontSize(11).text('Total Audited Expenses:', 45, currentY + 10);
      doc.fillColor('#b91c1c').font('Helvetica-Bold').fontSize(12).text(`PKR ${total.toLocaleString()}`, 450, currentY + 9, { align: 'right', width: 120 });
    }

    doc.end();
  });
};

/**
 * Export expenses only (Excel) — Beautified
 */
exports.generateExpensesExcel = async (startDate, endDate) => {
  const expenses = await Expense.find({
    isDeleted: { $ne: true },
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).sort({ date: -1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Expenses');
  sheet.columns = [
    { header: 'Date', key: 'date' },
    { header: 'Expense Name', key: 'name' },
    { header: 'Amount (PKR)', key: 'amount' }
  ];

  let total = 0;
  expenses.forEach(expense => {
    total += expense.amount || 0;
    sheet.addRow({
      date: expense.date ? expense.date.toISOString().split('T')[0] : 'N/A',
      name: expense.name,
      amount: expense.amount
    });
  });

  sheet.addRow({});
  sheet.addRow({ name: 'TOTAL EXPENSES', amount: total });

  formatExcelSheet(sheet, 'Expenses Audit Report', [15, 35, 18]);

  return workbook.xlsx.writeBuffer();
};

/**
 * Export notes only (PDF) — Beautified
 */
exports.generateNotesPdf = async (startDate, endDate) => {
  const notes = await Note.find({
    isDeleted: { $ne: true },
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).populate('bookingId').sort({ date: -1 });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const displayStart = new Date(startDate).toLocaleDateString();
    const displayEnd = new Date(endDate).toLocaleDateString();

    drawPDFReportHeader(doc, 'Admin Notes Audit', `Period: ${displayStart} to ${displayEnd}`);

    let currentY = 110;

    if (notes.length === 0) {
      doc.fillColor('#6b7280').font('Helvetica').fontSize(10).text('No notes recorded in this period.', 30, currentY);
    } else {
      const headers = ['#', 'Date', 'Note Title', 'Content Details', 'Booking Ref'];
      const colWidths = [30, 75, 120, 240, 87];
      const rows = notes.map((n, i) => [
        i + 1,
        n.date ? n.date.toISOString().split('T')[0] : 'N/A',
        n.title,
        n.content,
        n.bookingId?.bookingId || '—'
      ]);
      drawPDFTable(doc, currentY, headers, rows, colWidths);
    }

    doc.end();
  });
};

/**
 * Export notes only (Excel) — Beautified
 */
exports.generateNotesExcel = async (startDate, endDate) => {
  const notes = await Note.find({
    isDeleted: { $ne: true },
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).populate('bookingId').sort({ date: -1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Notes');
  sheet.columns = [
    { header: 'Date', key: 'date' },
    { header: 'Title', key: 'title' },
    { header: 'Content', key: 'content' },
    { header: 'Linked Booking', key: 'booking' }
  ];

  notes.forEach(note => {
    sheet.addRow({
      date: note.date ? note.date.toISOString().split('T')[0] : 'N/A',
      title: note.title,
      content: note.content,
      booking: note.bookingId?.bookingId || '—'
    });
  });

  formatExcelSheet(sheet, 'Admin Notes Audit', [15, 25, 55, 18]);

  return workbook.xlsx.writeBuffer();
};
