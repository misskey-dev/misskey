import autobind from 'autobind-decorator';
import Chart, { DeepPartial, KVs } from '../core';
import { User } from '@/models/entities/user';
import { Users } from '@/models/index';
import { name, schema } from './entities/hashtag';

/**
 * ハッシュタグに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class HashtagChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected aggregate(logs: HashtagLog[]): HashtagLog {
		return {
			local: {
				users: logs.reduce((a, b) => a.concat(b.local.users), [] as HashtagLog['local']['users']),
			},
			remote: {
				users: logs.reduce((a, b) => a.concat(b.remote.users), [] as HashtagLog['remote']['users']),
			},
		};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<KVs<typeof schema>>> {
		return {};
	}

	@autobind
	public async update(hashtag: string, user: { id: User['id'], host: User['host'] }): Promise<void> {
		await this.commit({
			'local.users': Users.isLocalUser(user) ? [user.id] : [],
			'remote.users': Users.isLocalUser(user) ? [] : [user.id],
		}, hashtag);
	}
}
