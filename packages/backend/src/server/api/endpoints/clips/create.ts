import define from '../../define.js';
import { genId } from '@/misc/gen-id.js';
import { Clips } from '@/models/index.js';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Clip',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
		isPublic: { type: 'boolean', default: false },
		description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048 },
	},
	required: ['name'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const clip = await Clips.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
		isPublic: ps.isPublic,
		description: ps.description,
	}).then(x => Clips.findOneByOrFail(x.identifiers[0]));

	return await Clips.pack(clip);
});
