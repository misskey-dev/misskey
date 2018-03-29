import * as URL from 'url';

import Post from '../../server/api/models/post';
import User from '../../server/api/models/user';
import parse from '../../server/api/common/text';

process.on('unhandledRejection', console.dir);

function tokenize(text: string) {
	if (text == null) return [];

	// パース
	const ast = parse(text);

	const domains = ast
		// URLを抽出
		.filter(t => t.type == 'url' || t.type == 'link')
		.map(t => URL.parse(t.url).hostname);

	return domains;
}

// Fetch all users
User.find({}, {
	fields: {
		_id: true
	}
}).then(users => {
	let i = -1;

	const x = cb => {
		if (++i == users.length) return cb();
		extractDomainsOne(users[i]._id).then(() => x(cb), err => {
			console.error(err);
			setTimeout(() => {
				i--;
				x(cb);
			}, 1000);
		});
	};

	x(() => {
		console.log('complete');
	});
});

function extractDomainsOne(id) {
	return new Promise(async (resolve, reject) => {
		process.stdout.write(`extracting domains of ${id} ...`);

		// Fetch recent posts
		const recentPosts = await Post.find({
			userId: id,
			text: {
				$exists: true
			}
		}, {
			sort: {
				_id: -1
			},
			limit: 10000,
			fields: {
				_id: false,
				text: true
			}
		});

		// 投稿が少なかったら中断
		if (recentPosts.length < 100) {
			process.stdout.write(' >>> -\n');
			return resolve();
		}

		const domains = {};

		// Extract domains from recent posts
		recentPosts.forEach(post => {
			const domainsOfPost = tokenize(post.text);

			domainsOfPost.forEach(domain => {
				if (domains[domain]) {
					domains[domain]++;
				} else {
					domains[domain] = 1;
				}
			});
		});

		// Calc peak
		let peak = 0;
		Object.keys(domains).forEach(domain => {
			if (domains[domain] > peak) peak = domains[domain];
		});

		// Sort domains by frequency
		const domainsSorted = Object.keys(domains).sort((a, b) => domains[b] - domains[a]);

		// Lookup top 10 domains
		const topDomains = domainsSorted.slice(0, 10);

		process.stdout.write(' >>> ' + topDomains.join(', ') + '\n');

		// Make domains object (includes weights)
		const domainsObj = topDomains.map(domain => ({
			domain: domain,
			weight: domains[domain] / peak
		}));

		// Save
		User.update({ _id: id }, {
			$set: {
				domains: domainsObj
			}
		}).then(() => {
			resolve();
		}, err => {
			reject(err);
		});
	});
}
