import define from '../../define';
import { Logs } from '../../../../models';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,
};

export default define(meta, async (ps) => {
	await Logs.delete({});
});
