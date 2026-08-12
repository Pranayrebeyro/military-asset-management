import express from 'express';

import {
    getBases,
    getEquipmentTypes,
    getUsers
} from '../controllers/lookupController.js';

import {
    authenticateToken
} from '../middlewares/authMiddleware.js';

import {
    authorizeRoles
} from '../middlewares/rbacMiddleware.js';

const router = express.Router();


// ============================================================
// BASES
// ============================================================

router.get(
    '/bases',
    authenticateToken,
    authorizeRoles(
        'ADMIN',
        'BASE_COMMANDER',
        'LOGISTICS_OFFICER'
    ),
    getBases
);


// ============================================================
// EQUIPMENT TYPES
// ============================================================

router.get(
    '/equipment-types',
    authenticateToken,
    authorizeRoles(
        'ADMIN',
        'BASE_COMMANDER',
        'LOGISTICS_OFFICER'
    ),
    getEquipmentTypes
);


// ============================================================
// USERS
// ============================================================

router.get(
    '/users',
    authenticateToken,
    authorizeRoles(
        'ADMIN',
        'BASE_COMMANDER'
    ),
    getUsers
);

export default router;