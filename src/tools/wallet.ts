import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WalletClient } from '../utils/wallet-client.js';
import { formatResponse, formatWalletAccounts, formatWalletStatement, formatSuccessResponse } from '../utils/response-formatter.js';
import { formatBarionError } from '../utils/error-handler.js';

export function configureWalletTools(server: McpServer, apiKey: string, environment: 'test' | 'prod' = 'test') {
  const client = new WalletClient(apiKey, environment);

  // Tool: Get Accounts
  server.tool(
    'get_wallet_accounts',
    `Get all wallet accounts associated with this Barion user.

Retrieves a list of all wallet accounts (currency accounts) belonging to the authenticated user. Each Barion wallet can have multiple accounts for different currencies (HUF, EUR, USD, CZK).

WHAT YOU GET:
- Account ID: Unique identifier for each currency account
- Currency: The currency code (HUF, EUR, USD, CZK)
- Balance: Current available balance in that currency
- Owner: Email address of the account owner

WHEN TO USE:
- Check which currencies you have accounts for
- Get account IDs needed for send_money operations
- View all balances across all currencies at once
- Before sending money, to verify you have an account in the desired currency

WORKFLOW EXAMPLES:
1. Before sending money: Call this to find the account ID for the currency you want to send
2. Balance check: See all your balances across all currencies
3. Account verification: Confirm you have an account in a specific currency before attempting operations

TIP: The returned Account IDs are used in send_money (sourceAccountId parameter). If you don't provide a sourceAccountId to send_money, it will automatically use the first account matching the currency.`,
    {
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
        const result = await client.getAccounts();
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          formatWalletAccounts
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
              text: formatBarionError('Get Wallet Accounts', error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Get Balance
  server.tool(
    'get_wallet_balance',
    `Get wallet balance for a specific currency or view all currency balances.

Retrieves the current available balance in your Barion wallet. You can either get the balance for a specific currency or get all balances across all your currency accounts.

PARAMETERS:
- currency (optional): Specify a currency code (HUF, EUR, USD, CZK) to get balance for just that currency. If omitted, returns all currency accounts with their balances.

WHEN TO USE:
- Before making a payment or withdrawal, verify you have sufficient funds
- Regular balance monitoring and reconciliation
- Quick balance check for a specific currency
- Financial reporting and accounting

RESPONSE:
Returns account information including the Balance field showing available funds. If you specify a currency, returns only accounts matching that currency. If no currency specified, returns all accounts.

EXAMPLE SCENARIOS:
1. "Do I have enough EUR to withdraw 500?" → get_wallet_balance with currency="EUR"
2. "Show all my balances" → get_wallet_balance with no currency parameter
3. "Can I send 10,000 HUF?" → get_wallet_balance with currency="HUF", check if Balance >= 10000

TIP: This tool uses the same underlying API as get_wallet_accounts but filters by currency if specified. For comprehensive account information including Account IDs, use get_wallet_accounts instead.`,
    {
      currency: z.enum(['HUF', 'EUR', 'USD', 'CZK']).optional().describe('Currency code: HUF (Hungarian Forint), EUR (Euro), USD (US Dollar), or CZK (Czech Koruna). Optional.'),
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
        const result = await client.getBalance(args.currency);
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          formatWalletAccounts
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
              text: formatBarionError('Get Wallet Balance', error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Get Statement
  server.tool(
    'get_wallet_statement',
    `Get wallet transaction history (statement) for a specific month.

Retrieves a detailed transaction history for your Barion wallet for a specified month. Shows all incoming and outgoing transactions including payments, withdrawals, transfers, fees, and refunds.

PARAMETERS:
- year: The year (e.g., 2025)
- month: The month number (1-12, where 1=January, 12=December)
- currency (optional): Filter to show only transactions in a specific currency

TRANSACTION INFORMATION:
- Transaction ID: Unique identifier for each transaction
- Type: Transaction type (Payment, Withdrawal, Transfer, Fee, Refund, etc.)
- Amount: Transaction amount (positive for incoming, negative for outgoing)
- Currency: Currency of the transaction
- Transaction Time: When the transaction occurred
- Comment: Description or note about the transaction

WHEN TO USE:
- Monthly reconciliation and accounting
- Review transaction history for a specific period
- Track income and expenses
- Audit trail and record-keeping
- Prepare financial reports
- Investigate specific transactions

LIMITATIONS:
- Can only retrieve one month at a time
- Historical data availability depends on Barion's data retention policy
- Large result sets may return many transactions - consider filtering by currency

EXAMPLE SCENARIOS:
1. "Show all transactions from January 2025" → year=2025, month=1
2. "EUR transactions in December 2024" → year=2024, month=12, currency="EUR"
3. "Review last month's wallet activity" → year=current year, month=previous month

TIP: For recent activity across all currencies, call without currency parameter. For specific currency analysis (e.g., tracking EUR income), include the currency filter to reduce noise.`,
    {
      year: z.number().describe('Year (e.g., 2025)'),
      month: z.number().min(1).max(12).describe('Month (1-12)'),
      currency: z.enum(['HUF', 'EUR', 'USD', 'CZK']).optional().describe('Currency code: HUF (Hungarian Forint), EUR (Euro), USD (US Dollar), or CZK (Czech Koruna). Optional.'),
      format: z.enum(['json', 'markdown']).default('markdown').describe('Response format: "json" for full JSON response, "markdown" for human-readable summary'),
      detail: z.enum(['concise', 'detailed']).default('concise').describe('Detail level: "concise" for summary (first 10 transactions), "detailed" for all transactions'),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async (args) => {
      try {
        const result = await client.getStatement({
          year: args.year,
          month: args.month,
          currency: args.currency,
        });
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          formatWalletStatement
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
              text: formatBarionError('Get Wallet Statement', error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Withdraw
  server.tool(
    'withdraw_to_bank',
    `Withdraw funds from your Barion wallet to a bank account.

Transfers money from your Barion wallet to a specified external bank account. You must provide complete bank account details with each withdrawal request. The withdrawal is processed and funds typically arrive within 1-3 business days depending on the bank and currency.

PARAMETERS:
- currency: Currency code (HUF, EUR, USD, CZK)
- amount: Amount to withdraw (must be positive and not exceed your available balance)
- accountNumber: Full bank account number (IBAN for European accounts, or local account number format)
- accountHolderName: Full name of the bank account holder (recipient name)
- swift: SWIFT/BIC code of the recipient's bank (e.g., "GIBAATWWXXX" for Erste Bank Austria)
- comment (optional): Note or description for the withdrawal (for your records)

BANK ACCOUNT DETAILS REQUIRED:
Each withdrawal requires you to specify the complete bank account information. Barion does not store bank accounts - you must provide full details every time.

ACCOUNT NUMBER FORMATS:
- IBAN (International): Use full IBAN for European accounts (e.g., "DE89370400440532013000")
- Local format: For non-IBAN countries, use the local account number format
- HUF accounts: Hungarian account numbers (e.g., "11111111-22222222-33333333")

SWIFT/BIC CODE:
The SWIFT code identifies the recipient's bank. Required for all international transfers. Examples:
- "GIBAATWWXXX" - Erste Bank Austria
- "DEUTDEFFXXX" - Deutsche Bank Germany
- "OTPVHUHB" - OTP Bank Hungary

PREREQUISITES:
1. Your wallet must have sufficient balance in the specified currency
2. You must know the complete bank account details (account number, holder name, SWIFT)
3. The bank account must be able to receive the specified currency

WORKFLOW:
1. Call get_wallet_balance to verify you have sufficient funds
2. Gather complete bank account details (account number, account holder name, SWIFT code)
3. Call this tool with the currency, amount, and complete bank account details
4. Withdrawal is processed and funds transferred to the specified bank account

PROCESSING TIME:
- HUF withdrawals: 1-2 business days
- EUR/USD/CZK withdrawals: 2-3 business days
- International transfers may take longer

FEES:
Barion may charge withdrawal fees depending on your account type and withdrawal amount. Check Barion's fee schedule for current rates.

LIMITS:
- Minimum withdrawal amounts may apply per currency
- Daily/monthly withdrawal limits may apply based on account verification level
- Cannot withdraw more than available balance

EXAMPLE:
Withdraw 1000 EUR to a European bank account:
1. get_wallet_balance with currency="EUR" → verify balance >= 1000
2. withdraw_to_bank with:
   - currency="EUR"
   - amount=1000
   - accountNumber="DE89370400440532013000"
   - accountHolderName="John Doe"
   - swift="DEUTDEFFXXX"
   - comment="Monthly withdrawal"

IMPORTANT:
- Double-check all bank account details before submitting - incorrect details may result in failed transfers or lost funds
- Account holder name should match the name registered with the bank
- SWIFT code must be valid for the recipient's bank`,
    {
      currency: z.enum(['HUF', 'EUR', 'USD', 'CZK']).describe('Currency code: HUF (Hungarian Forint), EUR (Euro), USD (US Dollar), or CZK (Czech Koruna)'),
      amount: z.number().positive().describe('Amount to withdraw (must be positive and not exceed available balance)'),
      accountNumber: z.string().describe('Full bank account number (IBAN for European accounts, e.g., "DE89370400440532013000", or local format)'),
      accountHolderName: z.string().describe('Full name of the bank account holder/recipient (must match bank records)'),
      swift: z.string().describe('SWIFT/BIC code of the recipient\'s bank (e.g., "DEUTDEFFXXX" for Deutsche Bank Germany)'),
      comment: z.string().optional().describe('Optional comment for the withdrawal (for your records)'),
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
        const result = await client.withdraw({
          currency: args.currency,
          amount: args.amount,
          accountNumber: args.accountNumber,
          accountHolderName: args.accountHolderName,
          swift: args.swift,
          comment: args.comment,
        });
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          (data: any, detail) => formatSuccessResponse(data, 'Withdrawal Initiated', detail)
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
              text: formatBarionError('Withdraw to Bank', error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Get User History
  server.tool(
    'get_user_history',
    `Get user transaction history with flexible filtering and pagination options.

Retrieves transactions based on time, pagination, currency filter, and result limit. Supports incremental synchronization, pagination through history, and filtering by currency.

PARAMETERS:
- lastRequestTime (optional): ISO 8601 timestamp (e.g., "2025-10-08T12:30:22.955Z") - returns transactions after or at this time
- lastVisibleItemId (optional): Transaction ID (GUID) - for pagination, returns only transactions older than this transaction
- limit (optional): Number of transactions to return (default: 20, maximum: 20)
- currency (optional): Filter by currency - CZK, EUR, HUF, USD, RON, or PLN

PAGINATION:
The API returns a maximum of 20 transactions per request. To get more transactions:
1. Use lastRequestTime to get recent transactions
2. Use lastVisibleItemId with the ID of the oldest transaction from previous response to get older transactions
3. Repeat step 2 until no more transactions are returned

TRANSACTION INFORMATION:
- Transaction ID: Unique identifier for each transaction (use for pagination)
- Type: Transaction type (Payment, Withdrawal, Transfer, Fee, Refund, etc.)
- Amount: Transaction amount (positive for incoming, negative for outgoing)
- Currency: Currency of the transaction
- Transaction Time: When the transaction occurred
- Comment: Description or note about the transaction

WHEN TO USE:
- Get all transactions since your last check (incremental sync) - use lastRequestTime
- Paginate through complete history - use lastVisibleItemId
- Filter by currency - use currency parameter
- Limit results - use limit parameter (max 20)

DIFFERENCE FROM get_wallet_statement:
- get_wallet_statement: Returns transactions for a specific month (Year/Month parameters)
- get_user_history: Returns transactions with flexible time-based filtering and pagination

EXAMPLE SCENARIOS:
1. "Get transactions since yesterday" → lastRequestTime="2025-10-07T00:00:00.000Z"
2. "Get EUR transactions since last week" → lastRequestTime="2025-10-01T00:00:00.000Z", currency="EUR"
3. "Get next 20 older transactions" → lastVisibleItemId="transaction-id-from-previous-response"
4. "Get last 10 transactions" → limit=10 (with lastRequestTime or currency)

TIP: At least one parameter (lastRequestTime, lastVisibleItemId, or currency) must be provided. Use pagination with lastVisibleItemId to retrieve complete transaction history beyond the 20-item limit.`,
    {
      lastRequestTime: z.string().optional().describe('ISO 8601 timestamp (e.g., "2025-10-08T12:30:22.955Z") - returns transactions after or at this time. Optional, but at least one parameter must be provided.'),
      lastVisibleItemId: z.string().optional().describe('Transaction ID (GUID) for pagination - returns only transactions older than this transaction. Use the ID of the oldest transaction from a previous response to get older transactions.'),
      limit: z.number().int().min(1).max(20).optional().describe('Number of transactions to return (default: 20, maximum: 20). If greater than 20, the default value of 20 will be used.'),
      currency: z.enum(['HUF', 'EUR', 'USD', 'CZK', 'RON', 'PLN']).optional().describe('Filter by currency - only transactions in this currency will be returned. Accepted values: CZK, EUR, HUF, USD, RON, PLN.'),
      format: z.enum(['json', 'markdown']).default('markdown').describe('Response format: "json" for full JSON response, "markdown" for human-readable summary'),
      detail: z.enum(['concise', 'detailed']).default('concise').describe('Detail level: "concise" for summary (first 10 transactions), "detailed" for all transactions'),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async (args) => {
      try {
        const result = await client.getUserHistory({
          lastRequestTime: args.lastRequestTime,
          lastVisibleItemId: args.lastVisibleItemId,
          limit: args.limit,
          currency: args.currency,
        });
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          formatWalletStatement
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
              text: formatBarionError('Get User History', error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: Send Money
  server.tool(
    'send_money',
    `Send money to another Barion user by email address.

Transfers funds from your Barion wallet to another person's Barion wallet using their email address. This is a peer-to-peer transfer within the Barion ecosystem.

RECIPIENT HANDLING:
- If recipient HAS a Barion account: Funds transfer immediately to their wallet
- If recipient DOES NOT have Barion: They receive an email notification and have 7 days to register and claim the funds
- If not claimed in 7 days: Funds are automatically returned to your wallet

PARAMETERS:
- recipientEmail: Email address of the person receiving the money (they'll receive notification)
- currency: Currency code (CZK, EUR, HUF, USD) - must match your account currency
- amount: Amount to send (must be positive and not exceed your balance)
- comment (optional): Message or note to the recipient (max 1000 characters)
- sourceAccountId (optional): Which of your accounts to send from (auto-selected if not provided)

WORKFLOW:
1. Verify you have sufficient balance with get_wallet_balance
2. Call this tool with recipient email and amount
3. If sourceAccountId not provided, the tool automatically uses the first account matching the currency
4. Funds are transferred (or held for claim if recipient not registered)
5. Both parties receive email confirmation

AUTO-SELECTION OF SOURCE ACCOUNT:
If you don't specify sourceAccountId, the tool will:
1. Get all your wallet accounts
2. Find the first account matching the specified currency
3. Use that account for the transfer
If you have multiple accounts in the same currency and want to use a specific one, get the account ID from get_wallet_accounts and provide it.

USE CASES:
- Send money to friends or family
- Pay another Barion merchant
- Split bills or expenses
- Refund a customer
- Gift money

FEES:
Sending money to other Barion users is typically free, but check Barion's current fee schedule for your account type.

EXAMPLE:
Send 50 EUR to a friend:
1. get_wallet_balance with currency="EUR" → verify balance >= 50
2. send_money with recipientEmail="friend@example.com", currency="EUR", amount=50, comment="Dinner split"

IMPORTANT:
- Cannot send to yourself
- Recipient email will be notified
- Comment is visible to recipient
- Transaction is immediate and cannot be reversed (contact recipient for refund if needed)`,
    {
      recipientEmail: z.string().email().describe('Email address of the recipient'),
      currency: z.enum(['HUF', 'EUR', 'USD', 'CZK']).describe('Currency code: HUF (Hungarian Forint), EUR (Euro), USD (US Dollar), or CZK (Czech Koruna)'),
      amount: z.number().positive().describe('Amount to send (must be positive and not exceed available balance)'),
      comment: z.string().optional().describe('Optional comment for the transfer (max 1000 characters)'),
      sourceAccountId: z.string().optional().describe('Optional: Source account ID. If not provided, uses first account with matching currency'),
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
        const result = await client.sendMoney({
          recipientEmail: args.recipientEmail,
          currency: args.currency,
          amount: args.amount,
          comment: args.comment,
          sourceAccountId: args.sourceAccountId,
        });
        const formatted = formatResponse(
          result,
          args.format,
          args.detail,
          (data: any, detail) => formatSuccessResponse(data, 'Money Sent', detail)
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
              text: formatBarionError('Send Money', error),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
