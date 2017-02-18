const uuid = require('./uuid.js');

const home = {
	left: [
		'profile',
		'calendar',
		'rss-reader',
		'photo-stream'
	],
	right: [
		'broadcast',
		'notifications',
		'user-recommendation',
		'donation',
		'nav',
		'tips'
	]
};

module.exports = () => {
	const homeData = [];

	home.left.forEach(widget => {
		homeData.push({
			name: widget,
			id: uuid(),
			place: 'left'
		});
	});

	home.right.forEach(widget => {
		homeData.push({
			name: widget,
			id: uuid(),
			place: 'right'
		});
	});

	const data = {
		cache: true,
		debug: false,
		nya: true,
		home: homeData
	};

	return data;
};
