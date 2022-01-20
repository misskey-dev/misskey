import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Clips } from '@/models/index';
import { renderActivity } from '@/remote/activitypub/renderer';
import { renderClipCreate } from '@/remote/activitypub/renderer/clip';
import renderUpdate from '@/remote/activitypub/renderer/update';
import DeliverManager from '@/remote/activitypub/deliver-manager';
import { deliverToRelays } from '@/services/relay';
import { IOrderedCollection } from '@/remote/activitypub/type';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		clipId: {
			validator: $.type(ID),
		},

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

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'b4d92d70-b216-46fa-9a3f-a8c811699257',
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
	// Fetch the clip
	const clip = await Clips.findOne({
		id: ps.clipId,
		userId: user.id,
	});

	if (clip == null) {
		throw new ApiError(meta.errors.noSuchClip);
	}

	await Clips.update(clip.id, {
		name: ps.name,
		description: ps.description,
		isPublic: ps.isPublic,
	});

	if (clip.isPublic){
		(async () => {
			const clipActivity = await renderActivity(renderUpdate({
				type: 'OrderedCollection',
				id: `${config.url}/clips/${clip.id}`,
				name: ps.name,
				content: ps.description,
				summary: 'misskey:clip',
				attributedTo: `${config.url}/users/${user.id}`,
			} as IOrderedCollection, user));
			const dm = new DeliverManager(user, clipActivity);

			dm.addFollowersRecipe();

			deliverToRelays(user, clipActivity);

			dm.execute();
		})();
	}

	return await Clips.pack(clip.id);
});
