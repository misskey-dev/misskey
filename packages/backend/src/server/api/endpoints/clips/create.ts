import define from '../../define';
import { genId } from '@/misc/gen-id';
import { Clips } from '@/models/index';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		type: 'object',
		properties: {
			name: { type: 'string', minLength: 1, maxLength: 100, },
			isPublic: { type: 'boolean', },
			description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048, },
		},
		required: ['name'],
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Clip',
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const clip = await Clips.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
		isPublic: ps.isPublic,
		description: ps.description,
	}).then(x => Clips.findOneOrFail(x.identifiers[0]));

	return await Clips.pack(clip);
});
