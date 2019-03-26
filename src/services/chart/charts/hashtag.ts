import autobind from 'autobind-decorator';
import Chart, { Obj } from '../core';
import { User } from '../../../models/entities/user';
import { SchemaType } from '../../../misc/schema';
import { Users } from '../../../models';

/**
 * ハッシュタグに関するチャート
 */
export const logSchema = {
	/**
	 * 投稿された数
	 */
	count: {
		type: 'number',
		description: '投稿された数',
	},
};

export const hashtagLogSchema = {
	type: 'object' as 'object',
	properties: {
		local: {
			type: 'object' as 'object',
			properties: logSchema
		},
		remote: {
			type: 'object' as 'object',
			properties: logSchema
		},
	}
};

type HashtagLog = SchemaType<typeof hashtagLogSchema>;

export default class HashtagChart extends Chart<HashtagLog> {
	constructor() {
		super('hashtag', hashtagLogSchema, true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: HashtagLog): Promise<HashtagLog> {
		return {
			local: {
				count: 0
			},
			remote: {
				count: 0
			}
		};
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
