/**
 * Elysium Shield Integration SDK
 * 
 * Official SDK for integrating Elysium Shield into your Discord bot.
 * Provides cross-server moderation, threat detection, and user verification.
 * 
 * @version 1.0.0
 * @license MIT
 * @author Elysium Development Team
 * @website https://elysium-online.xyz
 */

const https = require('https');
const http = require('http');

class ShieldIntegration {
  /**
   * Initialize Shield Integration
   * @param {string} apiKey - Your Shield API key (get one at https://elysium-online.xyz/dashboard)
   * @param {Object} options - Configuration options
   * @param {string} options.apiUrl - API base URL (default: https://elysium-online.xyz/api)
   * @param {number} options.timeout - Request timeout in ms (default: 10000)
   * @param {boolean} options.debug - Enable debug logging (default: false)
   */
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('Shield API key is required. Get one at https://elysium-online.xyz/profile');
    }

    this.apiKey = apiKey;
    this.apiUrl = options.apiUrl || 'https://elysium-online.xyz/api';
    this.timeout = options.timeout || 10000;
    this.debug = options.debug || false;
    this.version = '1.0.0';

    this._log('Shield Integration initialized', { apiUrl: this.apiUrl });
  }

  /**
   * Internal logging method
   * @private
   */
  _log(message, data = {}) {
    if (this.debug) {
      console.log(`[Shield SDK] ${message}`, data);
    }
  }

  /**
   * Internal API request method
   * @private
   */
  async _request(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.apiUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'User-Agent': `Elysium-Shield-SDK/${this.version}`,
        },
        timeout: this.timeout,
      };

      this._log(`${method} ${url.href}`, data);

      const req = client.request(url, options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(body);

            // Extract rate limit headers
            const rateLimit = {};
            
            if (res.headers['x-ratelimit-limit']) {
              rateLimit.limit = parseInt(res.headers['x-ratelimit-limit']);
            }
            if (res.headers['x-ratelimit-remaining']) {
              rateLimit.remaining = parseInt(res.headers['x-ratelimit-remaining']);
            }
            if (res.headers['x-ratelimit-reset']) {
              const resetTimestamp = parseInt(res.headers['x-ratelimit-reset']);
              rateLimit.resetAt = new Date(resetTimestamp * 1000).toISOString();
              rateLimit.resetTimestamp = resetTimestamp;
            }
            if (res.headers['retry-after']) {
              rateLimit.retryAfter = parseInt(res.headers['retry-after']);
            }

            // Add rate limit info to response (only if we have rate limit data)
            if (response && typeof response === 'object' && Object.keys(rateLimit).length > 0) {
              response.rateLimit = rateLimit;
            }

            if (res.statusCode >= 200 && res.statusCode < 300) {
              this._log('Request successful', { status: res.statusCode, rateLimit });
              resolve(response);
            } else {
              this._log('Request failed', { status: res.statusCode, response });
              reject({
                statusCode: res.statusCode,
                message: response.message || response.error || 'Request failed',
                error: response.error || 'Unknown error',
                rateLimit,
              });
            }
          } catch (error) {
            reject({
              statusCode: res.statusCode,
              message: 'Failed to parse response',
              error: error.message,
            });
          }
        });
      });

      req.on('error', (error) => {
        this._log('Request error', { error: error.message });
        reject({
          message: 'Network error',
          error: error.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject({
          message: 'Request timeout',
          error: `Request exceeded ${this.timeout}ms`,
        });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Get rate limit information from last request
   * @returns {Object|null} Rate limit info
   * @example
   * const stats = await shield.getNetworkStats();
   * const rateLimit = shield.getRateLimit();
   * console.log(`Remaining requests: ${rateLimit.remaining}/${rateLimit.limit}`);
   */
  getRateLimit() {
    return this._lastRateLimit || null;
  }

  /**
   * Check if a user is flagged in the Shield system
   * @param {string} userId - Discord user ID
   * @returns {Promise<Object>} User check result
   * @example
   * const result = await shield.checkUser('123456789');
   * if (result.flagged) {
   *   console.log('User is flagged:', result.riskLevel);
   *   console.log('Recommendation:', result.recommendation.action);
   * }
   */
  async checkUser(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const response = await this._request('POST', '/api/v1/shield/check', { userId });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to check user');
      }

      return response.data;
    } catch (error) {
      throw new Error(`Failed to check user: ${error.message}`);
    }
  }


  /**
   * Report a moderation action to Shield
   * Requires API key with 'shield:report_action' permission
   * 
   * @param {Object} actionData - Action details
   * @param {string} actionData.userId - Target user ID
   * @param {string} actionData.guildId - Guild ID where action occurred
   * @param {string} actionData.actionType - Action type (ban, kick, timeout, mute, warn, unban, untimeout, unmute, remove_warning)
   * @param {string} actionData.reason - Reason for action
   * @param {string} actionData.moderatorId - Moderator user ID
   * @param {string} [actionData.accountCreated] - Optional: Discord account creation date (ISO 8601)
   * @returns {Promise<Object>} Report result
   * @example
   * await shield.reportAction({
   *   userId: '123456789',
   *   guildId: '987654321',
   *   actionType: 'ban',
   *   reason: 'Spam',
   *   moderatorId: '111222333'
   * });
   */
  async reportAction(actionData) {
    const required = ['userId', 'guildId', 'actionType', 'reason', 'moderatorId'];
    for (const field of required) {
      if (!actionData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    const validActions = ['ban', 'kick', 'timeout', 'mute', 'warn', 'unban', 'untimeout', 'unmute', 'remove_warning'];
    if (!validActions.includes(actionData.actionType)) {
      throw new Error(`Invalid action type. Must be one of: ${validActions.join(', ')}`);
    }

    try {
      const response = await this._request('POST', '/api/v1/shield/report-action', actionData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to report action');
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to report action: ${error.message}`);
    }
  }

  /**
   * Get Shield network statistics
   * @returns {Promise<Object>} Network stats
   * @example
   * const stats = await shield.getNetworkStats();
   * console.log('Participating servers:', stats.participatingServers);
   * console.log('Threats detected:', stats.threatsDetected);
   */
  async getNetworkStats() {
    try {
      const response = await this._request('GET', '/api/v1/shield/stats');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get network stats');
      }

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get network stats: ${error.message}`);
    }
  }

  /**
   * Verify API key is valid and has required permissions
   * @returns {Promise<boolean>} True if valid
   */
  async verifyApiKey() {
    try {
      await this.getNetworkStats();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ShieldIntegration;
