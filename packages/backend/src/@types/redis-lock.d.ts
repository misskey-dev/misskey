/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module 'redis-lock' {
	import type Redis from 'ioredis';

	type Lock = (lockName: string, timeout?: number, taskToPerform?: () => Promise<void>) => void;
	function redisLock(client: Redis.Redis, retryDelay: number): Lock;

	export = redisLock;
}
