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
		}
	},
};

export default define(meta, async (ps, user) => {
	const clip = await Clips.save({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
	});

	return await Clips.pack(clip);
});
