import $ from 'cafy';
import define from '~/server/api/define';
import { sendEmail } from '~/services/send-email';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		to: {
			validator: $.str,
		},
		subject: {
			validator: $.str,
		},
		text: {
			validator: $.str,
		},
	}
};

export default define(meta, async (ps) => {
	await sendEmail(ps.to, ps.subject, ps.text);
});
