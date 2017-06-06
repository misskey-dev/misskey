const stream = require('../../common/scripts/stream');
const getPostSummary = require('../../common/scripts/get-post-summary');

module.exports = me => {
	const s = stream(me);

	s.event.on('drive_file_created', file => {
		const n = new Notification('ファイルがアップロードされました', {
			body: file.name,
			icon: file.url + '?thumbnail&size=64'
		});
		setTimeout(n.close.bind(n), 5000);
	});

	s.event.on('mention', post => {
		const n = new Notification(`${post.user.name}さんから:`, {
			body: getPostSummary(post),
			icon: post.user.avatar_url + '?thumbnail&size=64'
		});
		setTimeout(n.close.bind(n), 6000);
	});

	s.event.on('reply', post => {
		const n = new Notification(`${post.user.name}さんから返信:`, {
			body: getPostSummary(post),
			icon: post.user.avatar_url + '?thumbnail&size=64'
		});
		setTimeout(n.close.bind(n), 6000);
	});

	s.event.on('quote', post => {
		const n = new Notification(`${post.user.name}さんが引用:`, {
			body: getPostSummary(post),
			icon: post.user.avatar_url + '?thumbnail&size=64'
		});
		setTimeout(n.close.bind(n), 6000);
	});

	return s;
};
