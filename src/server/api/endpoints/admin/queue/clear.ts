import define from '../../../define';
import { destroy } from '../../../../../queue';

export const meta = {
	requireCredential: true,
	requireModerator: true,

	params: {}
};

export default define(meta, (ps) => new Promise(async (res, rej) => {
	destroy();

	res();
}));
