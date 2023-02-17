declare module 'redis-lock' {
	import Redis from 'ioredis';
	declare function redisLock(client: Redis.Redis, retryDelay: number): (lockName: string, timeout?: number) => Promise<Redis.Pipeline | void>;
	export = redisLock;
}
