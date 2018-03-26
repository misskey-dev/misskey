import config from '../../conf';

export default function(res, user, redirect: boolean) {
	const expires = 1000 * 60 * 60 * 24 * 365; // One Year
	res.cookie('i', user.token, {
		path: '/',
		domain: `.${config.hostname}`,
		secure: config.url.substr(0, 5) === 'https',
		httpOnly: false,
		expires: new Date(Date.now() + expires),
		maxAge: expires
	});

	if (redirect) {
		res.redirect(config.url);
	} else {
		res.sendStatus(204);
	}
}
