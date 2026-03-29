const express = require('express');
const { getAll, getOne } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    // 1. Monthly Income vs Expense Chart (Current Year)
    const currentYear = new Date().getFullYear().toString();
    const monthlyDataRaw = await getAll(`
      SELECT 
        strftime('%m', date) as month,
        type,
        SUM(amount) as total
      FROM expenses
      WHERE date LIKE ?
      GROUP BY month, type
    `, [`${currentYear}-%`]);

    const formattedMonthlyData = Array.from({length: 12}, (_, i) => {
      const monthStr = String(i + 1).padStart(2, '0');
      const incomeRaw = monthlyDataRaw.find(d => d.month === monthStr && d.type === 'income');
      const expenseRaw = monthlyDataRaw.find(d => d.month === monthStr && d.type === 'expense');
      
      const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      return {
        name: monthNames[i],
        income: incomeRaw ? incomeRaw.total : 0,
        expense: expenseRaw ? expenseRaw.total : 0
      };
    });

    // 2. Expense Distribution Pie Chart (by title/description grouping or just title if simple)
    const distributionRaw = await getAll(`
      SELECT 
        title as category,
        SUM(amount) as value
      FROM expenses
      WHERE type = 'expense'
      GROUP BY category
      ORDER BY value DESC
      LIMIT 6
    `);

    // 3. Aidat Payment Rate
    // To get payment rate, we need to see how many unique apartments paid for the current month vs total apartments (18)
    const currentMonth = new Date().getMonth() + 1;
    const currentYearNum = new Date().getFullYear();
    const currentAidatPeriod = await getOne('SELECT id FROM aidats WHERE month = ? AND year = ?', [currentMonth, currentYearNum]);
    
    let paymentRate = 0;
    let paidCount = 0;
    if (currentAidatPeriod) {
        const paidResult = await getOne(`
          SELECT COUNT(*) as count FROM aidat_payments 
          WHERE aidat_id = ? AND status = 'paid'
        `, [currentAidatPeriod.id]);
        paidCount = paidResult.count;
        paymentRate = Math.round((paidCount / 18) * 100);
    }

    // 4. Financial Insights (Aylık Ortalama Gider, En Büyük Gider Türü, Toplam Aidat Geliri)
    const avgExpenseRes = await getOne(`
      SELECT AVG(monthly_total) as average FROM (
        SELECT SUM(amount) as monthly_total FROM expenses WHERE type = 'expense' GROUP BY strftime('%Y-%m', date)
      )
    `);

    const biggestExpenseRes = await getOne(`
      SELECT title, SUM(amount) as total FROM expenses WHERE type = 'expense' GROUP BY title ORDER BY total DESC LIMIT 1
    `);

    const totalAidatIncomeRes = await getOne(`
      SELECT SUM(amount) as total FROM expenses WHERE type = 'income' AND title LIKE '%Aidat%'
    `);

    res.json({
      monthlyData: formattedMonthlyData,
      expenseDistribution: distributionRaw,
      paymentRate,
      paidCount,
      insights: {
        avgMonthlyExpense: avgExpenseRes?.average || 0,
        biggestExpenseType: biggestExpenseRes?.title || 'Yok',
        totalAidatIncome: totalAidatIncomeRes?.total || 0
      }
    });

  } catch (err) { next(err); }
});

module.exports = router;
