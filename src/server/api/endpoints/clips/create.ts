import $ from 'cafy';
import define from '../../define';
import { genId } from '../../../../misc/gen-id';
import { Clips } from '../../../../models';

export const meta = {
	tags: ['clips'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		name: {
			validator: $.str.range(1, 100)
		},

		isPublic: {
			validator: $.optional.bool
		},

		description: {
			validator: $.optional.nullable.str.range(1, 2048)
		}
	},
};

export default define(meta, async (ps, user) => {
	const clip = await Clips.save({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
		isPublic: ps.isPublic,
		description: ps.description,
	});

	return await Clips.pack(clip);
});
