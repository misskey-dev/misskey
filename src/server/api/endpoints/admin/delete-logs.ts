import define from '~/server/api/define';
import { Logs } from '~/models';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
};

export default define(meta, async (ps) => {
	await Logs.delete({});
});
