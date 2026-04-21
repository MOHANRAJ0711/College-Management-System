import * as XLSX from 'xlsx';

/**
 * Common function to trigger file download with a specific name
 * @param {Blob} blob 
 * @param {string} fileName 
 */
const triggerDownload = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Sanitize filename for Windows/Unix compatibility
 * @returns {string} date string YYYYMMDD-HHMMSS
 */
const getTimestamp = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

/**
 * Exports data to Excel file (.xlsx)
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 */
export const exportToExcel = (data, fileName) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  
  triggerDownload(blob, `${fileName}_${getTimestamp()}.xlsx`);
};

/**
 * Exports data to CSV file (.csv)
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 */
export const exportToCSV = (data, fileName) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csvOutput], {
    type: 'text/csv;charset=utf-8',
  });
  
  triggerDownload(blob, `${fileName}_${getTimestamp()}.csv`);
};
