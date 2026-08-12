import db from '../config/db.js';

export const loggerMiddleware = async (req, res, next) => {
    try {
        if (req.user) {
            await db.query(
                `INSERT INTO audit_logs
                    (user_id, action, details)
                 VALUES ($1, $2, $3)`,
                [
                    req.user.userId,
                    req.method,
                    `${req.method} ${req.originalUrl}`
                ]
            );
        }

        next();
    } catch (error) {
        console.error('Audit logging failed:', error.message);
        next();
    }
};
