// src/rest-resources/routes/api/v1/index.js
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import ordersRoutes from "./orders.routes.js";
import customersRoutes from "./customers.routes.js";
import expensesRoutes from "./expenses.routes.js";
import demoRoutes from "./demo.routes.js";
import blogsRoutes from "./blogs.routes.js";
import mandiRoutes from "./mandi.routes.js";
const router = Router();

// Register all v1 routes here.
router.use("/auth", authRoutes);
router.use("/orders", ordersRoutes);
router.use("/customers", customersRoutes);
router.use("/expenses", expensesRoutes);
router.use("/demo", demoRoutes);
router.use("/blogs", blogsRoutes);
router.use("/mandi", mandiRoutes);

export default router;
