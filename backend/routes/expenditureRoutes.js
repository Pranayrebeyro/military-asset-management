import express from 'express';

import {
    createExpenditure,
    getExpenditures
} from '../controllers/expenditureController.js';

import { authenticateToken }
from '../middlewares/authMiddleware.js';

import { authorizeRoles }
from '../middlewares/rbacMiddleware.js';

const router = express.Router();


// ============================================================
// GET EXPENDITURE HISTORY
// ============================================================

router.get(
    '/',
    authenticateToken,
    authorizeRoles(
        'ADMIN',
        'BASE_COMMANDER',
        'LOGISTICS_OFFICER'
    ),
    getExpenditures
);


// ============================================================
// CREATE EXPENDITURE
// ============================================================

router.post(
    '/',
    authenticateToken,
    authorizeRoles(
        'ADMIN',
        'BASE_COMMANDER',
        'LOGISTICS_OFFICER'
    ),
    createExpenditure
);


export default router;