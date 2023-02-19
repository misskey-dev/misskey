declare module 'redis-lock' {
	import { Redis } from 'ioredis';
	function init(client: Redis, retryDelay: number = 50): typeof lock;
	async function lock(lockName: string, timeout: number = 5000): Promise<() => void>;

	export = init;
}
