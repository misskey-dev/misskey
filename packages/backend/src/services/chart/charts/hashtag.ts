import { Injectable, Inject } from '@nestjs/common';
import type { User } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';
import type { AppLockService } from '@/services/AppLockService.js';
import { DI_SYMBOLS } from '@/di-symbols.js';
import Chart from '../core.js';
import { name, schema } from './entities/hashtag.js';
import type { KVs } from '../core.js';
import type { DataSource } from 'typeorm';

/**
 * ハッシュタグに関するチャート
 */
// eslint-disable-next-line import/no-default-export
@Injectable()
export default class HashtagChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI_SYMBOLS.db)
		private db: DataSource,

		private appLockService: AppLockService,
	) {
		super(db, appLockService.getChartInsertLock, name, schema, true);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async update(hashtag: string, user: { id: User['id'], host: User['host'] }): Promise<void> {
		await this.commit({
			'local.users': Users.isLocalUser(user) ? [user.id] : [],
			'remote.users': Users.isLocalUser(user) ? [] : [user.id],
		}, hashtag);
	}
}
