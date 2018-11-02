import $ from 'cafy';
import User, { ILocalUser } from '../../../../models/user';
import { publishMainStream } from '../../../../stream';
import getParams from '../../get-params';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		home: {
			validator: $.arr($.obj({
				name: $.str,
				id: $.str,
				data: $.obj()
			}).strict())
		}
	}
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	await User.update(user._id, {
		$set: {
			'clientSettings.mobileHome': ps.home
		}
	});

	res();

	publishMainStream(user._id, 'mobileHomeUpdated', ps.home);
});
