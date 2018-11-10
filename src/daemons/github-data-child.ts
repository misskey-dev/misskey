import * as request from 'request-promise-native';
import config from '../config';
import fetchMeta from '../misc/fetch-meta';

const interval = 60000;

let token: string;

function github(type: string, suffix: string = '') {
	return token ? new Promise<any>((res, rej) => request(`https://api.github.com/${type}/syuilo${suffix}`, {
		headers: {
			'Accept': 'application/vnd.github.v3+json',
			'Authorization': `bearer ${token}`,
			'User-Agent': config.user_agent || 'Misskey'
		}
	}, (err, _, body) => err ? rej(err) : res(JSON.parse(body)))).catch(_ => null) : Promise.resolve(null);
}

async function tick() {
	if (!token) {
		const meta = await fetchMeta();
		if (meta) {
			const { githubAccessToken } = meta;
			if (githubAccessToken)
				token = githubAccessToken;
		}
	}

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
