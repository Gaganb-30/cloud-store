/**
 * Storage Provider Factory
 * Returns the appropriate storage provider based on configuration
 */

import config from '../../config/index.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';
import { R2StorageProvider } from './R2StorageProvider.js';

export { StorageTier } from './StorageProvider.js';

/**
 * Get storage provider instance based on configuration
 * @returns {StorageProvider} Storage provider instance
 */
export function getStorageProvider() {
    switch (config.storage.provider) {
        case 'local':
            return new LocalStorageProvider();

        case 'r2':
            return new R2StorageProvider();

        default:
            return new LocalStorageProvider();
    }
}

// Create and export default provider based on config
let defaultProvider;

if (config.storage.provider === 'r2') {
    const { default: r2Provider } = await import('./R2StorageProvider.js');
    defaultProvider = r2Provider;
} else {
    const { default: localProvider } = await import('./LocalStorageProvider.js');
    defaultProvider = localProvider;
}

export default defaultProvider;
