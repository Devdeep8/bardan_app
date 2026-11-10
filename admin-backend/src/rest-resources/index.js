import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import config from '@configs/app.config.js';
import requestMiddleware from '@src/rest-resources/middlewares/request.middleware.js';
import contextMiddleware from '@src/rest-resources/middlewares/context.middleware.js';
import errorMiddleware from '@src/rest-resources/middlewares/error.middleware.js';
import routes from '@routes/index.js';

const app = express();

// Trust proxy for correct IP detection (must be first)
app.set('trust proxy', 1);

// Mount helmet first for security headers
app.use(helmet());

// CORS Configuration (early for preflight requests)
const allowedOrigins = [];
const addOrigin = (val) => {
  if (!val) return;
  if (Array.isArray(val)) {
    val.forEach(v => addOrigin(v));
  } else if (typeof val === 'string') {
    val.split(',').map(v => v.trim()).forEach(v => {
      if (v && !allowedOrigins.includes(v)) {
        allowedOrigins.push(v);
      }
    });
  }
};

try {
  addOrigin(process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN);
  addOrigin(config.app?.origin);
  addOrigin(config.webApp?.whitelist);
  if (typeof config.get === 'function') {
    addOrigin(config.get('app.origin'));
    addOrigin(config.get('webApp.whitelist'));
  }
} catch (err) {
  // Safe fallback if config parsing/get fails
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Mount trace ID logger context middleware
app.use(requestMiddleware);

// JSON body parsing with rawBody support (needed for Stripe webhooks etc.)
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

// URL-encoded parsing with size limits
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

app.use(routes);

// Catch-All 404 handler for unmatched routes
app.use(async (req, res) => {
  res.status(404).json({ status: 'Not Found' });
});

// Register global error handler last
app.use(errorMiddleware);

export default app;
