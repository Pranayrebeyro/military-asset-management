import db from '../config/db.js';

// ============================================================
// CREATE ASSIGNMENT
// ============================================================

export const createAssignment = async (req, res) => {

    const {
        userId,
        baseId,
        equipmentTypeId,
        quantity
    } = req.body;

    const initiatedBy = req.user.userId;

    // ============================================================
    // VALIDATE INPUT
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
     * Can assign assets from any base.
     *
     * BASE_COMMANDER
     * --------------
     * Can assign assets only from their assigned base.
     *
     * LOGISTICS_OFFICER
     * -----------------
     * Currently not authorized by assignmentRoutes.js.
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
                    'You are not authorized to assign assets from this base'
            });
        }
    }

    const client = await db.connect();

    try {

        await client.query('BEGIN');

        // ========================================================
        // CHECK TARGET USER
        // ========================================================

        const userResult = await client.query(
            `SELECT
                id,
                username,
                role,
                base_id
             FROM users
             WHERE id = $1`,
            [userIdNumber]
        );

        if (userResult.rows.length === 0) {
            throw new Error('User not found');
        }

        const targetUser = userResult.rows[0];

        // ========================================================
        // CHECK TARGET USER BASE
        // ========================================================

        /*
         * A user receiving equipment must belong to
         * the same base from which the equipment is assigned.
         */

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
            `SELECT
                id,
                name,
                location
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
                name,
                category
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
        // LOCK ASSET
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

        if (assetResult.rows.length === 0) {
            throw new Error(
                'Asset not available at this base'
            );
        }

        const availableQuantity =
            assetResult.rows[0].quantity;

        // ========================================================
        // CHECK QUANTITY
        // ========================================================

        if (
            availableQuantity < quantityNumber
        ) {
            throw new Error(
                `Insufficient asset quantity. Available: ${availableQuantity}`
            );
        }

        // ========================================================
        // REDUCE INVENTORY
        // ========================================================

        await client.query(
            `UPDATE assets
             SET quantity = quantity - $1
             WHERE id = $2`,
            [
                quantityNumber,
                assetResult.rows[0].id
            ]
        );

        // ========================================================
        // RECORD ASSIGNMENT
        // ========================================================

        const assignmentResult =
            await client.query(
                `INSERT INTO assignments
                    (
                        user_id,
                        base_id,
                        equipment_type_id,
                        quantity
                    )
                 VALUES
                    ($1, $2, $3, $4)
                 RETURNING *`,
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
            `INSERT INTO audit_logs
                (
                    user_id,
                    action,
                    details
                )
             VALUES ($1, $2, $3)`,
            [
                initiatedBy,
                'ASSIGNMENT',
                `Assigned ${quantityNumber} equipment(s) of type ${equipmentTypeIdNumber} to user ${userIdNumber} at base ${baseIdNumber}`
            ]
        );

        // ========================================================
        // COMMIT
        // ========================================================

        await client.query('COMMIT');

        return res.status(201).json({
            message:
                'Assignment completed successfully',

            assignment:
                assignmentResult.rows[0]
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error(
            'Assignment failed:',
            error.message
        );

        return res.status(500).json({
            message:
                'Assignment failed',

            error:
                error.message
        });

    } finally {

        client.release();
    }
};


// ============================================================
// GET ASSIGNMENT HISTORY
// ============================================================

export const getAssignments = async (req, res) => {

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
                WHERE a.base_id = $1
            `;

            queryParams.push(
                req.user.baseId
            );
        }

        // ========================================================
        // GET ASSIGNMENT HISTORY
        // ========================================================

        const result = await db.query(
            `
            SELECT
                a.id,

                a.user_id,
                u.username,
                u.role,

                a.base_id,
                b.name AS base_name,
                b.location AS base_location,

                a.equipment_type_id,
                e.name AS equipment_name,
                e.category AS equipment_category,

                a.quantity,
                a.assigned_at

            FROM assignments a

            LEFT JOIN users u
                ON a.user_id = u.id

            LEFT JOIN bases b
                ON a.base_id = b.id

            LEFT JOIN equipment_types e
                ON a.equipment_type_id = e.id

            ${whereClause}

            ORDER BY
                a.assigned_at DESC
            `,
            queryParams
        );

        return res.status(200).json({
            assignments: result.rows
        });

    } catch (error) {

        console.error(
            'Failed to fetch assignments:',
            error.message
        );

        return res.status(500).json({
            message:
                'Failed to fetch assignment history',

            error:
                error.message
        });
    }
};