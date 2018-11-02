import $ from 'cafy';
import User, { ILocalUser } from '../../../../models/user';
import { publishMainStream } from '../../../../stream';
import getParams from '../../get-params';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		name: {
			validator: $.str
		},

		value: {
			validator: $.any.nullable
		}
	}
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const x: any = {};
	x[`clientSettings.${name}`] = ps.value;

	await User.update(user._id, {
		$set: x
	});

	res();

	// Publish event
	publishMainStream(user._id, 'clientSettingUpdated', {
		key: name,
		value: ps.value
	});
});
