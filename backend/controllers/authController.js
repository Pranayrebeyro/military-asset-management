import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ============================================================
// LOGIN
// ============================================================

export const login = async (req, res) => {

    try {

        const {
            username,
            password
        } = req.body;


        // ====================================================
        // FIND USER
        // ====================================================

        const result = await db.query(
            `
            SELECT
                id,
                username,
                password_hash,
                role,
                base_id
            FROM users
            WHERE username = $1
            `,
            [username]
        );


        // ====================================================
        // USER NOT FOUND
        // ====================================================

        if (result.rows.length === 0) {

            return res.status(401).json({
                message:
                    'Invalid username or password'
            });
        }


        const user = result.rows[0];


        // ====================================================
        // CHECK PASSWORD
        // ====================================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );


        if (!passwordMatch) {

            return res.status(401).json({
                message:
                    'Invalid username or password'
            });
        }


        // ====================================================
        // CREATE JWT TOKEN
        // ====================================================

        const token = jwt.sign(
            {
                userId: user.id,

                username: user.username,

                role: user.role,

                baseId: user.base_id
            },

            process.env.JWT_SECRET
        );


        // ====================================================
        // SUCCESS RESPONSE
        // ====================================================

        return res.status(200).json({
            token
        });

    } catch (error) {

        console.error(
            'Login failed:',
            error.message
        );

        return res.status(500).json({
            error: error.message
        });
    }
};