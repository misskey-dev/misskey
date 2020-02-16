import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';
import { Mutings } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーのミュートを解除します。',
		'en-US': 'Unmute a user'
	},

	tags: ['mute', 'users'],

	requireCredential: true as const,

	kind: 'write:mutes',

	params: {
		userId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'b851d00b-8ab1-4a56-8b1b-e24187cb48ef'
		},

		muteeIsYourself: {
			message: 'Mutee is yourself.',
			code: 'MUTEE_IS_YOURSELF',
			id: 'f428b029-6b39-4d48-a1d2-cc1ae6dd5cf9'
		},

		notMuting: {
			message: 'You are not muting that user.',
			code: 'NOT_MUTING',
			id: '5467d020-daa9-4553-81e1-135c0c35a96d'
		},
	}
};

export default define(meta, async (ps, user) => {
	const muter = user;

	// Check if the mutee is yourself
	if (user.id === ps.userId) {
		throw new ApiError(meta.errors.muteeIsYourself);
	}

	// Get mutee
	const mutee = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	// Check not muting
	const exist = await Mutings.findOne({
		muterId: muter.id,
		muteeId: mutee.id
	});

	if (exist == null) {
		throw new ApiError(meta.errors.notMuting);
	}

	// Delete mute
	await Mutings.delete({
		id: exist.id
	});
});
