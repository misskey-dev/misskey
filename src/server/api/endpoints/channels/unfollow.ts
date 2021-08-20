import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Channels, ChannelFollowings } from '@/models/index';
import { publishUserEvent } from '@/services/stream';

export const meta = {
	tags: ['channels'],

	requireCredential: true as const,

	kind: 'write:channels',

	params: {
		channelId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '19959ee9-0153-4c51-bbd9-a98c49dc59d6'
		},
	}
};

export default define(meta, async (ps, user) => {
	const channel = await Channels.findOne({
		id: ps.channelId,
	});

	if (channel == null) {
		throw new ApiError(meta.errors.noSuchChannel);
	}

	await ChannelFollowings.delete({
		followerId: user.id,
		followeeId: channel.id,
	});

	publishUserEvent(user.id, 'unfollowChannel', channel);
});
