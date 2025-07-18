import { router } from '../trpc';
import { hrRouter } from './hr.router';
import { financeRouter } from './finance.router';
import { operationsRouter } from './operations.router';
import { corporateRouter } from './corporate.router';
import { creativeRouter } from './creative.router';
import { scoutRouter } from './scout.router';
import { authRouter } from './auth.router';
import { transactionRouter } from './transaction.router';

export const appRouter = router({
  auth: authRouter,
  hr: hrRouter,
  finance: financeRouter,
  operations: operationsRouter,
  corporate: corporateRouter,
  creative: creativeRouter,
  scout: scoutRouter,
  transaction: transactionRouter,
});

export type AppRouter = typeof appRouter;