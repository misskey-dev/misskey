import { Injectable, Inject } from '@nestjs/common';
import { Not, IsNull } from 'typeorm';
import { Users } from '@/models/index.js';
import type { User } from '@/models/entities/user.js';
import type { AppLockService } from '@/services/AppLockService.js';
import Chart from '../core.js';
import { name, schema } from './entities/users.js';
import type { KVs } from '../core.js';
import type { DataSource } from 'typeorm';

/**
 * ユーザー数に関するチャート
 */
// eslint-disable-next-line import/no-default-export
@Injectable()
export default class UsersChart extends Chart<typeof schema> {
	constructor(
		@Inject('db')
		private db: DataSource,

		private appLockService: AppLockService,
	) {
		super(db, appLockService.getChartInsertLock, name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		const [localCount, remoteCount] = await Promise.all([
			Users.countBy({ host: IsNull() }),
			Users.countBy({ host: Not(IsNull()) }),
		]);

		return {
			'local.total': localCount,
			'remote.total': remoteCount,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async update(user: { id: User['id'], host: User['host'] }, isAdditional: boolean): Promise<void> {
		const prefix = Users.isLocalUser(user) ? 'local' : 'remote';

		await this.commit({
			[`${prefix}.total`]: isAdditional ? 1 : -1,
			[`${prefix}.inc`]: isAdditional ? 1 : 0,
			[`${prefix}.dec`]: isAdditional ? 0 : 1,
		});
	}
}
