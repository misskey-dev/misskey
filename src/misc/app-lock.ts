import { redisClient } from '../db/redis';
import { promisify } from 'util';
import * as redisLock from 'redis-lock';

/**
 * Retry delay (ms) for lock acquisition
 */
const retryDelay = 100;

const lock: (key: string, timeout?: number) => Promise<() => void>
	= redisClient
	? promisify(redisLock(redisClient, retryDelay))
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

export function getFetchInstanceMetadataLock(host: string, timeout = 30 * 1000) {
	return lock(`instance:${host}`, timeout);
}

export function getChartInsertLock(lockKey: string, timeout = 30 * 1000) {
	return lock(`chart-insert:${lockKey}`, timeout);
}
