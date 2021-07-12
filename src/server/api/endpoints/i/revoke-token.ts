import $ from 'cafy';
import define from '../../define';
import { AccessTokens } from '../../../../models';
import { ID } from '@/misc/cafy-id';
import { publishUserEvent } from '@/services/stream';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		tokenId: {
			validator: $.type(ID)
		}
	}
};

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
