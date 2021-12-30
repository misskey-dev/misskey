import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { Channels, DriveFiles } from '@/models/index';

export const meta = {
	tags: ['channels'],

	requireCredential: true as const,

	kind: 'write:channels',

	params: {
		channelId: {
			validator: $.type(ID),
		},

		name: {
			validator: $.optional.str.range(1, 128),
		},

		description: {
			validator: $.nullable.optional.str.range(1, 2048),
		},

		bannerId: {
			validator: $.nullable.optional.type(ID),
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'Channel',
	},

	errors: {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: 'f9c5467f-d492-4c3c-9a8d-a70dacc86512',
		},

		accessDenied: {
			message: 'You do not have edit privilege of the channel.',
			code: 'ACCESS_DENIED',
			id: '1fb7cb09-d46a-4fdf-b8df-057788cce513',
		},

		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'e86c14a4-0da2-4032-8df3-e737a04c7f3b',
		},
	},
};

export default define(meta, async (ps, me) => {
	const channel = await Channels.findOne({
		id: ps.channelId,
	});

	if (channel == null) {
		throw new ApiError(meta.errors.noSuchChannel);
	}

	if (channel.userId !== me.id) {
		throw new ApiError(meta.errors.accessDenied);
	}

	// eslint:disable-next-line:no-unnecessary-initializer
	let banner = undefined;
	if (ps.bannerId != null) {
		banner = await DriveFiles.findOne({
			id: ps.bannerId,
			userId: me.id,
		});

		if (banner == null) {
			throw new ApiError(meta.errors.noSuchFile);
		}
	} else if (ps.bannerId === null) {
		banner = null;
	}

	await Channels.update(channel.id, {
		...(ps.name !== undefined ? { name: ps.name } : {}),
		...(ps.description !== undefined ? { description: ps.description } : {}),
		...(banner ? { bannerId: banner.id } : {}),
	});

	return await Channels.pack(channel.id, me);
});
