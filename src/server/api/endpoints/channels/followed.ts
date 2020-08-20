import define from '../../define';
import { Channels, ChannelFollowings } from '../../../../models';

export const meta = {
	tags: ['channels', 'account'],

	requireCredential: true as const,

	kind: 'read:channels',

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Channel',
		}
	},
};

export default define(meta, async (ps, me) => {
	const followings = await ChannelFollowings.find({
		followerId: me.id,
	});

	return await Promise.all(followings.map(x => Channels.pack(x.followeeId, me)));
});
