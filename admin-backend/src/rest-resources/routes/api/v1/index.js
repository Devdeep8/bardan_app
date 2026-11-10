// src/rest-resources/routes/api/v1/index.js
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import uploadsRoutes from './uploads.routes.js';
import demoRoutes from './demo.routes.js';
import packagesRoutes from './packages.routes.js';
import blogsRoutes from './blogs.routes.js';
import auditLogsRoutes from './auditLogs.routes.js';
import adminUsersRoutes from './adminUsers.routes.js';
import usersRoutes from './users.routes.js';

const router = Router();

// Register all v1 routes here.
router.use('/auth', authRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/demo', demoRoutes);
router.use('/packages', packagesRoutes);
router.use('/blogs', blogsRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/admin-users', adminUsersRoutes);
router.use('/users', usersRoutes);

export default router;
