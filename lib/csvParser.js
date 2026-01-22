/**
 * Parse CSV content and extract recipient data
 * @param {string} csvContent - Raw CSV content
 * @param {boolean} hasHeaders - Whether the CSV has headers
 * @param {boolean} customAmounts - Whether to include amounts column
 * @returns {Array} Array of recipient objects with address and amount
 */
export function parseCSVRecipients(csvContent, hasHeaders = true, customAmounts = false) {
  const lines = csvContent.trim().split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  let dataLines = lines;
  if (hasHeaders) {
    dataLines = lines.slice(1);
  }

  const recipients = [];

  for (const line of dataLines) {
    const columns = parseCSVLine(line);
    if (columns.length === 0) continue;

    const address = columns[0]?.trim();
    let amount = '';

    if (customAmounts && columns.length >= 2) {
      amount = columns[1]?.trim() || '';
    }

    if (address) {
      recipients.push({ address, amount });
    }
  }

  return recipients;
}

/**
 * Parse a single CSV line, handling quoted fields
 * @param {string} line - CSV line to parse
 * @returns {Array} Array of field values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

/**
 * Validate CSV recipients data
 * @param {Array} recipients - Array of recipient objects
 * @param {boolean} customAmounts - Whether amounts are required
 * @returns {Object} Validation result with isValid and errors
 */
export function validateCSVRecipients(recipients, customAmounts = false) {
  const errors = [];
  const validRecipients = [];

  recipients.forEach((recipient, index) => {
    const { address, amount } = recipient;
    const lineNumber = index + 1;

    // Validate address
    if (!address) {
      errors.push(`Line ${lineNumber}: Address is required`);
      return;
    }

    if (!isValidAddress(address)) {
      errors.push(`Line ${lineNumber}: Invalid Ethereum address "${address}"`);
      return;
    }

    // Validate amount if custom amounts are enabled
    if (customAmounts) {
      if (!amount || amount.trim() === '') {
        errors.push(`Line ${lineNumber}: Amount is required`);
        return;
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        errors.push(`Line ${lineNumber}: Invalid amount "${amount}"`);
        return;
      }
    }

    validRecipients.push(recipient);
  });

  return {
    isValid: errors.length === 0,
    errors,
    validRecipients
  };
}

/**
 * Check if string is a valid Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} Whether address is valid
 */
function isValidAddress(address) {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Generate CSV template
 * @param {boolean} customAmounts - Whether to include amounts column
 * @param {boolean} includeHeaders - Whether to include headers
 * @returns {string} CSV template content
 */
export function generateCSVTemplate(customAmounts = false, includeHeaders = true) {
  let csv = '';

  if (includeHeaders) {
    csv += customAmounts ? 'address,amount\n' : 'address\n';
  }

  // Add example rows
  csv += '0x742d35Cc6634C0532925a3b844Bc454e4438f44e\n';
  if (customAmounts) {
    csv += '0x742d35Cc6634C0532925a3b844Bc454e4438f44e,1.5\n';
    csv += '0x742d35Cc6634C0532925a3b844Bc454e4438f44e,2.0\n';
  } else {
    csv += '0x742d35Cc6634C0532925a3b844Bc454e4438f44e\n';
    csv += '0x742d35Cc6634C0532925a3b844Bc454e4438f44e\n';
  }

  return csv;
}