import { USER_ONLINE_THRESHOLD } from '@/const.js';
import { Users } from '@/models/index.js';
import { MoreThan } from 'typeorm';
import define from '../define.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false as const,

	params: {
	}
};

export default define(meta, async () => {
	const count = await Users.count({
		lastActiveDate: MoreThan(new Date(Date.now() - USER_ONLINE_THRESHOLD))
	});

	return {
		count
	};
});
