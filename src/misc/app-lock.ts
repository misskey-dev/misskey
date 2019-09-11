import redis from '../db/redis';
import { promisify } from 'util';

/**
 * Retry delay (ms) for lock acquisition
 */
const retryDelay = 100;

const lock: (key: string, timeout?: number) => Promise<() => void>
	= redis
	? promisify(require('redis-lock')(redis, retryDelay))
	: async () => () => { };

/**
 * Get AP Object lock
 * @param uri AP object ID
 * @param timeout Lock timeout (ms), The timeout releases previous lock.
 * @returns Unlock function
 */
export function getApLock(uri: string, timeout = 30 * 1000) {
	return lock(`ap-object:${uri}`, timeout);
}
