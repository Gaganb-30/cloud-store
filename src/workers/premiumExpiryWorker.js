/**
 * Premium Expiry Worker
 * Checks for expired premium subscriptions and downgrades users to free tier
 */

import { User, UserRole, File } from '../models/index.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class PremiumExpiryWorker {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
        // Run every hour
        this.interval = 60 * 60 * 1000;
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;

        // Run immediately on start
        await this.checkExpiredPremiums();

        // Then run on interval
        this.intervalId = setInterval(() => {
            this.checkExpiredPremiums().catch(error => {
                logger.error('Premium expiry worker error', { error: error.message });
            });
        }, this.interval);

        logger.info('Premium expiry worker started');
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        logger.info('Premium expiry worker stopped');
    }

    async checkExpiredPremiums() {
        logger.debug('Checking for expired premium subscriptions...');

        try {
            const now = new Date();

            // Find users with expired premium
            const expiredUsers = await User.find({
                role: UserRole.PREMIUM,
                premiumExpiresAt: { $ne: null, $lte: now },
            });

            if (expiredUsers.length === 0) {
                logger.debug('No expired premium subscriptions found');
                return;
            }

            logger.info(`Found ${expiredUsers.length} expired premium subscriptions`);

            for (const user of expiredUsers) {
                try {
                    // Downgrade to free
                    user.role = UserRole.FREE;
                    await user.save();

                    // Set expiry on user's files (5 days from now)
                    const fileExpiryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
                    await File.updateMany(
                        { userId: user._id, isDeleted: false, expiresAt: null },
                        { $set: { expiresAt: fileExpiryDate } }
                    );

                    logger.info('Premium subscription expired - user downgraded', {
                        userId: user._id,
                        email: user.email,
                        expiredAt: user.premiumExpiresAt,
                    });
                } catch (error) {
                    logger.error('Failed to downgrade user', {
                        userId: user._id,
                        error: error.message,
                    });
                }
            }
        } catch (error) {
            logger.error('Premium expiry check failed', { error: error.message });
        }
    }
}

const premiumExpiryWorker = new PremiumExpiryWorker();
export default premiumExpiryWorker;
