const PDFDocument = require('pdfkit');

/**
 * Generate a certificate PDF as a Buffer.
 * @param {object} options
 * @param {string} options.studentName
 * @param {string} [options.studentId]
 * @param {string} [options.program]
 * @param {string} options.certificateType - e.g. "Completion", "Merit", "Participation"
 * @param {string} options.certificateNumber
 * @param {Date|string} [options.issuedDate]
 * @param {string} [options.institutionName] - defaults to env COLLEGE_NAME or "Institution"
 */
function generateCertificatePDF(options) {
  const {
    studentName,
    studentId = '',
    program = '',
    certificateType,
    certificateNumber,
    issuedDate = new Date(),
    institutionName = process.env.COLLEGE_NAME || 'Institution',
  } = options;

  if (!studentName || !certificateType || !certificateNumber) {
    return Promise.reject(new Error('studentName, certificateType, and certificateNumber are required'));
  }

  const dateStr =
    issuedDate instanceof Date
      ? issuedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : String(issuedDate);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 48,
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 48;

    doc.save();
    doc.lineWidth(2);
    doc.strokeColor('#1a365d');
    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2).stroke();

    doc.lineWidth(0.75);
    doc.strokeColor('#2c5282');
    doc.rect(margin + 8, margin + 8, pageWidth - margin * 2 - 16, pageHeight - margin * 2 - 16).stroke();
    doc.restore();

    doc.fillColor('#1a365d')
      .font('Helvetica-Bold')
      .fontSize(28)
      .text(institutionName.toUpperCase(), margin, margin + 36, {
        align: 'center',
        width: pageWidth - margin * 2,
      });

    doc.fillColor('#4a5568')
      .font('Helvetica')
      .fontSize(11)
      .text('This certifies that', margin, margin + 92, { align: 'center', width: pageWidth - margin * 2 });

    doc.fillColor('#1a202c')
      .font('Helvetica-Bold')
      .fontSize(26)
      .text(studentName, margin, margin + 118, { align: 'center', width: pageWidth - margin * 2 });

    const typeLabel = `Certificate of ${certificateType}`;
    doc.fillColor('#2d3748')
      .font('Helvetica')
      .fontSize(14)
      .text(typeLabel, margin, margin + 168, { align: 'center', width: pageWidth - margin * 2 });

    let detailY = margin + 200;
    if (program) {
      doc.fontSize(12)
        .fillColor('#4a5568')
        .text(`Program: ${program}`, margin, detailY, { align: 'center', width: pageWidth - margin * 2 });
      detailY += 22;
    }
    if (studentId) {
      doc.text(`Student ID: ${studentId}`, margin, detailY, {
        align: 'center',
        width: pageWidth - margin * 2,
      });
      detailY += 22;
    }

    doc.fontSize(12)
      .fillColor('#4a5568')
      .text(
        'Awarded in recognition of the achievement described above.',
        margin,
        detailY + 8,
        { align: 'center', width: pageWidth - margin * 2 }
      );

    const footerY = pageHeight - margin - 100;
    doc.moveTo(margin + 80, footerY)
      .lineTo(margin + 220, footerY)
      .strokeColor('#cbd5e0')
      .lineWidth(1)
      .stroke();

    doc.moveTo(pageWidth - margin - 220, footerY)
      .lineTo(pageWidth - margin - 80, footerY)
      .stroke();

    doc.fontSize(10)
      .fillColor('#718096')
      .text('Authorized Signatory', margin + 80, footerY + 6, { width: 140, align: 'center' });

    doc.text('Registrar', pageWidth - margin - 220, footerY + 6, { width: 140, align: 'center' });

    const metaY = pageHeight - margin - 44;
    doc.font('Helvetica')
      .fontSize(9)
      .fillColor('#a0aec0')
      .text(`Certificate No. ${certificateNumber}`, margin, metaY, {
        align: 'center',
        width: pageWidth - margin * 2,
      });
    doc.text(`Issued: ${dateStr}`, margin, metaY + 14, {
      align: 'center',
      width: pageWidth - margin * 2,
    });

    doc.end();
  });
}

module.exports = { generateCertificatePDF };
