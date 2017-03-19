import uuid from './uuid';

const home = {
	left: [
		'profile',
		'calendar',
		'rss-reader',
		'photo-stream',
		'version'
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

export default () => {
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
		home: JSON.stringify(homeData)
	};

	return data;
};
