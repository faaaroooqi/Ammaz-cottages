const reportService = require('../services/report.service');

/**
 * Revenue report (date range)
 * OWNER / STAFF
 */
exports.getRevenueReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      message: 'startDate and endDate are required'
    });
  }

  const report = await reportService.getRevenueReport({
    startDate,
    endDate
  });

  res.status(200).json({
    report: report[0] || {
      totalRevenue: 0,
      transactions: 0
    }
  });
};

/**
 * Daily revenue (dashboard graph)
 * OWNER / STAFF
 */
exports.getDailyRevenue = async (req, res) => {
  const data = await reportService.getDailyRevenue();
  res.status(200).json({ data });
};

/**
 * Export full revenue report (CSV / Excel / PDF)
 * OWNER only
 */
exports.exportRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'excel' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    if (format === 'pdf') {
      const pdfBuffer = await reportService.generatePdfReport(startDate, endDate);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="revenue_report.pdf"');
      return res.status(200).send(pdfBuffer);
    }

    // Default to Excel
    const excelBuffer = await reportService.generateExcelReport(startDate, endDate);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="revenue_report.xlsx"');
    res.status(200).send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Export expenses report (PDF / Excel)
 * OWNER only
 */
exports.exportExpensesReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'excel' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    if (format === 'pdf') {
      const pdfBuffer = await reportService.generateExpensesPdf(startDate, endDate);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="expenses_report.pdf"');
      return res.status(200).send(pdfBuffer);
    }

    const excelBuffer = await reportService.generateExpensesExcel(startDate, endDate);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses_report.xlsx"');
    res.status(200).send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Export notes report (PDF / Excel)
 * OWNER only
 */
exports.exportNotesReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'excel' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    if (format === 'pdf') {
      const pdfBuffer = await reportService.generateNotesPdf(startDate, endDate);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="notes_report.pdf"');
      return res.status(200).send(pdfBuffer);
    }

    const excelBuffer = await reportService.generateNotesExcel(startDate, endDate);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="notes_report.xlsx"');
    res.status(200).send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
