import define from '../../../define';
import { destroy } from '../../../../../queue';

export const meta = {
	requireCredential: true,
	requireModerator: true,

	params: {}
};

export default define(meta, async (ps) => {
	destroy();

	return;
});
