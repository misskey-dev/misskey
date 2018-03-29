/**
 * Mention
 */
import parseAcct from '../../../common/user/parse-acct';

module.exports = text => {
	const match = text.match(/^(?:@[a-zA-Z0-9\-]+){1,2}/);
	if (!match) return null;
	const mention = match[0];
	const { username, host } = parseAcct(mention.substr(1));
	return {
		type: 'mention',
		content: mention,
		username,
		host
	};
};
