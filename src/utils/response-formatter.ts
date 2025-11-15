// Character limit for responses to prevent context overflow
export const CHARACTER_LIMIT = 25000;

export type ResponseFormat = 'json' | 'markdown';
export type DetailLevel = 'concise' | 'detailed';

/**
 * Truncate text if it exceeds the character limit
 */
export function truncateIfNeeded(text: string, limit: number = CHARACTER_LIMIT): string {
  if (text.length <= limit) {
    return text;
  }

  const truncated = text.substring(0, limit - 200);
  return `${truncated}\n\n[... Output truncated. Total length: ${text.length} characters. Showing first ${limit - 200} characters ...]`;
}

/**
 * Format response based on format and detail level
 */
export function formatResponse(
  data: unknown,
  format: ResponseFormat = 'markdown',
  detail: DetailLevel = 'concise',
  formatter?: (data: unknown, detail: DetailLevel) => string
): string {
  if (format === 'json') {
    const jsonStr = JSON.stringify(data, null, 2);
    return truncateIfNeeded(jsonStr);
  }

  // Use custom formatter if provided, otherwise fall back to JSON
  if (formatter) {
    const formatted = formatter(data, detail);
    return truncateIfNeeded(formatted);
  }

  // Default: return JSON
  const jsonStr = JSON.stringify(data, null, 2);
  return truncateIfNeeded(jsonStr);
}

/**
 * Format payment state response
 */
export function formatPaymentState(data: any, detail: DetailLevel): string {
  if (detail === 'concise') {
    return `Payment ${data.PaymentId || 'N/A'}
Status: ${data.Status || 'Unknown'}
Type: ${data.PaymentType || 'N/A'}
Amount: ${data.Total || 0} ${data.Currency || ''}
Created: ${data.CreatedAt || 'N/A'}
${data.Status === 'Succeeded' ? '✓ Payment completed successfully' : ''}
${data.Status === 'Prepared' ? '⏳ Waiting for customer to complete payment' : ''}
${data.Status === 'Failed' ? '✗ Payment failed' : ''}`;
  }

  // Detailed format
  let output = `## Payment Details\n\n`;
  output += `**Payment ID:** ${data.PaymentId || 'N/A'}\n`;
  output += `**Status:** ${data.Status || 'Unknown'}\n`;
  output += `**Type:** ${data.PaymentType || 'N/A'}\n`;
  output += `**Currency:** ${data.Currency || 'N/A'}\n`;
  output += `**Total Amount:** ${data.Total || 0}\n`;
  output += `**Created:** ${data.CreatedAt || 'N/A'}\n`;

  if (data.GatewayUrl) {
    output += `**Gateway URL:** ${data.GatewayUrl}\n`;
  }

  if (data.Transactions && data.Transactions.length > 0) {
    output += `\n### Transactions\n\n`;
    data.Transactions.forEach((t: any, idx: number) => {
      output += `**Transaction ${idx + 1}:**\n`;
      output += `- ID: ${t.TransactionId || 'N/A'}\n`;
      output += `- Status: ${t.Status || 'N/A'}\n`;
      output += `- Amount: ${t.Total || 0} ${data.Currency || ''}\n`;
      output += `- Payee: ${t.Payee || 'N/A'}\n\n`;
    });
  }

  if (data.Errors && data.Errors.length > 0) {
    output += `\n### Errors\n\n`;
    data.Errors.forEach((e: any) => {
      output += `- ${e.Title || 'Error'}: ${e.Description || ''}\n`;
    });
  }

  return output;
}

/**
 * Format wallet accounts response
 */
export function formatWalletAccounts(data: any, detail: DetailLevel): string {
  const accounts = Array.isArray(data) ? data : [];

  if (detail === 'concise') {
    if (accounts.length === 0) {
      return 'No wallet accounts found';
    }

    let output = 'Wallet Balances:\n';
    accounts.forEach((acc: any) => {
      output += `${acc.Currency || 'N/A'}: ${acc.Balance || 0}\n`;
    });
    return output;
  }

  // Detailed format
  if (accounts.length === 0) {
    return '## Wallet Accounts\n\nNo accounts found.';
  }

  let output = `## Wallet Accounts (${accounts.length} total)\n\n`;
  accounts.forEach((acc: any, idx: number) => {
    output += `### Account ${idx + 1}\n`;
    output += `- **Currency:** ${acc.Currency || 'N/A'}\n`;
    output += `- **Balance:** ${acc.Balance || 0}\n`;
    output += `- **Account ID:** ${acc.Id || 'N/A'}\n`;
    output += `- **Owner:** ${acc.Owner || 'N/A'}\n\n`;
  });

  return output;
}

/**
 * Format wallet statement response
 */
export function formatWalletStatement(data: any, detail: DetailLevel): string {
  const transactions = Array.isArray(data) ? data : [];

  if (detail === 'concise') {
    if (transactions.length === 0) {
      return 'No transactions found for this period';
    }

    let output = `${transactions.length} transactions found\n\n`;

    // Show summary of first 10 transactions
    const showCount = Math.min(10, transactions.length);
    for (let i = 0; i < showCount; i++) {
      const t = transactions[i];
      const amount = t.Amount >= 0 ? `+${t.Amount}` : `${t.Amount}`;
      output += `${t.TransactionTime || 'N/A'}: ${amount} ${t.Currency || ''} - ${t.Type || 'N/A'}\n`;
    }

    if (transactions.length > 10) {
      output += `\n... and ${transactions.length - 10} more transactions`;
    }

    return output;
  }

  // Detailed format
  if (transactions.length === 0) {
    return '## Wallet Statement\n\nNo transactions found for this period.';
  }

  let output = `## Wallet Statement (${transactions.length} transactions)\n\n`;

  transactions.forEach((t: any, idx: number) => {
    const amount = t.Amount >= 0 ? `+${t.Amount}` : `${t.Amount}`;
    output += `### Transaction ${idx + 1}\n`;
    output += `- **Date/Time:** ${t.TransactionTime || 'N/A'}\n`;
    output += `- **Type:** ${t.Type || 'N/A'}\n`;
    output += `- **Amount:** ${amount} ${t.Currency || ''}\n`;
    output += `- **Comment:** ${t.Comment || 'N/A'}\n`;
    output += `- **Transaction ID:** ${t.TransactionId || 'N/A'}\n\n`;
  });

  return output;
}

/**
 * Format generic success response
 */
export function formatSuccessResponse(data: any, operationName: string, detail: DetailLevel): string {
  if (detail === 'concise') {
    return `✓ ${operationName} completed successfully`;
  }

  // Detailed format - show relevant fields
  let output = `## ${operationName} - Success\n\n`;

  if (data.PaymentId) {
    output += `**Payment ID:** ${data.PaymentId}\n`;
  }
  if (data.Status) {
    output += `**Status:** ${data.Status}\n`;
  }
  if (data.TransactionId) {
    output += `**Transaction ID:** ${data.TransactionId}\n`;
  }

  // Show full JSON for detailed view
  output += `\n### Full Response\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;

  return output;
}
