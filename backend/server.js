import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import db from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import expenditureRoutes from './routes/expenditureRoutes.js';
import lookupRoutes from './routes/lookupRoutes.js';

const app = express();

const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(helmet());
app.use(express.json());

// ============================================================
// ROUTES
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/lookups', lookupRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/', (req, res) => {
    res.json({
        message: 'Military Asset Management API is running'
    });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    try {
        await db.query('SELECT 1');

        console.log(
            'PostgreSQL connected successfully'
        );

    } catch (error) {

        console.error(
            'PostgreSQL connection failed:',
            error.message
        );
    }
});