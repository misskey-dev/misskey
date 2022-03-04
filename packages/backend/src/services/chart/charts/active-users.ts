import Chart, { KVs } from '../core.js';
import { User } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';
import { name, schema } from './entities/active-users.js';

const week = 1000 * 60 * 60 * 24 * 7;
const month = 1000 * 60 * 60 * 24 * 30;
const year = 1000 * 60 * 60 * 24 * 365;

/**
 * アクティブユーザーに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class ActiveUsersChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async read(user: { id: User['id'], host: null, createdAt: User['createdAt'] }): Promise<void> {
		await this.commit({
			'read': [user.id],
			'registeredWithinWeek': (Date.now() - user.createdAt.getTime() < week) ? [user.id] : [],
			'registeredWithinMonth': (Date.now() - user.createdAt.getTime() < month) ? [user.id] : [],
			'registeredWithinYear': (Date.now() - user.createdAt.getTime() < year) ? [user.id] : [],
			'registeredOutsideWeek': (Date.now() - user.createdAt.getTime() > week) ? [user.id] : [],
			'registeredOutsideMonth': (Date.now() - user.createdAt.getTime() > month) ? [user.id] : [],
			'registeredOutsideYear': (Date.now() - user.createdAt.getTime() > year) ? [user.id] : [],
		});
	}

	public async write(user: { id: User['id'], host: null, createdAt: User['createdAt'] }): Promise<void> {
		await this.commit({
			'write': [user.id],
		});
	}
}
