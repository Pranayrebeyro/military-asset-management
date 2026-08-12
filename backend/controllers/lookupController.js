import db from '../config/db.js';

// ============================================================
// GET BASES
// ============================================================

export const getBases = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                id,
                name,
                location
            FROM bases
            ORDER BY id
        `);

        res.status(200).json({
            bases: result.rows
        });

    } catch (error) {
        console.error(
            'Failed to fetch bases:',
            error.message
        );

        res.status(500).json({
            message: 'Failed to fetch bases',
            error: error.message
        });
    }
};


// ============================================================
// GET EQUIPMENT TYPES
// ============================================================

export const getEquipmentTypes = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                id,
                name,
                category
            FROM equipment_types
            ORDER BY id
        `);

        res.status(200).json({
            equipmentTypes: result.rows
        });

    } catch (error) {
        console.error(
            'Failed to fetch equipment types:',
            error.message
        );

        res.status(500).json({
            message: 'Failed to fetch equipment types',
            error: error.message
        });
    }
};


// ============================================================
// GET USERS
// ============================================================

export const getUsers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                id,
                username,
                role,
                base_id
            FROM users
            ORDER BY id
        `);

        res.status(200).json({
            users: result.rows
        });

    } catch (error) {
        console.error(
            'Failed to fetch users:',
            error.message
        );

        res.status(500).json({
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};