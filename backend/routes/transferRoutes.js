import express from 'express';

import {
    createTransfer,
    getTransfers
} from '../controllers/transferController.js';

import {
    authenticateToken
} from '../middlewares/authMiddleware.js';

import {
    authorizeRoles
} from '../middlewares/rbacMiddleware.js';

const router = express.Router();


// ============================================================
// GET TRANSFER HISTORY
// ============================================================

router.get(
    '/',
    authenticateToken,
    authorizeRoles(
        'ADMIN',
        'BASE_COMMANDER',
        'LOGISTICS_OFFICER'
    ),
    getTransfers
);


// ============================================================
// CREATE TRANSFER
// ============================================================

router.post(
    '/',
    authenticateToken,
    authorizeRoles(
        'ADMIN',
        'BASE_COMMANDER',
        'LOGISTICS_OFFICER'
    ),
    createTransfer
);

export default router;