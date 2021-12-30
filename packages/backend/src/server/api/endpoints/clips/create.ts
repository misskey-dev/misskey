import $ from 'cafy';
import define from '../../define';
import { genId } from '@/misc/gen-id';
import { Clips } from '@/models/index';

export const meta = {
	tags: ['clips'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		name: {
			validator: $.str.range(1, 100),
		},

		isPublic: {
			validator: $.optional.bool,
		},

		description: {
			validator: $.optional.nullable.str.range(1, 2048),
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'Clip',
	},
};

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
