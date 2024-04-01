import { Result, Callback } from 'ioredis';

declare module 'ioredis' {
	interface RedisCommander<Context> {
		/*
		 * Set value if key has the specified value.
		 *
		 * lua script:
		 * if redis.call('GET', KEYS[1]) == ARGV[1] then
		 *   return redis.call('SET', KEYS[1], ARGV[2])
		 * else
		 *  return 0
		 * end
		 */
		setIf(key: string, value: string, newValue: string, callback?: Callback<string>): Result<string, Context>;

		/*
		 * Unlink key if key has the specified value.
		 *
		 * lua script:
		 * if redis.call('GET', KEYS[1]) == ARGV[1] then
		 *   return redis.call('UNLINK', KEYS[1])
		 * else
		 *  return 0
		 * end
		 */
		unlinkIf(key: string, value: string, callback?: Callback<string>): Result<string, Context>;
	}
}
