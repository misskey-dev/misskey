import define from '../../../../define';
import { ReversiMatchings } from '@/models/index';

export const meta = {
	tags: ['games'],

	requireCredential: true as const
};

export default define(meta, async (ps, user) => {
	await ReversiMatchings.delete({
		parentId: user.id
	});
});
