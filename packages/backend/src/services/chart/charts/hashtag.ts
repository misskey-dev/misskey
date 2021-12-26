import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../core';
import { User } from '@/models/entities/user';
import { SchemaType } from '@/misc/schema';
import { Users } from '@/models/index';
import { name, schema } from './entities/hashtag';

type HashtagLog = SchemaType<typeof schema>;

/**
 * ハッシュタグに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class HashtagChart extends Chart<HashtagLog> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected genNewLog(latest: HashtagLog): DeepPartial<HashtagLog> {
		return {};
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
	protected async fetchActual(): Promise<DeepPartial<HashtagLog>> {
		return {};
	}

	@autobind
	public async update(hashtag: string, user: { id: User['id'], host: User['host'] }): Promise<void> {
		const update: Obj = {
			users: [user.id],
		};

		await this.inc({
			[Users.isLocalUser(user) ? 'local' : 'remote']: update,
		}, hashtag);
	}
}
