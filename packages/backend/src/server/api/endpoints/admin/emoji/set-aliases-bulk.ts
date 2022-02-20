import define from '../../../define';
import { Emojis } from '@/models/index';
import { getConnection, In } from 'typeorm';
import { ApiError } from '../../../error';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		ids: { type: 'array', items: {
			type: 'string', format: 'misskey:id',
		} },
		aliases: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['ids', 'aliases'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	await Emojis.update({
		id: In(ps.ids),
	}, {
		updatedAt: new Date(),
		aliases: ps.aliases,
	});

	await getConnection().queryResultCache!.remove(['meta_emojis']);
});
