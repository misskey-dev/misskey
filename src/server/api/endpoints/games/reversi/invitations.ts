import define from '../../../define';
import { ReversiMatchings } from '../../../../../models';

export const meta = {
	tags: ['games'],

	requireCredential: true as const
};

export default define(meta, async (ps, user) => {
	// Find session
	const invitations = await ReversiMatchings.find({
		childId: user.id
	});

	return await Promise.all(invitations.map((i) => ReversiMatchings.pack(i, user)));
});
