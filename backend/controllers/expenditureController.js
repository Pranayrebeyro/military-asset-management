import db from '../config/db.js';

// ============================================================
// CREATE EXPENDITURE
// ============================================================

export const createExpenditure = async (req, res) => {

    const {
        userId,
        baseId,
        equipmentTypeId,
        quantity
    } = req.body;

    const initiatedBy = req.user.userId;

    // ============================================================
    // VALIDATE REQUIRED FIELDS
    // ============================================================

    if (
        userId === undefined ||
        baseId === undefined ||
        equipmentTypeId === undefined ||
        quantity === undefined
    ) {
        return res.status(400).json({
            message:
                'userId, baseId, equipmentTypeId and quantity are required'
        });
    }

    const userIdNumber = Number(userId);
    const baseIdNumber = Number(baseId);
    const equipmentTypeIdNumber = Number(equipmentTypeId);
    const quantityNumber = Number(quantity);

    // ============================================================
    // VALIDATE IDs
    // ============================================================

    if (
        !Number.isInteger(userIdNumber) ||
        userIdNumber <= 0
    ) {
        return res.status(400).json({
            message: 'Invalid userId'
        });
    }

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
     * Can record expenditure for any base.
     *
     * BASE_COMMANDER
     * --------------
     * Can record expenditure only for their
     * assigned base.
     *
     * LOGISTICS_OFFICER
     * -----------------
     * Currently allowed by expenditureRoutes.js.
     */

    if (
        req.user.role === 'BASE_COMMANDER'
    ) {

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
                    'You are not authorized to record expenditure for this base'
            });
        }
    }

    const client = await db.connect();

    try {

        await client.query('BEGIN');

        // ========================================================
        // CHECK USER
        // ========================================================

        const userResult = await client.query(
            `
            SELECT
                id,
                username,
                role,
                base_id
            FROM users
            WHERE id = $1
            `,
            [userIdNumber]
        );

        if (userResult.rows.length === 0) {
            throw new Error(
                'User not found'
            );
        }

        const targetUser =
            userResult.rows[0];

        // ========================================================
        // CHECK TARGET USER BASE
        // ========================================================

        if (
            targetUser.base_id !== baseIdNumber
        ) {
            throw new Error(
                'User does not belong to the selected base'
            );
        }

        // ========================================================
        // CHECK BASE
        // ========================================================

        const baseResult = await client.query(
            `
            SELECT
                id,
                name,
                location
            FROM bases
            WHERE id = $1
            `,
            [baseIdNumber]
        );

        if (baseResult.rows.length === 0) {
            throw new Error(
                'Base not found'
            );
        }

        // ========================================================
        // CHECK EQUIPMENT TYPE
        // ========================================================

        const equipmentResult =
            await client.query(
                `
                SELECT
                    id,
                    name,
                    category
                FROM equipment_types
                WHERE id = $1
                `,
                [equipmentTypeIdNumber]
            );

        if (
            equipmentResult.rows.length === 0
        ) {
            throw new Error(
                'Equipment type not found'
            );
        }

        // ========================================================
        // CHECK AVAILABLE ASSET
        // ========================================================

        const assetResult = await client.query(
            `
            SELECT
                id,
                quantity
            FROM assets
            WHERE base_id = $1
              AND equipment_type_id = $2
            FOR UPDATE
            `,
            [
                baseIdNumber,
                equipmentTypeIdNumber
            ]
        );

        if (
            assetResult.rows.length === 0
        ) {
            throw new Error(
                'Asset not available at this base'
            );
        }

        const availableQuantity =
            assetResult.rows[0].quantity;

        // ========================================================
        // CHECK AVAILABLE QUANTITY
        // ========================================================

        if (
            availableQuantity <
            quantityNumber
        ) {
            throw new Error(
                `Insufficient asset quantity. Available: ${availableQuantity}`
            );
        }

        // ========================================================
        // REDUCE ASSET INVENTORY
        // ========================================================

        await client.query(
            `
            UPDATE assets
            SET quantity = quantity - $1
            WHERE id = $2
            `,
            [
                quantityNumber,
                assetResult.rows[0].id
            ]
        );

        // ========================================================
        // RECORD EXPENDITURE
        // ========================================================

        const expenditureResult =
            await client.query(
                `
                INSERT INTO expenditures
                    (
                        user_id,
                        base_id,
                        equipment_type_id,
                        quantity
                    )
                VALUES
                    ($1, $2, $3, $4)
                RETURNING *
                `,
                [
                    userIdNumber,
                    baseIdNumber,
                    equipmentTypeIdNumber,
                    quantityNumber
                ]
            );

        // ========================================================
        // AUDIT LOG
        // ========================================================

        await client.query(
            `
            INSERT INTO audit_logs
                (
                    user_id,
                    action,
                    details
                )
            VALUES ($1, $2, $3)
            `,
            [
                initiatedBy,
                'EXPENDITURE',
                `Expended ${quantityNumber} equipment(s) of type ${equipmentTypeIdNumber} at base ${baseIdNumber} for user ${userIdNumber}`
            ]
        );

        // ========================================================
        // COMMIT
        // ========================================================

        await client.query('COMMIT');

        return res.status(201).json({
            message:
                'Expenditure recorded successfully',

            expenditure:
                expenditureResult.rows[0]
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error(
            'Expenditure failed:',
            error.message
        );

        return res.status(500).json({
            message:
                'Expenditure failed',

            error:
                error.message
        });

    } finally {

        client.release();
    }
};


// ============================================================
// GET EXPENDITURE HISTORY
// ============================================================

export const getExpenditures = async (req, res) => {

    try {

        let whereClause = '';
        const queryParams = [];

        // ========================================================
        // BASE COMMANDER FILTER
        // ========================================================

        if (
            req.user.role === 'BASE_COMMANDER'
        ) {

            if (!req.user.baseId) {
                return res.status(403).json({
                    message:
                        'Base Commander is not assigned to a base'
                });
            }

            whereClause = `
                WHERE e.base_id = $1
            `;

            queryParams.push(
                req.user.baseId
            );
        }

        // ========================================================
        // FETCH EXPENDITURE HISTORY
        // ========================================================

        const result = await db.query(
            `
            SELECT
                e.id,

                e.user_id,
                u.username,
                u.role,

                e.base_id,
                b.name AS base_name,
                b.location AS base_location,

                e.equipment_type_id,
                et.name AS equipment_name,
                et.category AS equipment_category,

                e.quantity,
                e.expended_at

            FROM expenditures e

            LEFT JOIN users u
                ON e.user_id = u.id

            LEFT JOIN bases b
                ON e.base_id = b.id

            LEFT JOIN equipment_types et
                ON e.equipment_type_id = et.id

            ${whereClause}

            ORDER BY
                e.expended_at DESC
            `,
            queryParams
        );

        return res.status(200).json({
            expenditures: result.rows
        });

    } catch (error) {

        console.error(
            'Failed to fetch expenditures:',
            error.message
        );

        return res.status(500).json({
            message:
                'Failed to fetch expenditures',

            error:
                error.message
        });
    }
};