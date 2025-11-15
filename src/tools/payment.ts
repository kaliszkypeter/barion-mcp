import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BarionClient } from '../utils/barion-client.js';
import { formatResponse, formatPaymentState, formatSuccessResponse } from '../utils/response-formatter.js';
import { formatBarionError } from '../utils/error-handler.js';

export function configurePaymentTools(server: McpServer, poskey: string, environment: 'test' | 'prod' = 'test') {
  const client = new BarionClient(poskey, environment);

  // Tool: Start Payment
  server.tool(
    'start_payment',
    `Start a new Barion payment transaction.

Creates a payment request and returns a payment URL where the customer can complete the payment. This is the primary tool for initiating any payment flow in Barion.

PAYMENT TYPES:
- Immediate: Funds are captured immediately upon successful payment completion. Use this for standard e-commerce purchases.
- Reservation: Funds are reserved (authorized) but not captured. You must call finish_reservation within 7 days to capture the funds. Use this for hotel bookings, car rentals, or pre-orders where final amount may change.
- DelayedCapture: Similar to Reservation but uses a different API endpoint for capture. You must call capture_payment to finalize. Use this when you need more control over the capture timing.

WORKFLOW:
1. Call this tool to create the payment (provide callbackUrl for status notifications)
2. Redirect the customer to the returned GatewayUrl
3. Customer completes payment on Barion's secure payment page
4. Barion sends a callback notification to your callbackUrl when payment status changes
5. Customer is redirected back to your redirectUrl
6. When you receive the callback, use get_payment_state to get complete payment details
7. For Reservation payments, call finish_reservation to capture funds
8. For DelayedCapture payments, call capture_payment to capture funds

CALLBACK MECHANISM:
The callbackUrl parameter is crucial - Barion will POST payment status updates to this URL whenever the payment state changes (e.g., Prepared → Started → Succeeded). This webhook approach is preferred over polling get_payment_state repeatedly. Set up an endpoint to receive these callbacks and trigger get_payment_state when notified.

RESPONSE:
Returns a PaymentId (unique identifier for this payment), PaymentRequestId (your reference), Status (payment state), and GatewayUrl (where to send the customer).

IMPORTANT: The payee email must be a registered Barion merchant account. All amounts must be positive numbers. The redirectUrl and callbackUrl must be valid HTTPS URLs (HTTP allowed only in test environment).`,
    {
      paymentType: z.enum(['Immediate', 'Reservation', 'DelayedCapture']).describe('The type of payment'),
      currency: z.enum(['HUF', 'EUR', 'USD', 'CZK']).describe('Currency code: HUF (Hungarian Forint), EUR (Euro), USD (US Dollar), or CZK (Czech Koruna)'),
      transactions: z.array(
        z.object({
          posTransactionId: z.string().describe('Unique ID for this transaction'),
          payee: z.string().email().describe('Email address of the payee (must be a registered Barion user)'),
          total: z.number().positive().describe('Total amount (must be positive)'),
          items: z.array(
            z.object({
              name: z.string().describe('Item name'),
              description: z.string().describe('Item description'),
              quantity: z.number().positive().describe('Quantity (must be positive)'),
              unit: z.string().describe('Unit (e.g., piece, hour)'),
              unitPrice: z.number().positive().describe('Unit price (must be positive)'),
              itemTotal: z.number().positive().describe('Total price for this item (must be positive)'),
            })
          ),
        })
      ).describe('Array of transactions'),
      redirectUrl: z.string().url().describe('URL where the customer will be redirected after completing payment (success or failure). Example: "https://myshop.com/payment/return"'),
      callbackUrl: z.string().url().describe('URL where Barion will POST payment status change notifications (webhook). Your server should listen here and call get_payment_state when notified. Example: "https://myshop.com/api/barion/callback"'),
      format: z.enum(['json', 'markdown']).default('markdown').describe('Response format: "json" for full JSON response, "markdown" for human-readable summary'),
      detail: z.enum(['concise', 'detailed']).default('concise').describe('Detail level: "concise" for summary, "detailed" for complete information'),
    },
    {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    async (args) => {
      try {
        const result = await client.startPayment(args);
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          (data: any, detail) => formatSuccessResponse(data, 'Payment Created', detail)
        );
        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: 'text',
              text: formatBarionError('Start Payment', error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Get Payment State
  server.tool(
    'get_payment_state',
    `Get the current state and details of a payment transaction.

Retrieves comprehensive information about a payment including its status, transactions, amounts, and customer details. Use this tool to verify payment completion, check transaction status, or retrieve payment details for reporting.

COMMON USE CASES:
- Verify payment was completed successfully after customer returns from payment gateway
- Check if reserved/authorized funds are ready to be captured
- Monitor payment status for reconciliation
- Retrieve transaction IDs needed for refunds or captures
- Get payment history and audit trail

PAYMENT STATES:
- Prepared: Payment created but customer hasn't started the payment process
- Started: Customer is on the payment page
- InProgress: Payment processing in progress
- Reserved: Funds are reserved (for Reservation payments)
- Authorized: Payment authorized (for DelayedCapture payments)
- Succeeded: Payment completed successfully
- Failed: Payment failed
- Canceled: Payment was canceled
- Expired: Payment request expired (customer didn't complete in time)

RESPONSE:
Returns complete payment details including Status, Transactions (with TransactionId needed for refunds/captures), Total amount, Currency, PaymentType, and timestamps.

IMPORTANT - DO NOT POLL:
After creating a payment with start_payment, DO NOT repeatedly poll this endpoint to detect status changes. Instead, Barion will send a callback to the callbackUrl you provided in start_payment whenever the payment status changes. When you receive the callback notification, THEN call this tool to get the updated payment details. This is more efficient and prevents unnecessary API calls.`,
    {
      paymentId: z.string().describe('The Barion payment ID'),
      format: z.enum(['json', 'markdown']).default('markdown').describe('Response format: "json" for full JSON response, "markdown" for human-readable summary'),
      detail: z.enum(['concise', 'detailed']).default('concise').describe('Detail level: "concise" for summary, "detailed" for complete information'),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async (args) => {
      try {
        const result = await client.getPaymentState(args.paymentId);
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          formatPaymentState
        );
        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: 'text',
              text: formatBarionError('Get Payment State', error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Finish Reservation
  server.tool(
    'finish_reservation',
    `Finish (capture) a reserved payment to transfer funds from customer to merchant.

Captures funds that were previously reserved using the 'Reservation' payment type. This finalizes the payment and transfers the money. You must call this within 7 days of the reservation, or the funds will be automatically released back to the customer.

WHEN TO USE:
- After creating a payment with paymentType='Reservation' that completed successfully (Status=Reserved)
- When you're ready to finalize the transaction (e.g., hotel checkout, final invoice calculated, goods shipped)
- To capture partial amounts if the final total is less than reserved (e.g., minibar charges less than deposit)

WORKFLOW:
1. Create payment with start_payment using paymentType='Reservation'
2. Customer completes payment (funds are reserved)
3. Use get_payment_state to verify Status=Reserved and get TransactionId
4. Provide service or prepare goods
5. Call this tool to capture the funds (full or partial amount)

PARTIAL CAPTURES:
You can capture less than the reserved amount by specifying a lower total. The remaining funds are released back to the customer. You cannot capture MORE than the reserved amount.

IMPORTANT:
- Must be called within 7 days of reservation or funds auto-release
- Can be called multiple times per payment, but total payment amount cannot exceed initial total 
- Payment must be in Reserved status
- Use the TransactionId from get_payment_state response`,
    {
      paymentId: z.string().describe('The Barion payment ID'),
      transactions: z.array(
        z.object({
          transactionId: z.string().describe('The transaction ID'),
          total: z.number().positive().describe('Amount to capture (must be positive)'),
        })
      ).describe('Array of transactions to finish'),
      format: z.enum(['json', 'markdown']).default('markdown').describe('Response format: "json" for full JSON response, "markdown" for human-readable summary'),
      detail: z.enum(['concise', 'detailed']).default('concise').describe('Detail level: "concise" for summary, "detailed" for complete information'),
    },
    {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    async (args) => {
      try {
        const result = await client.finishReservation(args);
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          (data: any, detail) => formatSuccessResponse(data, 'Reservation Captured', detail)
        );
        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: 'text',
              text: formatBarionError('Finish Reservation', error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Refund Payment
  server.tool(
    'refund_payment',
    `Refund a completed payment transaction, returning funds to the customer.

Issues a full or partial refund for a successfully completed payment (Status=Succeeded). The refund is processed immediately and funds are returned to the customer's original payment method.

WHEN TO USE:
- Customer requests a refund for returned goods or canceled service
- Need to correct an overcharge or billing error
- Partial refunds for damaged items or partial returns
- Order cancellation after payment was captured

REFUND TYPES:
- Full Refund: Specify the full transaction amount
- Partial Refund: Specify any amount up to the original transaction total
- Multiple Partial Refunds: You can refund multiple times until the full amount is refunded

WORKFLOW:
1. Use get_payment_state to verify payment Status=Succeeded
2. Retrieve the TransactionId from the payment state response
3. Call this tool with the PaymentId, TransactionId, and amount to refund
4. Optionally provide a comment explaining the refund reason (visible to customer)
5. Funds are returned to customer's account within 1-5 business days

LIMITATIONS:
- Can only refund Succeeded payments
- Cannot refund more than the original transaction amount
- Total refunds cannot exceed original transaction total
- Refund must be in the same currency as the original payment

TIP: Always include a descriptive comment to help with record-keeping and customer service. Examples: "Product returned - Defective item", "Order cancelled by customer", "Billing correction - overcharged by 10 EUR".`,
    {
      paymentId: z.string().describe('The Barion payment ID'),
      transactionId: z.string().describe('The transaction ID to refund'),
      amount: z.number().positive().describe('Amount to refund (must be positive, cannot exceed original transaction amount)'),
      comment: z.string().optional().describe('Optional comment for the refund'),
      format: z.enum(['json', 'markdown']).default('markdown').describe('Response format: "json" for full JSON response, "markdown" for human-readable summary'),
      detail: z.enum(['concise', 'detailed']).default('concise').describe('Detail level: "concise" for summary, "detailed" for complete information'),
    },
    {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    async (args) => {
      try {
        const result = await client.refundPayment(args);
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          (data: any, detail) => formatSuccessResponse(data, 'Refund Processed', detail)
        );
        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: 'text',
              text: formatBarionError('Refund Payment', error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Capture Payment
  server.tool(
    'capture_payment',
    `Capture a previously authorized payment to transfer funds from customer to merchant.

Finalizes a payment that was created with paymentType='DelayedCapture'. This captures the authorized funds and completes the transaction. Similar to finish_reservation but uses a different API endpoint specifically for DelayedCapture payment types.

WHEN TO USE:
- After creating a payment with paymentType='DelayedCapture' that completed successfully (Status=Authorized)
- When you're ready to finalize the transaction and capture the funds
- For business models requiring authorization before capture (pre-orders, custom manufacturing, etc.)

DIFFERENCE FROM FINISH_RESERVATION:
- finish_reservation: Used for paymentType='Reservation'
- capture_payment: Used for paymentType='DelayedCapture'
Both accomplish the same goal (capturing authorized funds) but use different API endpoints based on the original payment type.

WORKFLOW:
1. Create payment with start_payment using paymentType='DelayedCapture'
2. Customer completes payment (funds are authorized)
3. Use get_payment_state to verify Status=Authorized and get TransactionId
4. Provide service, manufacture goods, or complete your side of the transaction
5. Call this tool to capture the authorized funds (full or partial amount)

PARTIAL CAPTURES:
You can capture less than the authorized amount by specifying a lower total. The remaining authorization is released. You cannot capture MORE than the authorized amount.

IMPORTANT:
- Payment must be in Authorized status
- Use the TransactionId from get_payment_state response
- Can only be called once per payment
- Check Barion's time limits for DelayedCapture (varies by payment method)`,
    {
      paymentId: z.string().describe('The Barion payment ID'),
      transactions: z.array(
        z.object({
          transactionId: z.string().describe('The transaction ID'),
          total: z.number().positive().describe('Amount to capture (must be positive, cannot exceed authorized amount)'),
        })
      ).describe('Array of transactions to capture'),
      format: z.enum(['json', 'markdown']).default('markdown').describe('Response format: "json" for full JSON response, "markdown" for human-readable summary'),
      detail: z.enum(['concise', 'detailed']).default('concise').describe('Detail level: "concise" for summary, "detailed" for complete information'),
    },
    {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    async (args) => {
      try {
        const result = await client.capturePayment(args);
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          (data: any, detail) => formatSuccessResponse(data, 'Payment Captured', detail)
        );
        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: 'text',
              text: formatBarionError('Capture Payment', error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Cancel Authorization
  server.tool(
    'cancel_authorization',
    `Cancel an authorized payment and release the held funds back to the customer.

Cancels a payment that was created with paymentType='DelayedCapture' and is currently in Authorized status. This releases the authorization hold and returns the funds to the customer immediately. Use this when you decide not to capture an authorized payment.

WHEN TO USE:
- Order is cancelled before fulfillment
- Product is out of stock and cannot be delivered
- Customer requests cancellation of their order
- Unable to fulfill the service for any reason
- Fraud detection flags the transaction
- Want to release funds without waiting for automatic authorization expiry

WORKFLOW:
1. Payment was created with paymentType='DelayedCapture' and Status=Authorized
2. Decide not to proceed with capturing the payment
3. Call this tool with the PaymentId
4. Authorization is cancelled and funds are released immediately
5. Payment status changes to Canceled

ALTERNATIVE:
If you don't call this tool, the authorization will automatically expire based on the payment method's time limits (typically 7-30 days). However, calling this tool releases funds immediately rather than making the customer wait.

IMPORTANT:
- Can only cancel payments in Authorized status
- Cannot be used for Reservation payment type (those auto-release after 7 days)
- Cannot be undone - once cancelled, you cannot capture the funds
- If you need to charge the customer later, they must make a new payment

USE CASE EXAMPLE:
Customer orders a custom product. Payment is authorized (DelayedCapture). During manufacturing, you discover you cannot source materials. Cancel the authorization to immediately release customer's funds rather than making them wait for auto-expiry.`,
    {
      paymentId: z.string().describe('The Barion payment ID to cancel'),
      format: z.enum(['json', 'markdown']).default('markdown').describe('Response format: "json" for full JSON response, "markdown" for human-readable summary'),
      detail: z.enum(['concise', 'detailed']).default('concise').describe('Detail level: "concise" for summary, "detailed" for complete information'),
    },
    {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    async (args) => {
      try {
        const result = await client.cancelAuthorization(args);
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          (data: any, detail) => formatSuccessResponse(data, 'Authorization Cancelled', detail)
        );
        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: 'text',
              text: formatBarionError('Cancel Authorization', error),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
