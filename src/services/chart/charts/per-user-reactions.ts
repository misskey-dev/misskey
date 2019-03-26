import autobind from 'autobind-decorator';
import Chart from '../core';
import { User } from '../../../models/entities/user';
import { Note } from '../../../models/entities/note';
import { SchemaType } from '../../../misc/schema';
import { Users } from '../../../models';

/**
 * ユーザーごとのリアクションに関するチャート
 */
export const logSchema = {
	/**
	 * フォローしている合計
	 */
	count: {
		type: 'number',
		description: 'リアクションされた数',
	},
};

export const perUserReactionsLogSchema = {
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

type PerUserReactionsLog = SchemaType<typeof perUserReactionsLogSchema>;

export default class PerUserReactionsChart extends Chart<PerUserReactionsLog> {
	constructor() {
		super('perUserReaction', perUserReactionsLogSchema, true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: PerUserReactionsLog, group?: string): Promise<PerUserReactionsLog> {
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
	public async update(user: User, note: Note) {
		this.inc({
			[Users.isLocalUser(user) ? 'local' : 'remote']: { count: 1 }
		}, note.userId);
	}
}
