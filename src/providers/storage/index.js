/**
 * Storage Provider Factory
 * Returns the appropriate storage provider based on configuration
 */

import config from '../../config/index.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';
// Future: import { S3StorageProvider } from './S3StorageProvider.js';
// Future: import { GCSStorageProvider } from './GCSStorageProvider.js';

export { StorageTier } from './StorageProvider.js';

/**
 * Get storage provider instance based on configuration
 * @returns {StorageProvider} Storage provider instance
 */
export function getStorageProvider() {
    switch (config.storage.provider) {
        case 'local':
            return new LocalStorageProvider();

        // Future implementations:
        // case 's3':
        //   return new S3StorageProvider();
        // case 'gcs':
        //   return new GCSStorageProvider();
        // case 'azure':
        //   return new AzureBlobStorageProvider();

        default:
            return new LocalStorageProvider();
    }
}

// Export default provider instance
import localStorageProvider from './LocalStorageProvider.js';
export default localStorageProvider;
