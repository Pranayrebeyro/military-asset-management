import db from '../config/db.js';

// ============================================================
// CREATE TRANSFER
// ============================================================

export const createTransfer = async (req, res) => {

    const {
        source_base_id,
        destination_base_id,
        equipment_type_id,
        quantity
    } = req.body;

    const initiated_by = req.user.userId;

    // ============================================================
    // VALIDATE INPUT
    // ============================================================

    if (
        source_base_id === undefined ||
        destination_base_id === undefined ||
        equipment_type_id === undefined ||
        quantity === undefined
    ) {
        return res.status(400).json({
            message:
                'source_base_id, destination_base_id, equipment_type_id and quantity are required'
        });
    }

    const sourceBaseId = Number(source_base_id);
    const destinationBaseId = Number(destination_base_id);
    const equipmentTypeId = Number(equipment_type_id);
    const quantityNumber = Number(quantity);

    if (
        !Number.isInteger(sourceBaseId) ||
        sourceBaseId <= 0
    ) {
        return res.status(400).json({
            message: 'Invalid source_base_id'
        });
    }

    if (
        !Number.isInteger(destinationBaseId) ||
        destinationBaseId <= 0
    ) {
        return res.status(400).json({
            message: 'Invalid destination_base_id'
        });
    }

    if (
        !Number.isInteger(equipmentTypeId) ||
        equipmentTypeId <= 0
    ) {
        return res.status(400).json({
            message: 'Invalid equipment_type_id'
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
    // SOURCE AND DESTINATION VALIDATION
    // ============================================================

    if (
        sourceBaseId === destinationBaseId
    ) {
        return res.status(400).json({
            message:
                'Source and destination bases must be different'
        });
    }

    // ============================================================
    // BASE-LEVEL AUTHORIZATION
    // ============================================================

    /*
     * ADMIN
     * -----
     * Can transfer from any base.
     *
     * BASE_COMMANDER
     * --------------
     * Can transfer only FROM their assigned base.
     *
     * They can transfer assets from their own base
     * to another base.
     *
     * LOGISTICS_OFFICER
     * -----------------
     * Currently allowed for all bases.
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
            sourceBaseId !== req.user.baseId
        ) {
            return res.status(403).json({
                message:
                    'You are not authorized to transfer assets from this base'
            });
        }
    }

    const client = await db.connect();

    try {

        await client.query('BEGIN');

        // ========================================================
        // CHECK SOURCE BASE
        // ========================================================

        const sourceBaseResult =
            await client.query(
                `SELECT
                    id,
                    name
                 FROM bases
                 WHERE id = $1`,
                [sourceBaseId]
            );

        if (
            sourceBaseResult.rows.length === 0
        ) {
            throw new Error(
                'Source base not found'
            );
        }

        // ========================================================
        // CHECK DESTINATION BASE
        // ========================================================

        const destinationBaseResult =
            await client.query(
                `SELECT
                    id,
                    name
                 FROM bases
                 WHERE id = $1`,
                [destinationBaseId]
            );

        if (
            destinationBaseResult.rows.length === 0
        ) {
            throw new Error(
                'Destination base not found'
            );
        }

        // ========================================================
        // CHECK EQUIPMENT TYPE
        // ========================================================

        const equipmentResult =
            await client.query(
                `SELECT
                    id,
                    name
                 FROM equipment_types
                 WHERE id = $1`,
                [equipmentTypeId]
            );

        if (
            equipmentResult.rows.length === 0
        ) {
            throw new Error(
                'Equipment type not found'
            );
        }

        // ========================================================
        // LOCK SOURCE ASSET
        // ========================================================

        const sourceAssetResult =
            await client.query(
                `SELECT
                    id,
                    quantity
                 FROM assets
                 WHERE base_id = $1
                 AND equipment_type_id = $2
                 FOR UPDATE`,
                [
                    sourceBaseId,
                    equipmentTypeId
                ]
            );

        if (
            sourceAssetResult.rows.length === 0
        ) {
            throw new Error(
                'Asset not available at source base'
            );
        }

        const sourceAsset =
            sourceAssetResult.rows[0];

        // ========================================================
        // CHECK AVAILABLE QUANTITY
        // ========================================================

        if (
            sourceAsset.quantity <
            quantityNumber
        ) {
            throw new Error(
                `Insufficient asset quantity. Available: ${sourceAsset.quantity}`
            );
        }

        // ========================================================
        // REMOVE FROM SOURCE BASE
        // ========================================================

        await client.query(
            `UPDATE assets
             SET quantity = quantity - $1
             WHERE id = $2`,
            [
                quantityNumber,
                sourceAsset.id
            ]
        );

        // ========================================================
        // LOCK DESTINATION ASSET
        // ========================================================

        const destinationAssetResult =
            await client.query(
                `SELECT
                    id,
                    quantity
                 FROM assets
                 WHERE base_id = $1
                 AND equipment_type_id = $2
                 FOR UPDATE`,
                [
                    destinationBaseId,
                    equipmentTypeId
                ]
            );

        // ========================================================
        // ADD TO DESTINATION BASE
        // ========================================================

        if (
            destinationAssetResult.rows.length > 0
        ) {

            await client.query(
                `UPDATE assets
                 SET quantity = quantity + $1
                 WHERE id = $2`,
                [
                    quantityNumber,
                    destinationAssetResult.rows[0].id
                ]
            );

        } else {

            await client.query(
                `INSERT INTO assets
                    (
                        base_id,
                        equipment_type_id,
                        quantity
                    )
                 VALUES ($1, $2, $3)`,
                [
                    destinationBaseId,
                    equipmentTypeId,
                    quantityNumber
                ]
            );
        }

        // ========================================================
        // RECORD TRANSFER
        // ========================================================

        const transferResult =
            await client.query(
                `INSERT INTO transfers
                    (
                        source_base_id,
                        destination_base_id,
                        equipment_type_id,
                        quantity,
                        status,
                        initiated_by
                    )
                 VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        'COMPLETED',
                        $5
                    )
                 RETURNING *`,
                [
                    sourceBaseId,
                    destinationBaseId,
                    equipmentTypeId,
                    quantityNumber,
                    initiated_by
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
                initiated_by,
                'TRANSFER',
                `Transferred ${quantityNumber} equipment(s) from base ${sourceBaseId} to base ${destinationBaseId}`
            ]
        );

        // ========================================================
        // COMMIT
        // ========================================================

        await client.query('COMMIT');

        return res.status(201).json({
            message:
                'Transfer completed successfully',

            transfer:
                transferResult.rows[0]
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error(
            'Transfer failed:',
            error.message
        );

        return res.status(500).json({
            message:
                'Transfer failed',

            error:
                error.message
        });

    } finally {

        client.release();
    }
};


// ============================================================
// GET TRANSFER HISTORY
// ============================================================

export const getTransfers = async (req, res) => {

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

            /*
             * Show transfers involving the commander's base:
             *
             * source base = own base
             * OR
             * destination base = own base
             */

            whereClause = `
                WHERE
                    t.source_base_id = $1
                    OR
                    t.destination_base_id = $1
            `;

            queryParams.push(
                req.user.baseId
            );
        }

        // ========================================================
        // FETCH TRANSFERS
        // ========================================================

        const result = await db.query(
            `
            SELECT
                t.id,

                t.source_base_id,
                sb.name AS source_base_name,
                sb.location AS source_base_location,

                t.destination_base_id,
                db.name AS destination_base_name,
                db.location AS destination_base_location,

                t.equipment_type_id,
                e.name AS equipment_name,
                e.category AS equipment_category,

                t.quantity,
                t.status,
                t.timestamp,

                t.initiated_by,
                u.username AS initiated_by_username

            FROM transfers t

            LEFT JOIN bases sb
                ON t.source_base_id = sb.id

            LEFT JOIN bases db
                ON t.destination_base_id = db.id

            LEFT JOIN equipment_types e
                ON t.equipment_type_id = e.id

            LEFT JOIN users u
                ON t.initiated_by = u.id

            ${whereClause}

            ORDER BY
                t.timestamp DESC
            `,
            queryParams
        );

        return res.status(200).json({
            transfers: result.rows
        });

    } catch (error) {

        console.error(
            'Failed to fetch transfer history:',
            error.message
        );

        return res.status(500).json({
            message:
                'Failed to fetch transfer history',

            error:
                error.message
        });
    }
};