import db from '../config/db.js';

// ============================================================
// CREATE PURCHASE
// ============================================================

export const createPurchase = async (req, res) => {

    const {
        baseId,
        equipmentTypeId,
        quantity
    } = req.body;

    const userId = req.user.userId;

    // ============================================================
    // VALIDATE REQUEST
    // ============================================================

    if (
        baseId === undefined ||
        equipmentTypeId === undefined ||
        quantity === undefined
    ) {
        return res.status(400).json({
            message:
                'baseId, equipmentTypeId and quantity are required'
        });
    }

    const baseIdNumber = Number(baseId);
    const equipmentTypeIdNumber = Number(equipmentTypeId);
    const quantityNumber = Number(quantity);

    if (
        !Number.isInteger(baseIdNumber) ||
        baseIdNumber <= 0
    ) {
        return res.status(400).json({
            message: 'Invalid baseId'
        });
    }

    if (
        !Number.isInteger(equipmentTypeIdNumber) ||
        equipmentTypeIdNumber <= 0
    ) {
        return res.status(400).json({
            message: 'Invalid equipmentTypeId'
        });
    }

    if (
        !Number.isInteger(quantityNumber) ||
        quantityNumber <= 0
    ) {
        return res.status(400).json({
            message:
                'Quantity must be a positive integer'
        });
    }

    // ============================================================
    // BASE-LEVEL AUTHORIZATION
    // ============================================================

    /*
     * ADMIN
     * -----
     * Can purchase for any base.
     *
     * BASE_COMMANDER
     * --------------
     * Can purchase only for their assigned base.
     *
     * LOGISTICS_OFFICER
     * -----------------
     * Currently allowed for all bases.
     */

    if (req.user.role === 'BASE_COMMANDER') {

        if (!req.user.baseId) {
            return res.status(403).json({
                message:
                    'Base Commander is not assigned to a base'
            });
        }

        if (
            baseIdNumber !== req.user.baseId
        ) {
            return res.status(403).json({
                message:
                    'You are not authorized to purchase for this base'
            });
        }
    }

    const client = await db.connect();

    try {

        await client.query('BEGIN');

        // ========================================================
        // CHECK BASE
        // ========================================================

        const baseResult = await client.query(
            `SELECT
                id,
                name
             FROM bases
             WHERE id = $1`,
            [baseIdNumber]
        );

        if (baseResult.rows.length === 0) {
            throw new Error('Base not found');
        }

        // ========================================================
        // CHECK EQUIPMENT TYPE
        // ========================================================

        const equipmentResult = await client.query(
            `SELECT
                id,
                name
             FROM equipment_types
             WHERE id = $1`,
            [equipmentTypeIdNumber]
        );

        if (equipmentResult.rows.length === 0) {
            throw new Error(
                'Equipment type not found'
            );
        }

        // ========================================================
        // RECORD PURCHASE
        // ========================================================

        const purchaseResult = await client.query(
            `INSERT INTO purchases
                (
                    base_id,
                    equipment_type_id,
                    quantity
                )
             VALUES ($1, $2, $3)
             RETURNING *`,
            [
                baseIdNumber,
                equipmentTypeIdNumber,
                quantityNumber
            ]
        );

        // ========================================================
        // CHECK EXISTING ASSET STOCK
        // ========================================================

        const assetResult = await client.query(
            `SELECT
                id,
                quantity
             FROM assets
             WHERE base_id = $1
             AND equipment_type_id = $2
             FOR UPDATE`,
            [
                baseIdNumber,
                equipmentTypeIdNumber
            ]
        );

        // ========================================================
        // UPDATE EXISTING STOCK
        // ========================================================

        if (assetResult.rows.length > 0) {

            await client.query(
                `UPDATE assets
                 SET quantity = quantity + $1
                 WHERE id = $2`,
                [
                    quantityNumber,
                    assetResult.rows[0].id
                ]
            );

        }

        // ========================================================
        // CREATE NEW STOCK
        // ========================================================

        else {

            await client.query(
                `INSERT INTO assets
                    (
                        base_id,
                        equipment_type_id,
                        quantity
                    )
                 VALUES ($1, $2, $3)`,
                [
                    baseIdNumber,
                    equipmentTypeIdNumber,
                    quantityNumber
                ]
            );
        }

        // ========================================================
        // AUDIT LOG
        // ========================================================

        await client.query(
            `INSERT INTO audit_logs
                (
                    user_id,
                    action,
                    details
                )
             VALUES ($1, $2, $3)`,
            [
                userId,
                'PURCHASE',
                `Purchased ${quantityNumber} equipment(s) of type ${equipmentTypeIdNumber} for base ${baseIdNumber}`
            ]
        );

        // ========================================================
        // COMMIT
        // ========================================================

        await client.query('COMMIT');

        return res.status(201).json({
            message:
                'Purchase completed successfully',

            purchase:
                purchaseResult.rows[0]
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error(
            'Purchase failed:',
            error.message
        );

        return res.status(500).json({
            message: 'Purchase failed',
            error: error.message
        });

    } finally {

        client.release();
    }
};


// ============================================================
// GET PURCHASE HISTORY
// ============================================================

export const getPurchases = async (req, res) => {

    try {

        /*
         * ADMIN and LOGISTICS_OFFICER:
         * --------------------------------
         * Can see purchases from all bases.
         *
         * BASE_COMMANDER:
         * --------------------------------
         * Can see purchases only from their
         * assigned base.
         */

        let baseCondition = '';
        const queryParams = [];

        if (req.user.role === 'BASE_COMMANDER') {

            if (!req.user.baseId) {
                return res.status(403).json({
                    message:
                        'Base Commander is not assigned to a base'
                });
            }

            baseCondition = `
                WHERE p.base_id = $1
            `;

            queryParams.push(req.user.baseId);
        }

        const result = await db.query(
            `
            SELECT
                p.id,
                p.base_id,
                b.name AS base_name,
                b.location AS base_location,
                p.equipment_type_id,
                e.name AS equipment_name,
                e.category AS equipment_category,
                p.quantity,
                p.created_at

            FROM purchases p

            LEFT JOIN bases b
                ON p.base_id = b.id

            LEFT JOIN equipment_types e
                ON p.equipment_type_id = e.id

            ${baseCondition}

            ORDER BY p.created_at DESC
            `,
            queryParams
        );

        return res.status(200).json({
            purchases: result.rows
        });

    } catch (error) {

        console.error(
            'Failed to fetch purchases:',
            error.message
        );

        return res.status(500).json({
            message:
                'Failed to fetch purchases',

            error:
                error.message
        });
    }
};