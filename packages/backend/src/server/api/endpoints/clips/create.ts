import $ from 'cafy';
import define from '../../define';
import { genId } from '@/misc/gen-id';
import { Clips } from '@/models/index';
import DeliverManager from '@/remote/activitypub/deliver-manager';
import { deliverToRelays } from '@/services/relay';
import { renderActivity } from '@/remote/activitypub/renderer';
import { renderClipCreate } from '@/remote/activitypub/renderer/clip';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

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

	if (clip.isPublic){
		(async () => {
			const clipActivity = await renderActivity(renderClipCreate(clip));
			const dm = new DeliverManager(user, clipActivity);

			dm.addFollowersRecipe();

			deliverToRelays(user, clipActivity);

			dm.execute();
		})();
	}

	return await Clips.pack(clip);
});
