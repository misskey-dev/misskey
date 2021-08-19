import define from '../../../../define.js';
import { ReversiMatchings } from '@/models/index.js';

export const meta = {
	tags: ['games'],

	requireCredential: true as const
};

export default define(meta, async (ps, user) => {
	await ReversiMatchings.delete({
		parentId: user.id
	});
});
