import jsPDF from 'jspdf';
import { formatCurrency } from './api';

export function generateInvestmentReport(investor, investments, startups, gameState) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Recalculate totals from actual investments to ensure accuracy
  const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const totalAvailable = parseFloat(investor.starting_credit || 0) - totalInvested;
  
  console.log('📊 PDF Generation - Investor data:', {
    starting_credit: investor.starting_credit,
    totalInvested,
    totalAvailable,
    investmentCount: investments.length
  });

  // Helper function to add new page if needed
  const checkPageBreak = (neededSpace = 20) => {
    if (yPos + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('VIP Investment Report', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('AUB Angel Investor Platform', pageWidth / 2, 25, { align: 'center' });

  yPos = 45;

  // Report Date
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  const reportDate = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });
  doc.text(`Generated: ${reportDate}`, 20, yPos);
  yPos += 15;

  // Investor Information Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Investor Information', 20, yPos);
  yPos += 8;

  doc.setLineWidth(0.5);
  doc.setDrawColor(59, 130, 246);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${investor.name}`, 25, yPos);
  yPos += 7;
  doc.text(`Account ID: ${investor.id}`, 25, yPos);
  yPos += 7;
  doc.text(`Account Type: VIP Executive Investor`, 25, yPos);
  yPos += 7;
  doc.text(`Status: ${investor.submitted ? 'Portfolio Finalized' : 'Active'}`, 25, yPos);
  yPos += 15;

  // Portfolio Summary Section
  checkPageBreak(60);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Portfolio Summary', 20, yPos);
  yPos += 8;

  doc.setLineWidth(0.5);
  doc.setDrawColor(59, 130, 246);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // Summary boxes
  const boxWidth = (pageWidth - 60) / 3;
  const boxHeight = 30;
  const boxY = yPos;

  // Total Capital Box
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(20, boxY, boxWidth, boxHeight, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Total Capital', 25, boxY + 8);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text(formatCurrency(investor.starting_credit), 25, boxY + 20);

  // Deployed Box
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(30 + boxWidth, boxY, boxWidth, boxHeight, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Deployed', 35 + boxWidth, boxY + 8);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(totalInvested), 35 + boxWidth, boxY + 20);

  // Available Box
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(40 + boxWidth * 2, boxY, boxWidth, boxHeight, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Available', 45 + boxWidth * 2, boxY + 8);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text(formatCurrency(totalAvailable), 45 + boxWidth * 2, boxY + 20);

  yPos += boxHeight + 15;

  // Investment Details Section
  if (investments && investments.length > 0) {
    checkPageBreak(50);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Investment Details', 20, yPos);
    yPos += 8;

    doc.setLineWidth(0.5);
    doc.setDrawColor(59, 130, 246);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // Table headers
    doc.setFillColor(241, 245, 249);
    doc.rect(20, yPos, pageWidth - 40, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Startup', 25, yPos + 6);
    doc.text('Industry', 90, yPos + 6);
    doc.text('Amount', 140, yPos + 6);
    doc.text('% of Portfolio', 165, yPos + 6);
    yPos += 12;

    // Investment rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    investments.forEach((investment, index) => {
      checkPageBreak(12);

      const startup = startups.find(s => s.id === investment.startup_id);
      const startupName = startup?.name || 'Unknown';
      const industry = startup?.industry || 'N/A';
      const percentage = ((investment.amount / investor.invested) * 100).toFixed(1);

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(20, yPos - 4, pageWidth - 40, 10, 'F');
      }

      doc.setTextColor(30, 41, 59);

      // Truncate long names
      const truncatedName = startupName.length > 25 ? startupName.substring(0, 22) + '...' : startupName;
      doc.text(truncatedName, 25, yPos + 3);
      doc.text(industry, 90, yPos + 3);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(formatCurrency(investment.amount), 140, yPos + 3);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${percentage}%`, 165, yPos + 3);

      yPos += 10;
    });

    yPos += 5;
  } else {
    checkPageBreak(20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('No investments made yet', 25, yPos);
    yPos += 15;
  }

  // Performance Metrics
  checkPageBreak(50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Performance Metrics', 20, yPos);
  yPos += 8;

  doc.setLineWidth(0.5);
  doc.setDrawColor(59, 130, 246);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const allocationRate = ((totalInvested / investor.starting_credit) * 100).toFixed(1);
  const numInvestments = investments?.length || 0;
  const avgInvestment = numInvestments > 0 ? (totalInvested / numInvestments) : 0;

  // Get unique industries
  const industries = new Set();
  investments?.forEach(inv => {
    const startup = startups.find(s => s.id === inv.startup_id);
    if (startup?.industry) industries.add(startup.industry);
  });

  doc.text(`• Allocation Rate: ${allocationRate}%`, 25, yPos);
  yPos += 8;
  doc.text(`• Number of Investments: ${numInvestments}`, 25, yPos);
  yPos += 8;
  doc.text(`• Average Investment: ${formatCurrency(avgInvestment)}`, 25, yPos);
  yPos += 8;
  doc.text(`• Industry Diversification: ${industries.size} sector${industries.size !== 1 ? 's' : ''}`, 25, yPos);
  yPos += 15;

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This is an official investment report from AUB Angel Investor Platform', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 20, footerY, { align: 'right' });

  // Disclaimer on last page
  const totalPages = doc.internal.getNumberOfPages();
  doc.setPage(totalPages);
  checkPageBreak(40);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'italic');
  const disclaimer = 'This report is for informational purposes only and does not constitute financial advice. ' +
    'Past performance is not indicative of future results. Please consult with a financial advisor before making investment decisions.';

  const lines = doc.splitTextToSize(disclaimer, pageWidth - 40);
  doc.text(lines, 20, yPos);

  // Save the PDF
  const fileName = `Investment-Report-${investor.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
