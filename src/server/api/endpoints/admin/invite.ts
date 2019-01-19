import rndstr from 'rndstr';
import RegistrationTicket from '../../../../models/registration-tickets';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': '招待コードを発行します。'
	},

	requireCredential: true,
	requireModerator: true,

	params: {}
};

export default define(meta, () => RegistrationTicket.insert({
		createdAt: new Date(),
		code: rndstr({
			length: 5,
			chars: '0-9'
		})
	})
	.then(x => ({ code: x })));
