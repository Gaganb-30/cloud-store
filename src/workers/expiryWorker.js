/**
 * Expiry Worker
 * Processes expired files for deletion
 */
import config from '../config/index.js';
import expiryService from '../services/ExpiryService.js';
import logger from '../utils/logger.js';

class ExpiryWorker {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
    }

    async start() {
        if (this.isRunning) return;

        this.isRunning = true;
        logger.info('Expiry worker started');

        // Run immediately, then on interval
        await this.run();

        this.intervalId = setInterval(
            () => this.run(),
            config.workers.expiryInterval
        );
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        logger.info('Expiry worker stopped');
    }

    async run() {
        if (!this.isRunning) return;

        try {
            logger.debug('Expiry worker running...');

            // Process expired files (free users)
            const expiryResult = await expiryService.processExpiredBatch(
                config.workers.batchSize
            );

            if (expiryResult.processed > 0) {
                logger.info('Expiry worker completed expiry batch', expiryResult);
            }

            // Process inactive files (all users - 90 days no download)
            const inactivityResult = await expiryService.processInactiveBatch(
                config.workers.batchSize
            );

            if (inactivityResult.processed > 0) {
                logger.info('Expiry worker completed inactivity batch', inactivityResult);
            }
        } catch (error) {
            logger.error('Expiry worker error', { error: error.message });
        }
    }
}

const expiryWorker = new ExpiryWorker();
export default expiryWorker;
