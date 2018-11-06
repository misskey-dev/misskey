import * as request from 'request-promise-native';
import config from '../config';

const interval = 60000;

function github(type: string, suffix: string = '') {
	const token =
		config.github &&
		config.github.access_tokens &&
		config.github.access_tokens.github_data ?
		config.github.access_tokens.github_data : null;

	return token ? new Promise<any>((res, rej) => request(`https://api.github.com/${type}/syuilo${suffix}`, {
		headers: {
			'Accept': 'application/vnd.github.v3+json',
			'Authorization': `bearer ${token}`,
			'User-Agent': config.user_agent || 'Misskey'
		}
	}, (err, _, body) => err ? rej(err) : res(JSON.parse(body)))).catch(_ => null) : Promise.resolve(null);
}

async function tick() {
	const [usersOwner, reposCollaborators, reposContributors] = await Promise.all([
		github('users'),
		github('repos', '/misskey/collaborators'),
		github('repos', '/misskey/contributors')
	]);

	process.send({
		owners: usersOwner ? [usersOwner] : [],
		collaborators: reposCollaborators || [],
		contributors: reposContributors || []
	});
}

tick();

setInterval(tick, interval);
