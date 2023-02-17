declare module 'redis-lock' {
	import type Redis from 'ioredis';

	type Lock = (lockName: string, timeout?: number, taskToPerform?: () => Promise<void>) => void;
	function redisLock(client: Redis.Redis, retryDelay: number): Lock;

	export = redisLock;
}
