import $ from 'cafy';
import define from '../../define';
import { AccessTokens } from '@/models/index';
import { ID } from '@/misc/cafy-id';
import { publishUserEvent } from '@/services/stream';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		tokenId: {
			validator: $.type(ID),
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const token = await AccessTokens.findOne(ps.tokenId);

	if (token) {
		await AccessTokens.delete({
			id: ps.tokenId,
			userId: user.id,
		});

		// Terminate streaming
		publishUserEvent(user.id, 'terminate');
	}
});
