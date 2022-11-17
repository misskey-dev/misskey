import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { User } from '@/models/entities/User.js';
import { AppLockService } from '@/core/AppLockService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import Chart from '../core.js';
import { ChartLoggerService } from '../ChartLoggerService.js';
import { name, schema } from './entities/hashtag.js';
import type { KVs } from '../core.js';

/**
 * ハッシュタグに関するチャート
 */
// eslint-disable-next-line import/no-default-export
@Injectable()
export default class HashtagChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private appLockService: AppLockService,
		private userEntityService: UserEntityService,
		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => appLockService.getChartInsertLock(k), chartLoggerService.logger, name, schema, true);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async update(hashtag: string, user: { id: User['id'], host: User['host'] }): Promise<void> {
		await this.commit({
			'local.users': this.userEntityService.isLocalUser(user) ? [user.id] : [],
			'remote.users': this.userEntityService.isLocalUser(user) ? [] : [user.id],
		}, hashtag);
	}
}
