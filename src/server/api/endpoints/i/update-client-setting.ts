import $ from 'cafy';
import { publishMainStream } from '../../../../services/stream';
import define from '../../define';
import { UserProfiles } from '../../../../models';
import { ensure } from '../../../../prelude/ensure';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		name: {
			validator: $.str.match(/^[a-zA-Z]+$/)
		},

		value: {
			validator: $.nullable.any
		}
	}
};

export default define(meta, async (ps, user) => {
	const profile = await UserProfiles.findOne(user.id).then(ensure);

	await UserProfiles.createQueryBuilder().update()
		.set({
			clientData: Object.assign(profile.clientData, {
				[ps.name]: ps.value
			}),
		})
		.where('userId = :id', { id: user.id })
		.execute();

	// Publish event
	publishMainStream(user.id, 'clientSettingUpdated', {
		key: ps.name,
		value: ps.value
	});
});
