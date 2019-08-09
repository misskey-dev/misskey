import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '~/services/chart/core';
import { User } from '~/models/entities/user';
import { SchemaType } from '~/misc/schema';
import { Users } from '~/models';
import { name, schema } from '~/services/chart/charts/schemas/hashtag';

type HashtagLog = SchemaType<typeof schema>;

export default class HashtagChart extends Chart<HashtagLog> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected genNewLog(latest: HashtagLog): DeepPartial<HashtagLog> {
		return {};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<HashtagLog>> {
		return {};
	}

	@autobind
	public async update(hashtag: string, user: User) {
		const update: Obj = {
			count: 1
		};

		await this.incIfUnique({
			[Users.isLocalUser(user) ? 'local' : 'remote']: update
		}, 'users', user.id, hashtag);
	}
}
