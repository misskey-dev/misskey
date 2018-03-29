import * as request from 'request';
import User from '../models/user';
const createPost = require('../server/api/endpoints/posts/create');

export default ({ data }, done) => {
	const asyncBot = User.findOne({ _id: data.userId });

	// Fetch parent status
	request({
		url: `${data.parentUrl}/statuses`,
		headers: {
			'User-Agent': 'misskey'
		}
	}, async (err, res, body) => {
		if (err) {
			console.error(err);
			return;
		}
		const parentStatuses = JSON.parse(body);
		const parentState = parentStatuses[0].state;
		const stillFailed = parentState == 'failure' || parentState == 'error';
		const text = stillFailed ?
			`**⚠️BUILD STILL FAILED⚠️**: ?[${data.message}](${data.htmlUrl})` :
			`**🚨BUILD FAILED🚨**: →→→?[${data.message}](${data.htmlUrl})←←←`;

		createPost({ text }, await asyncBot);
		done();
	});
};
