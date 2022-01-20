import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Clips } from '@/models/index';
import { renderActivity } from '@/remote/activitypub/renderer';
import renderDelete from '@/remote/activitypub/renderer/delete';
import DeliverManager from '@/remote/activitypub/deliver-manager';
import { deliverToRelays } from '@/services/relay';
import config from '@/config';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		clipId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: '70ca08ba-6865-4630-b6fb-8494759aa754',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const clip = await Clips.findOne({
		id: ps.clipId,
		userId: user.id,
	});

	if (clip == null) {
		throw new ApiError(meta.errors.noSuchClip);
	}

	if (clip.isPublic){
		(async () => {
			const clipActivity = await renderActivity(renderDelete(`${config.url}/clips/${clip.id}`, user))
			const dm = new DeliverManager(user, clipActivity);

			dm.addFollowersRecipe();

			deliverToRelays(user, clipActivity);

			dm.execute();
		})();
	}

	await Clips.delete(clip.id);
});
