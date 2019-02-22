import rndstr from 'rndstr';
import RegistrationTicket from '../../../../models/registration-tickets';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': '招待コードを発行します。'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {}
};

export default define(meta, async (ps) => {
	const code = rndstr({ length: 5, chars: '0-9' });

	await RegistrationTicket.insert({
		createdAt: new Date(),
		code: code
	});

	return {
		code: code
	};
});
