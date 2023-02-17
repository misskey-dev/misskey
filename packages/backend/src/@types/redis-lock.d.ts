declare module 'redis-lock' {
	import type Redis from 'ioredis';

	type lock = (lockName: string, timeout?: number, taskToPerform?: function) => void;
	function redisLock(client: Redis.Redis, retryDelay: number): Lock;

	export = redisLock;
}
