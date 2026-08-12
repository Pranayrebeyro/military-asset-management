import db from '../config/db.js';

export const getDashboardMetrics = async (req, res) => {
    try {
        const {
            baseId,
            equipmentTypeId,
            startDate,
            endDate
        } = req.query;

        // ============================================================
        // PARSE FILTERS
        // ============================================================

        let base = baseId
            ? parseInt(baseId, 10)
            : null;

        const equipment = equipmentTypeId
            ? parseInt(equipmentTypeId, 10)
            : null;

        // ============================================================
        // VALIDATE IDs
        // ============================================================

        if (
            baseId &&
            Number.isNaN(base)
        ) {
            return res.status(400).json({
                message: 'Invalid baseId'
            });
        }

        if (
            equipmentTypeId &&
            Number.isNaN(equipment)
        ) {
            return res.status(400).json({
                message: 'Invalid equipmentTypeId'
            });
        }

        // ============================================================
        // BASE-LEVEL AUTHORIZATION
        // ============================================================

        /*
         * ADMIN
         * -----
         * Can access all bases.
         *
         * BASE_COMMANDER
         * --------------
         * Can access only their assigned base.
         *
         * If no baseId is supplied, automatically use
         * the commander's assigned base.
         */

        if (req.user.role === 'BASE_COMMANDER') {

            // Commander must have an assigned base
            if (!req.user.baseId) {
                return res.status(403).json({
                    message:
                        'Base Commander is not assigned to a base'
                });
            }

            // Commander requested another base
            if (
                base !== null &&
                base !== req.user.baseId
            ) {
                return res.status(403).json({
                    message:
                        'You are not authorized to access this base'
                });
            }

            // Force commander to their own base
            base = req.user.baseId;
        }

        // ============================================================
        // VALIDATE DATES
        // ============================================================

        if (
            startDate &&
            Number.isNaN(Date.parse(startDate))
        ) {
            return res.status(400).json({
                message: 'Invalid startDate'
            });
        }

        if (
            endDate &&
            Number.isNaN(Date.parse(endDate))
        ) {
            return res.status(400).json({
                message: 'Invalid endDate'
            });
        }

        if (
            startDate &&
            endDate &&
            new Date(startDate) > new Date(endDate)
        ) {
            return res.status(400).json({
                message:
                    'Start date cannot be after end date'
            });
        }

        // ============================================================
        // DASHBOARD QUERY
        // ============================================================

        const query = `
            WITH

            /* ======================================================
               CURRENT INVENTORY
               ====================================================== */

            current_assets AS (
                SELECT
                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS current_balance
                FROM assets
                WHERE
                    (
                        $1::int IS NULL
                        OR base_id = $1
                    )
                    AND
                    (
                        $2::int IS NULL
                        OR equipment_type_id = $2
                    )
            ),

            /* ======================================================
               PURCHASES IN SELECTED PERIOD
               ====================================================== */

            purchase_period AS (
                SELECT
                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS total_purchases
                FROM purchases
                WHERE
                    (
                        $1::int IS NULL
                        OR base_id = $1
                    )
                    AND
                    (
                        $2::int IS NULL
                        OR equipment_type_id = $2
                    )
                    AND (
                        $3::date IS NULL
                        OR created_at >= $3::date
                    )
                    AND (
                        $4::date IS NULL
                        OR created_at <
                           (
                               $4::date
                               + INTERVAL '1 day'
                           )
                    )
            ),

            /* ======================================================
               TRANSFER IN
               ====================================================== */

            transfer_in_period AS (
                SELECT
                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS total_transfer_in
                FROM transfers
                WHERE
                    (
                        $1::int IS NULL
                        OR destination_base_id = $1
                    )
                    AND
                    (
                        $2::int IS NULL
                        OR equipment_type_id = $2
                    )
                    AND status = 'COMPLETED'
                    AND (
                        $3::date IS NULL
                        OR timestamp >= $3::date
                    )
                    AND (
                        $4::date IS NULL
                        OR timestamp <
                           (
                               $4::date
                               + INTERVAL '1 day'
                           )
                    )
            ),

            /* ======================================================
               TRANSFER OUT
               ====================================================== */

            transfer_out_period AS (
                SELECT
                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS total_transfer_out
                FROM transfers
                WHERE
                    (
                        $1::int IS NULL
                        OR source_base_id = $1
                    )
                    AND
                    (
                        $2::int IS NULL
                        OR equipment_type_id = $2
                    )
                    AND status = 'COMPLETED'
                    AND (
                        $3::date IS NULL
                        OR timestamp >= $3::date
                    )
                    AND (
                        $4::date IS NULL
                        OR timestamp <
                           (
                               $4::date
                               + INTERVAL '1 day'
                           )
                    )
            ),

            /* ======================================================
               ASSIGNMENTS
               ====================================================== */

            assignment_period AS (
                SELECT
                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS total_assigned
                FROM assignments
                WHERE
                    (
                        $1::int IS NULL
                        OR base_id = $1
                    )
                    AND
                    (
                        $2::int IS NULL
                        OR equipment_type_id = $2
                    )
                    AND (
                        $3::date IS NULL
                        OR assigned_at >= $3::date
                    )
                    AND (
                        $4::date IS NULL
                        OR assigned_at <
                           (
                               $4::date
                               + INTERVAL '1 day'
                           )
                    )
            ),

            /* ======================================================
               EXPENDITURES
               ====================================================== */

            expenditure_period AS (
                SELECT
                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS total_expended
                FROM expenditures
                WHERE
                    (
                        $1::int IS NULL
                        OR base_id = $1
                    )
                    AND
                    (
                        $2::int IS NULL
                        OR equipment_type_id = $2
                    )
                    AND (
                        $3::date IS NULL
                        OR expended_at >= $3::date
                    )
                    AND (
                        $4::date IS NULL
                        OR expended_at <
                           (
                               $4::date
                               + INTERVAL '1 day'
                           )
                    )
            ),

            /* ======================================================
               PURCHASES AFTER END DATE
               ====================================================== */

            purchases_after_end AS (
                SELECT
                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS quantity
                FROM purchases
                WHERE
                    (
                        $1::int IS NULL
                        OR base_id = $1
                    )
                    AND
                    (
                        $2::int IS NULL
                        OR equipment_type_id = $2
                    )
                    AND $4::date IS NOT NULL
                    AND created_at >=
                        (
                            $4::date
                            + INTERVAL '1 day'
                        )
            ),

            /* ======================================================
               TRANSFER IN AFTER END DATE
               ====================================================== */

            transfer_in_after_end AS (
                SELECT
                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS quantity
                FROM transfers
                WHERE
                    (
                        $1::int IS NULL
                        OR destination_base_id = $1
                    )
                    AND
                    (
                        $2::int IS NULL
                        OR equipment_type_id = $2
                    )
                    AND status = 'COMPLETED'
                    AND $4::date IS NOT NULL
                    AND timestamp >=
                        (
                            $4::date
                            + INTERVAL '1 day'
                        )
            ),

            /* ======================================================
               TRANSFER OUT AFTER END DATE
               ====================================================== */

            transfer_out_after_end AS (
                SELECT
                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS quantity
                FROM transfers
                WHERE
                    (
                        $1::int IS NULL
                        OR source_base_id = $1
                    )
                    AND
                    (
                        $2::int IS NULL
                        OR equipment_type_id = $2
                    )
                    AND status = 'COMPLETED'
                    AND $4::date IS NOT NULL
                    AND timestamp >=
                        (
                            $4::date
                            + INTERVAL '1 day'
                        )
            ),

            /* ======================================================
               ASSIGNMENTS AFTER END DATE
               ====================================================== */

            assignments_after_end AS (
                SELECT
                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS quantity
                FROM assignments
                WHERE
                    (
                        $1::int IS NULL
                        OR base_id = $1
                    )
                    AND
                    (
                        $2::int IS NULL
                        OR equipment_type_id = $2
                    )
                    AND $4::date IS NOT NULL
                    AND assigned_at >=
                        (
                            $4::date
                            + INTERVAL '1 day'
                        )
            ),

            /* ======================================================
               EXPENDITURES AFTER END DATE
               ====================================================== */

            expenditures_after_end AS (
                SELECT
                    COALESCE(
                        SUM(quantity),
                        0
                    ) AS quantity
                FROM expenditures
                WHERE
                    (
                        $1::int IS NULL
                        OR base_id = $1
                    )
                    AND
                    (
                        $2::int IS NULL
                        OR equipment_type_id = $2
                    )
                    AND $4::date IS NOT NULL
                    AND expended_at >=
                        (
                            $4::date
                            + INTERVAL '1 day'
                        )
            ),

            /* ======================================================
               HISTORICAL CLOSING BALANCE
               ====================================================== */

            historical_balance AS (
                SELECT
                    ca.current_balance,

                    (
                        ca.current_balance

                        - COALESCE(
                            pa.quantity,
                            0
                        )

                        - COALESCE(
                            tia.quantity,
                            0
                        )

                        + COALESCE(
                            toa.quantity,
                            0
                        )

                        + COALESCE(
                            aa.quantity,
                            0
                        )

                        + COALESCE(
                            ea.quantity,
                            0
                        )

                    ) AS closing_balance

                FROM current_assets ca

                CROSS JOIN purchases_after_end pa
                CROSS JOIN transfer_in_after_end tia
                CROSS JOIN transfer_out_after_end toa
                CROSS JOIN assignments_after_end aa
                CROSS JOIN expenditures_after_end ea
            )

            /* ======================================================
               FINAL RESULT
               ====================================================== */

            SELECT

                hb.closing_balance,

                pp.total_purchases,

                ti.total_transfer_in,

                too.total_transfer_out,

                ap.total_assigned,

                ep.total_expended,

                (
                    pp.total_purchases
                    + ti.total_transfer_in
                    - too.total_transfer_out
                    - ap.total_assigned
                    - ep.total_expended
                ) AS net_movement,

                (
                    hb.closing_balance

                    - (
                        pp.total_purchases
                        + ti.total_transfer_in
                        - too.total_transfer_out
                        - ap.total_assigned
                        - ep.total_expended
                    )
                ) AS opening_balance

            FROM historical_balance hb

            CROSS JOIN purchase_period pp
            CROSS JOIN transfer_in_period ti
            CROSS JOIN transfer_out_period too
            CROSS JOIN assignment_period ap
            CROSS JOIN expenditure_period ep;
        `;

        // ============================================================
        // EXECUTE QUERY
        // ============================================================

        const result = await db.query(
            query,
            [
                base,
                equipment,
                startDate || null,
                endDate || null
            ]
        );

        const metrics = result.rows[0];

        // ============================================================
        // RESPONSE
        // ============================================================

        return res.status(200).json({
            opening_balance:
                Number(metrics.opening_balance),

            total_purchases:
                Number(metrics.total_purchases),

            total_transfer_in:
                Number(metrics.total_transfer_in),

            total_transfer_out:
                Number(metrics.total_transfer_out),

            net_movement:
                Number(metrics.net_movement),

            total_assigned:
                Number(metrics.total_assigned),

            total_expended:
                Number(metrics.total_expended),

            closing_balance:
                Number(metrics.closing_balance)
        });

    } catch (error) {

        console.error(
            'Dashboard metrics error:',
            error
        );

        return res.status(500).json({
            message:
                'Failed to fetch dashboard metrics',

            error:
                error.message
        });
    }
};