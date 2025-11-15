/**
 * Error handling utilities for Barion MCP server
 * Provides actionable, LLM-friendly error messages with specific guidance
 */

export interface BarionError {
  ErrorCode?: string;
  Title?: string;
  Description?: string;
  AuthData?: string;
}

/**
 * Format Barion API error with actionable guidance
 */
export function formatBarionError(operationName: string, error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check for HTTP errors
  if (errorMessage.includes('HTTP 401') || errorMessage.includes('HTTP 403')) {
    return formatAuthenticationError(operationName, errorMessage);
  }

  if (errorMessage.includes('HTTP 400')) {
    return formatValidationError(operationName, errorMessage);
  }

  if (errorMessage.includes('HTTP 404')) {
    return formatNotFoundError(operationName, errorMessage);
  }

  if (errorMessage.includes('HTTP 500') || errorMessage.includes('HTTP 502') || errorMessage.includes('HTTP 503')) {
    return formatServerError(operationName, errorMessage);
  }

  // Check for Barion-specific error codes in the message
  if (errorMessage.includes('Barion API Error:')) {
    return parseBarionApiError(operationName, errorMessage);
  }

  // Network/connectivity errors
  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('fetch failed')) {
    return formatNetworkError(operationName, errorMessage);
  }

  // Generic error with basic guidance
  return `❌ ${operationName} failed: ${errorMessage}\n\nTroubleshooting:\n- Verify all required parameters are provided\n- Check that values are in correct format\n- Ensure sufficient balance/permissions for this operation`;
}

/**
 * Format authentication errors
 */
function formatAuthenticationError(operationName: string, errorMessage: string): string {
  const env = errorMessage.includes('test.barion.com') ? 'test' : 'prod';

  return `❌ Authentication Failed: ${operationName}

**Issue:** Invalid or missing credentials for Barion ${env} environment.

**Possible Causes:**
1. POSKey or API Key is incorrect or expired
2. Using test credentials in production environment (or vice versa)
3. Credentials not properly configured in environment variables

**How to Fix:**
- For payment operations: Verify BARION_POS_KEY is correct for ${env} environment
- For wallet operations: Verify BARION_API_KEY is correct for ${env} environment
- Check environment setting: Currently using '${env}' - is this correct?
- Get credentials from: https://secure.barion.com/ (test) or https://secure.barion.com/ (prod)

**Next Steps:**
1. Double-check your credentials in .env file or environment variables
2. Ensure you're using ${env} credentials for ${env} API
3. Try regenerating your API keys if credentials are old

Original error: ${errorMessage}`;
}

/**
 * Format validation errors
 */
function formatValidationError(operationName: string, errorMessage: string): string {
  let guidance = '';

  // Specific validation issues
  if (errorMessage.toLowerCase().includes('currency')) {
    guidance = '\n**Issue:** Invalid currency code.\n**Fix:** Use uppercase currency codes: HUF, EUR, USD, or CZK';
  } else if (errorMessage.toLowerCase().includes('email')) {
    guidance = '\n**Issue:** Invalid email address.\n**Fix:** Provide a valid email in format: user@example.com';
  } else if (errorMessage.toLowerCase().includes('amount') || errorMessage.toLowerCase().includes('total')) {
    guidance = '\n**Issue:** Invalid amount value.\n**Fix:** Ensure amount is a positive number and does not exceed available balance or reservation amount';
  } else if (errorMessage.toLowerCase().includes('paymenttype')) {
    guidance = '\n**Issue:** Invalid payment type.\n**Fix:** Use one of: "Immediate", "Reservation", or "DelayedCapture"';
  } else if (errorMessage.toLowerCase().includes('payee')) {
    guidance = '\n**Issue:** Invalid payee email.\n**Fix:** Payee must be a registered Barion merchant account email';
  }

  return `❌ Validation Error: ${operationName}

**Issue:** Request contains invalid or missing data.
${guidance}

**Common Validation Errors:**
- Currency codes must be uppercase (HUF, EUR, USD, CZK)
- Amounts must be positive numbers
- Email addresses must be valid and properly formatted
- Payment types: "Immediate", "Reservation", or "DelayedCapture"
- Dates/times must be in correct format

**Next Steps:**
1. Review all parameter values for correct format
2. Check API documentation for required fields
3. Validate amounts are within acceptable limits

Original error: ${errorMessage}`;
}

/**
 * Format not found errors
 */
function formatNotFoundError(operationName: string, errorMessage: string): string {
  let specific = '';

  if (errorMessage.toLowerCase().includes('payment')) {
    specific = '\n**Likely Issue:** Payment ID does not exist or has been deleted.\n**Fix:** Use get_payment_state with a valid PaymentId from a recent start_payment call';
  } else if (errorMessage.toLowerCase().includes('transaction')) {
    specific = '\n**Likely Issue:** Transaction ID not found.\n**Fix:** Get valid TransactionId from get_payment_state response before attempting refund/capture';
  } else if (errorMessage.toLowerCase().includes('account')) {
    specific = '\n**Likely Issue:** Account ID not found.\n**Fix:** Use get_wallet_accounts to retrieve valid Account IDs';
  }

  return `❌ Not Found: ${operationName}

**Issue:** The requested resource does not exist.
${specific}

**Common Causes:**
- Using an incorrect or expired ID
- Resource was already deleted or cancelled
- Typo in the ID value
- Using test IDs in production (or vice versa)

**Next Steps:**
1. Verify the ID is correct and was recently created
2. Check you're in the correct environment (test vs prod)
3. For payment operations: Use get_payment_state to verify payment exists
4. For wallet operations: Use get_wallet_accounts to get valid account IDs

Original error: ${errorMessage}`;
}

/**
 * Format server errors
 */
function formatServerError(operationName: string, errorMessage: string): string {
  return `❌ Server Error: ${operationName}

**Issue:** Barion API server encountered an error.

**This is typically a temporary issue on Barion's side.**

**What to do:**
1. Wait 30-60 seconds and retry the operation
2. Check Barion status page: https://status.barion.com (if available)
3. If error persists for >5 minutes, contact Barion support

**Note:** Your request may or may not have been processed. Before retrying:
- For payment operations: Check get_payment_state to see if payment was created
- For financial operations: Check get_wallet_statement to see if transaction was recorded
- Avoid duplicate submissions that could result in double-charging

Original error: ${errorMessage}`;
}

/**
 * Format network/connectivity errors
 */
function formatNetworkError(operationName: string, errorMessage: string): string {
  return `❌ Network Error: ${operationName}

**Issue:** Cannot connect to Barion API.

**Possible Causes:**
1. No internet connection
2. Firewall blocking access to Barion API
3. DNS resolution failure
4. Barion API is temporarily down

**How to Fix:**
1. Check your internet connection
2. Verify firewall allows connections to:
   - https://api.test.barion.com (test environment)
   - https://api.barion.com (production environment)
3. Try accessing Barion website in browser to confirm connectivity
4. If behind corporate proxy, ensure proxy is configured correctly

**Next Steps:**
1. Test connectivity: curl https://api.test.barion.com
2. Check DNS: nslookup api.barion.com
3. Retry operation once connectivity is restored

Original error: ${errorMessage}`;
}

/**
 * Parse Barion-specific API errors
 */
function parseBarionApiError(operationName: string, errorMessage: string): string {
  let guidance = '';

  // Common Barion error codes and their solutions
  if (errorMessage.includes('ModelValidation') || errorMessage.includes('InvalidInput')) {
    guidance = `
**Barion Validation Error**

The request data failed Barion's validation rules.

**Common Issues:**
- Required fields are missing
- Values are in incorrect format
- Currency mismatch (e.g., trying to refund EUR when payment was HUF)
- Amount exceeds maximum allowed or available balance

**How to Fix:**
1. Check all required parameters are provided
2. Verify currency codes match across related operations
3. Ensure amounts don't exceed limits or available funds
4. Validate email addresses are properly formatted`;
  } else if (errorMessage.includes('PaymentNotFound') || errorMessage.includes('TransactionNotFound')) {
    guidance = `
**Resource Not Found**

The payment or transaction ID does not exist.

**How to Fix:**
1. Use get_payment_state first to verify the payment exists
2. Copy the exact PaymentId from the start_payment response
3. For transactions: Get TransactionId from get_payment_state response
4. Ensure you're using the correct environment (test vs prod)`;
  } else if (errorMessage.includes('InvalidPaymentState') || errorMessage.includes('StateError')) {
    guidance = `
**Invalid Payment State**

The operation cannot be performed in the current payment state.

**Common Issues:**
- Trying to capture a payment that's not Reserved/Authorized
- Attempting to refund a payment that hasn't Succeeded
- Trying to finish a reservation that's already captured

**How to Fix:**
1. Use get_payment_state to check current payment status
2. Valid state transitions:
   - Reservation → finish_reservation (when Status=Reserved)
   - DelayedCapture → capture_payment (when Status=Authorized)
   - Succeeded → refund_payment (when Status=Succeeded)
3. Wait for customer to complete payment before attempting capture/refund`;
  } else if (errorMessage.includes('InsufficientFunds')) {
    guidance = `
**Insufficient Funds**

The wallet does not have enough balance for this operation.

**How to Fix:**
1. Use get_wallet_balance to check available funds
2. Ensure sufficient balance in the specified currency
3. Reduce withdrawal/transfer amount
4. Add funds to wallet before retrying`;
  } else if (errorMessage.includes('AmountTooHigh') || errorMessage.includes('ExceedsMaximum')) {
    guidance = `
**Amount Exceeds Maximum**

The amount is higher than allowed or available.

**How to Fix:**
1. For captures/refunds: Amount cannot exceed original payment amount
2. For withdrawals: Amount cannot exceed available balance
3. Check Barion's limits for your account type
4. Reduce the amount and retry`;
  } else if (errorMessage.includes('Expired') || errorMessage.includes('TimeLimit')) {
    guidance = `
**Operation Timeout**

The operation window has expired.

**Common Causes:**
- Reservation not captured within 7 days
- Payment authorization expired
- Customer didn't complete payment in time

**How to Fix:**
1. For reservations: Capture within 7 days or funds auto-release
2. For expired payments: Create a new payment - old one cannot be recovered
3. Check get_payment_state to see if payment is still active`;
  } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('Permission')) {
    guidance = `
**Permission Denied**

Your account doesn't have permission for this operation.

**How to Fix:**
1. Verify you're using the correct API key/POSKey
2. Check your Barion account permissions
3. Ensure account is fully verified for this operation type
4. Contact Barion support to enable required permissions`;
  }

  return `❌ ${operationName} Failed - Barion API Error

${guidance}

**Full Error Details:**
${errorMessage}

**General Troubleshooting:**
1. Check payment state with get_payment_state before operations
2. Verify all amounts are correct and within limits
3. Ensure currencies match across related operations
4. Review Barion API documentation for specific error codes`;
}

/**
 * Format validation error for missing required fields
 */
export function formatMissingFieldError(fieldName: string, example?: string): string {
  let exampleText = example ? `\nExample: ${example}` : '';

  return `❌ Missing Required Field: ${fieldName}

**Issue:** The required parameter '${fieldName}' is missing or empty.

**How to Fix:**
Provide a valid value for ${fieldName}.${exampleText}

**Next Steps:**
1. Check the tool documentation for required parameters
2. Provide all required fields before calling this tool`;
}

/**
 * Format currency mismatch error
 */
export function formatCurrencyError(provided: string, expected?: string): string {
  const suggestion = expected
    ? `Use '${expected}' instead.`
    : 'Use one of: HUF, EUR, USD, CZK';

  return `❌ Invalid Currency: ${provided}

**Issue:** Currency code '${provided}' is invalid or not supported.

**Valid Currency Codes:**
- HUF (Hungarian Forint)
- EUR (Euro)
- USD (US Dollar)
- CZK (Czech Koruna)

**Note:** Currency codes must be uppercase.

**How to Fix:**
${suggestion}`;
}
