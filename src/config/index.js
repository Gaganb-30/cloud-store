/**
 * Configuration Loader
 * Centralizes all environment-based configuration with validation
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

/**
 * Parse environment variable with type coercion
 */
function env(key, defaultValue = undefined) {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return defaultValue;
  }
  return value;
}

function envInt(key, defaultValue = undefined) {
  const value = env(key, defaultValue?.toString());
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer`);
  }
  return parsed;
}

function envFloat(key, defaultValue = undefined) {
  const value = env(key, defaultValue?.toString());
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
}

function envBool(key, defaultValue = false) {
  const value = env(key, defaultValue.toString());
  return value === 'true' || value === '1';
}

function envArray(key, defaultValue = []) {
  const value = env(key, '');
  if (!value) return defaultValue;
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Application Configuration
 */
const config = {
  // Application
  env: env('NODE_ENV', 'development'),
  port: envInt('PORT', 3000),
  apiPrefix: env('API_PREFIX', '/api'),
  isDev: env('NODE_ENV', 'development') === 'development',
  isProd: env('NODE_ENV', 'development') === 'production',

  // MongoDB
  mongodb: {
    uri: env('MONGODB_URI', 'mongodb://localhost:27017/storage-service'),
    maxPoolSize: envInt('MONGODB_MAX_POOL_SIZE', 50),
    minPoolSize: envInt('MONGODB_MIN_POOL_SIZE', 10),
    connectTimeoutMs: envInt('MONGODB_CONNECT_TIMEOUT_MS', 10000),
    socketTimeoutMs: envInt('MONGODB_SOCKET_TIMEOUT_MS', 45000),
  },

  // Redis
  redis: {
    host: env('REDIS_HOST', 'localhost'),
    port: envInt('REDIS_PORT', 6379),
    password: env('REDIS_PASSWORD', '') || undefined,
    db: envInt('REDIS_DB', 0),
    keyPrefix: env('REDIS_KEY_PREFIX', 'storage:'),
  },

  // JWT
  jwt: {
    accessSecret: env('JWT_ACCESS_SECRET'),
    refreshSecret: env('JWT_REFRESH_SECRET'),
    accessExpiresIn: env('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: env('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  // Storage
  storage: {
    basePath: resolve(__dirname, '../../', env('STORAGE_BASE_PATH', './storage')),
    ssdPath: resolve(__dirname, '../../', env('STORAGE_SSD_PATH', './storage/ssd')),
    hddPath: resolve(__dirname, '../../', env('STORAGE_HDD_PATH', './storage/hdd')),
    tempPath: resolve(__dirname, '../../', env('STORAGE_TEMP_PATH', './storage/ssd/temp')),
    provider: env('STORAGE_PROVIDER', 'local'), // 'local' or 'r2'
  },

  // Cloudflare R2 (S3-compatible object storage)
  r2: {
    accountId: env('R2_ACCOUNT_ID', ''),
    accessKeyId: env('R2_ACCESS_KEY_ID', ''),
    secretAccessKey: env('R2_SECRET_ACCESS_KEY', ''),
    bucketName: env('R2_BUCKET_NAME', ''),
    publicUrl: env('R2_PUBLIC_URL', ''), // Optional: for public bucket access
    presignedExpiry: envInt('R2_PRESIGNED_EXPIRY', 86400), // 24 hours default
  },

  // Upload
  upload: {
    chunkSize: envInt('UPLOAD_CHUNK_SIZE', 15728640), // 15MB
    maxFileSizeFree: envInt('UPLOAD_MAX_FILE_SIZE_FREE', 10737418240), // 10GB
    maxFileSizePremium: envInt('UPLOAD_MAX_FILE_SIZE_PREMIUM', -1), // Unlimited
    sessionTtl: envInt('UPLOAD_SESSION_TTL', 86400), // 24 hours
  },

  // Rate Limiting
  rateLimit: {
    windowSeconds: envInt('RATE_LIMIT_WINDOW_SECONDS', 60),
    free: {
      upload: envInt('RATE_LIMIT_FREE_UPLOAD', 10),
      download: envInt('RATE_LIMIT_FREE_DOWNLOAD', 50),
      auth: envInt('RATE_LIMIT_FREE_AUTH', 5),
    },
    premium: {
      upload: envInt('RATE_LIMIT_PREMIUM_UPLOAD', 50),
      download: envInt('RATE_LIMIT_PREMIUM_DOWNLOAD', 1000),
      auth: envInt('RATE_LIMIT_PREMIUM_AUTH', 10),
    },
    ip: {
      upload: envInt('RATE_LIMIT_IP_UPLOAD', 5),
      download: envInt('RATE_LIMIT_IP_DOWNLOAD', 20),
      auth: envInt('RATE_LIMIT_IP_AUTH', 3),
    },
  },

  // File Expiry
  expiry: {
    daysFree: envFloat('FILE_EXPIRY_DAYS_FREE', 5),
    extensionDays: envFloat('FILE_EXPIRY_EXTENSION_DAYS', 5),
    // After X downloads, free user files expire faster
    downloadThreshold: envInt('FILE_EXPIRY_DOWNLOAD_THRESHOLD', 5),
    daysAfterThreshold: envFloat('FILE_EXPIRY_DAYS_AFTER_THRESHOLD', 1),
    // Inactivity deletion (applies to ALL users including premium/admin)
    inactivityDays: envFloat('FILE_INACTIVITY_DAYS', 90),
  },

  // Tier Migration
  tierMigration: {
    hotToColdDays: envInt('TIER_MIGRATION_HOT_TO_COLD_DAYS', 7),
    coldToHotDownloads: envInt('TIER_MIGRATION_COLD_TO_HOT_DOWNLOADS', 5),
  },

  // Workers
  workers: {
    expiryInterval: envInt('WORKER_EXPIRY_INTERVAL', 3600) * 1000,
    migrationInterval: envInt('WORKER_MIGRATION_INTERVAL', 3600) * 1000,
    cleanupInterval: envInt('WORKER_CLEANUP_INTERVAL', 3600) * 1000,
    batchSize: envInt('WORKER_BATCH_SIZE', 100),
  },

  // Security
  security: {
    allowedMimeTypes: envArray('ALLOWED_MIME_TYPES', []),
    maxFilenameLength: envInt('MAX_FILENAME_LENGTH', 255),
  },

  // Features
  features: {
    registrationEnabled: envBool('FEATURE_REGISTRATION_ENABLED', true),
    anonymousDownload: envBool('FEATURE_ANONYMOUS_DOWNLOAD', true),
  },

  // Logging
  logging: {
    level: env('LOG_LEVEL', 'debug'),
    format: env('LOG_FORMAT', 'json'),
  },

  // CORS
  cors: {
    origin: env('CORS_ORIGIN', '*'),
    credentials: envBool('CORS_CREDENTIALS', true),
  },

  // Email (SMTP)
  email: {
    host: env('EMAIL_HOST', 'smtp.protonmail.ch'),
    port: envInt('EMAIL_PORT', 587),
    secure: envBool('EMAIL_SECURE', false),
    user: env('EMAIL_USER', ''),
    pass: env('EMAIL_PASS', ''),
    fromName: env('EMAIL_FROM_NAME', 'CloudVault'),
  },
};

// Freeze config to prevent mutations
Object.freeze(config);

export default config;
