import { Router } from 'express';
import transactionsRouter from './transactions';

const router = Router();

// Mount all route modules
router.use(transactionsRouter);

export default router;