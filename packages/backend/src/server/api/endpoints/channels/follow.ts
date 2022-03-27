import define from '../../define.js';
import { ApiError } from '../../error.js';
import { Channels, ChannelFollowings } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { publishUserEvent } from '@/services/stream.js';

export const meta = {
	tags: ['channels'],

	requireCredential: true,

	kind: 'write:channels',

	errors: {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: 'c0031718-d573-4e85-928e-10039f1fbb68',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		channelId: { type: 'string', format: 'misskey:id' },
	},
	required: ['channelId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const channel = await Channels.findOneBy({
		id: ps.channelId,
	});

	if (channel == null) {
		throw new ApiError(meta.errors.noSuchChannel);
	}

	await ChannelFollowings.insert({
		id: genId(),
		createdAt: new Date(),
		followerId: user.id,
		followeeId: channel.id,
	});

	publishUserEvent(user.id, 'followChannel', channel);
});
