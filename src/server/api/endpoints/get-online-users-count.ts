import { USER_ONLINE_THRESHOLD } from '@/const';
import { Users } from '@/models';
import { MoreThan } from 'typeorm';
import define from '../define';

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
