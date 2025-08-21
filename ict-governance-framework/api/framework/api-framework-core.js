// File: ict-governance-framework/api/framework/api-framework-core.js
// Core API Framework for Enterprise Integration

const express = require('express');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const { body, query, param, validationResult } = require('express-validator');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * API Framework Core - Provides standardized patterns and utilities for all APIs
 * Implements enterprise-grade API standards, security, and integration patterns
 */
class APIFrameworkCore {
  constructor(options = {}) {
    this.options = {
      version: '2.0.0',
      basePath: '/api/v2',
      enableMetrics: true,
      enableTracing: true,
      enableCaching: true,
      defaultTimeout: 30000,
      maxRetries: 3,
      ...options
    };
    
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.metrics = new Map();
    this.integrations = new Map();
    this.middlewares = this.initializeMiddlewares();
  }

  /**
   * Initialize standard middlewares for all APIs
   */
  initializeMiddlewares() {
    return {
      // Standard rate limiting for different API tiers
      rateLimiting: {
        standard: rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 1000, // Standard tier: 1000 requests per window
          message: this.createErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded'),
          standardHeaders: true,
          legacyHeaders: false,
        }),
        
        premium: rateLimit({
          windowMs: 15 * 60 * 1000,
          max: 5000, // Premium tier: 5000 requests per window
          message: this.createErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded'),
          standardHeaders: true,
          legacyHeaders: false,
        }),
        
        integration: rateLimit({
          windowMs: 15 * 60 * 1000,
          max: 10000, // Integration tier: 10000 requests per window
          message: this.createErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded'),
          standardHeaders: true,
          legacyHeaders: false,
        })
      },

      // Request correlation and tracing
      correlation: (req, res, next) => {
        req.correlationId = req.headers['x-correlation-id'] || uuidv4();
        req.requestId = uuidv4();
        req.startTime = Date.now();
        
        res.setHeader('X-Correlation-ID', req.correlationId);
        res.setHeader('X-Request-ID', req.requestId);
        res.setHeader('X-API-Version', this.options.version);
        
        next();
      },

      // Request validation and sanitization
      validation: (validationRules) => {
        return [
          ...validationRules,
          (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
              return res.status(400).json(this.createErrorResponse(
                'VALIDATION_ERROR',
                'Request validation failed',
                { errors: errors.array() }
              ));
            }
            next();
          }
        ];
      },

      // Response formatting and metrics
      responseHandler: (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
          const responseTime = Date.now() - req.startTime;
          
          // Add standard response headers
          res.setHeader('X-Response-Time', `${responseTime}ms`);
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          
          // Log metrics if enabled
          if (this.options.enableMetrics) {
            this.recordMetrics(req, res, responseTime);
          }
          
          originalSend.call(this, data);
        }.bind(this);
        
        next();
      },

      // Error handling
      errorHandler: (err, req, res, next) => {
        const errorId = uuidv4();
        const errorResponse = this.createErrorResponse(
          err.code || 'INTERNAL_ERROR',
          err.message || 'An internal error occurred',
          { errorId, timestamp: new Date().toISOString() }
        );

        // Log error for monitoring
        console.error(`Error ${errorId}:`, {
          correlationId: req.correlationId,
          requestId: req.requestId,
          error: err.message,
          stack: err.stack,
          url: req.url,
          method: req.method,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });

        res.status(err.status || 500).json(errorResponse);
      }
    };
  }

  /**
   * Create standardized API router with enterprise patterns
   */
  createRouter(options = {}) {
    const router = express.Router();
    const config = {
      rateLimitTier: 'standard',
      requireAuth: true,
      enableCaching: this.options.enableCaching,
      timeout: this.options.defaultTimeout,
      ...options
    };

    // Apply standard middlewares
    router.use(this.middlewares.correlation);
    router.use(this.middlewares.rateLimiting[config.rateLimitTier]);
    router.use(this.middlewares.responseHandler);

    // Authentication middleware if required
    if (config.requireAuth) {
      router.use(this.createAuthMiddleware());
    }

    return router;
  }

  /**
   * Create authentication middleware
   */
  createAuthMiddleware() {
    return async (req, res, next) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json(this.createErrorResponse(
            'AUTHENTICATION_REQUIRED',
            'Authentication token required'
          ));
        }

        // Verify token and get user context
        const user = await this.verifyToken(token);
        req.user = user;
        req.permissions = await this.getUserPermissions(user.user_id);
        
        next();
      } catch (error) {
        res.status(401).json(this.createErrorResponse(
          'AUTHENTICATION_FAILED',
          'Invalid or expired token'
        ));
      }
    };
  }

  /**
   * Create authorization middleware for specific permissions
   */
  createAuthorizationMiddleware(requiredPermissions = []) {
    return (req, res, next) => {
      if (!req.permissions) {
        return res.status(403).json(this.createErrorResponse(
          'AUTHORIZATION_REQUIRED',
          'User permissions not available'
        ));
      }

      const hasPermission = requiredPermissions.every(permission => 
        req.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json(this.createErrorResponse(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions for this operation',
          { required: requiredPermissions, available: req.permissions }
        ));
      }

      next();
    };
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(code, message, details = {}) {
    return {
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        ...details
      }
    };
  }

  /**
   * Create standardized success response
   */
  createSuccessResponse(data, metadata = {}) {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        version: this.options.version,
        ...metadata
      }
    };
  }

  /**
   * Create paginated response
   */
  createPaginatedResponse(data, pagination) {
    return {
      success: true,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: this.options.version
      }
    };
  }

  /**
   * Validation rule builders for common patterns
   */
  getValidationRules() {
    return {
      // Common field validations
      id: param('id').isUUID().withMessage('Invalid ID format'),
      email: body('email').isEmail().normalizeEmail(),
      username: body('username').isLength({ min: 3, max: 50 }).isAlphanumeric(),
      password: body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
      
      // Pagination validations
      pagination: [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('sort').optional().isIn(['asc', 'desc']),
        query('sortBy').optional().isLength({ min: 1, max: 50 })
      ],
      
      // Date range validations
      dateRange: [
        query('startDate').optional().isISO8601().toDate(),
        query('endDate').optional().isISO8601().toDate()
      ],
      
      // Filter validations
      filters: [
        query('status').optional().isIn(['active', 'inactive', 'pending', 'archived']),
        query('category').optional().isLength({ min: 1, max: 50 }),
        query('search').optional().isLength({ min: 1, max: 100 })
      ]
    };
  }

  /**
   * Database query helpers with error handling and metrics
   */
  async executeQuery(query, params = [], options = {}) {
    const client = await this.pool.connect();
    const startTime = Date.now();
    
    try {
      const result = await client.query(query, params);
      const duration = Date.now() - startTime;
      
      // Record query metrics
      if (this.options.enableMetrics) {
        this.recordQueryMetrics(query, duration, result.rowCount);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordQueryMetrics(query, duration, 0, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Transaction helper with automatic rollback
   */
  async executeTransaction(operations) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const operation of operations) {
        const result = await operation(client);
        results.push(result);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cache management for API responses
   */
  async getCachedResponse(key) {
    if (!this.options.enableCaching) return null;
    
    try {
      const result = await this.executeQuery(
        'SELECT data, expires_at FROM api_cache WHERE cache_key = $1 AND expires_at > NOW()',
        [key]
      );
      
      return result.rows.length > 0 ? JSON.parse(result.rows[0].data) : null;
    } catch (error) {
      console.warn('Cache retrieval failed:', error.message);
      return null;
    }
  }

  async setCachedResponse(key, data, ttlSeconds = 300) {
    if (!this.options.enableCaching) return;
    
    try {
      await this.executeQuery(
        `INSERT INTO api_cache (cache_key, data, expires_at) 
         VALUES ($1, $2, NOW() + INTERVAL '${ttlSeconds} seconds')
         ON CONFLICT (cache_key) 
         DO UPDATE SET data = $2, expires_at = NOW() + INTERVAL '${ttlSeconds} seconds'`,
        [key, JSON.stringify(data)]
      );
    } catch (error) {
      console.warn('Cache storage failed:', error.message);
    }
  }

  /**
   * Record API metrics
   */
  recordMetrics(req, res, responseTime) {
    const key = `${req.method}:${req.route?.path || req.path}`;
    const existing = this.metrics.get(key) || { count: 0, totalTime: 0, errors: 0 };
    
    existing.count++;
    existing.totalTime += responseTime;
    if (res.statusCode >= 400) existing.errors++;
    
    this.metrics.set(key, existing);
  }

  /**
   * Record database query metrics
   */
  recordQueryMetrics(query, duration, rowCount, error = null) {
    const queryType = query.trim().split(' ')[0].toUpperCase();
    const key = `query:${queryType}`;
    const existing = this.metrics.get(key) || { count: 0, totalTime: 0, errors: 0, totalRows: 0 };
    
    existing.count++;
    existing.totalTime += duration;
    existing.totalRows += rowCount;
    if (error) existing.errors++;
    
    this.metrics.set(key, existing);
  }

  /**
   * Get API metrics
   */
  getMetrics() {
    const metrics = {};
    for (const [key, value] of this.metrics.entries()) {
      metrics[key] = {
        ...value,
        avgResponseTime: value.totalTime / value.count,
        errorRate: (value.errors / value.count) * 100
      };
    }
    return metrics;
  }

  /**
   * Health check endpoint
   */
  createHealthCheck() {
    return async (req, res) => {
      try {
        // Check database connectivity
        const dbResult = await this.executeQuery('SELECT 1 as health_check');
        const dbHealthy = dbResult.rows.length > 0;

        // Check integrations
        const integrationHealth = {};
        for (const [name, integration] of this.integrations.entries()) {
          try {
            integrationHealth[name] = await integration.healthCheck();
          } catch (error) {
            integrationHealth[name] = { status: 'unhealthy', error: error.message };
          }
        }

        const health = {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          version: this.options.version,
          uptime: process.uptime(),
          database: {
            status: dbHealthy ? 'connected' : 'disconnected',
            pool: {
              total: this.pool.totalCount,
              idle: this.pool.idleCount,
              waiting: this.pool.waitingCount
            }
          },
          integrations: integrationHealth,
          metrics: this.getMetrics()
        };

        res.status(dbHealthy ? 200 : 503).json(health);
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    };
  }

  /**
   * Verify JWT token (placeholder - implement based on your auth system)
   */
  async verifyToken(token) {
    // This should integrate with your existing auth system
    // For now, returning a placeholder implementation
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  /**
   * Get user permissions (placeholder - implement based on your RBAC system)
   */
  async getUserPermissions(userId) {
    const result = await this.executeQuery(
      `SELECT DISTINCT p.permission_name 
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.permission_id
       WHERE ur.user_id = $1 AND ur.is_active = true`,
      [userId]
    );
    
    return result.rows.map(row => row.permission_name);
  }
}

module.exports = APIFrameworkCore;