import $ from 'cafy';
import User, { ILocalUser } from '../../../../models/user';
import { publishMainStream } from '../../../../stream';

export const meta = {
	requireCredential: true,
	secure: true
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'home' parameter
	const [home, homeErr] = $.arr($.obj({
		name: $.str,
		id: $.str,
		place: $.str,
		data: $.obj()
	}).strict()).get(params.home);
	if (homeErr) return rej('invalid home param');

	await User.update(user._id, {
		$set: {
			'clientSettings.home': home
		}
	});

	res();

	publishMainStream(user._id, 'homeUpdated', home);
});
