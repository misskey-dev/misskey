import { strictEqual } from 'assert';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as Misskey from 'misskey-js';
import { SwitchCaseResponseType } from 'misskey-js/api.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** used for avoiding overload and some endpoints */
type Request = <E extends keyof Misskey.Endpoints, P extends Misskey.Endpoints[E]['req']>(
	endpoint: E, params: P, credential?: string | null
) => Promise<SwitchCaseResponseType<E, P>>;

export const ADMIN_PARAMS = { username: 'admin', password: 'admin' };

export async function signin(host: string, params: Misskey.entities.SigninRequest): Promise<Misskey.entities.SigninResponse> {
	// wait for a second to prevent hit rate limit
	await new Promise(resolve => setTimeout(resolve, 1000));
	console.log(`Sign in to @${params.username}@${host} ...`);
	return await (new Misskey.api.APIClient({
		origin: `https://${host}`,
		fetch: (input, init) => fetch(input, {
			...init,
			headers: {
				...init?.headers,
				'Content-Type': init?.headers['Content-Type'] != null ? init.headers['Content-Type'] : 'application/json',
			},
		}),
	}).request as Request)('signin', params)
		.then(res => {
			console.log(`Signed in to @${params.username}@${host}`);
			return res;
		})
		.catch(async err => {
			if (err.id === '22d05606-fbcf-421a-a2db-b32610dcfd1b') {
				await new Promise(resolve => setTimeout(resolve, Math.random() * 5000));
				return await signin(host, params);
			}
			throw err;
		});
}

async function createAdmin(host: string): Promise<Misskey.entities.SignupResponse | undefined> {
	const client = new Misskey.api.APIClient({ origin: `https://${host}` });
	return await client.request('admin/accounts/create', ADMIN_PARAMS).then(res => {
		console.log(`Successfully created admin account: @${ADMIN_PARAMS.username}@${host}`);
		return res as Misskey.entities.SignupResponse;
	}).then(async res => {
		await client.request('admin/roles/update-default-policies', {
			policies: {
				rateLimitFactor: 0 as never,
			},
		}, res.token);
		return res;
	}).catch(err => {
		if (err.info.e.message === 'access denied') {
			console.log(`Admin account already exists: @${ADMIN_PARAMS.username}@${host}`);
			return undefined;
		}
		throw err;
	});
}

export async function fetchAdmin(host: string): Promise<[Misskey.entities.SigninResponse, Misskey.api.APIClient]> {
	const admin = await signin(host, ADMIN_PARAMS)
		.catch(async err => {
			if (err.id === '6cc579cc-885d-43d8-95c2-b8c7fc963280') {
				await createAdmin(host);
				return await signin(host, ADMIN_PARAMS);
			} else if (err.id === '22d05606-fbcf-421a-a2db-b32610dcfd1b') {
				return await signin(host, ADMIN_PARAMS);
			}
			throw err;
		});

	return [admin, new Misskey.api.APIClient({ origin: `https://${host}`, credential: admin.i })];
}

export async function createAccount(host: string, adminClient: Misskey.api.APIClient): Promise<[Misskey.entities.SigninResponse, Misskey.api.APIClient, { username: string; password: string }]> {
	const username = crypto.randomUUID().replaceAll('-', '').substring(0, 20);
	const password = crypto.randomUUID().replaceAll('-', '');
	await adminClient.request('admin/accounts/create', { username, password });
	console.log(`Created an account: @${username}@${host}`);
	const signinRes = await signin(host, { username, password });

	return [
		signinRes,
		new Misskey.api.APIClient({ origin: `https://${host}`, credential: signinRes.i }),
		{ username, password },
	];
}

function parseAcct(acct: string): { username: string; host: string | null } {
	const split = (acct.startsWith('@') ? acct.substring(1) : acct).split('@', 2);
	return { username: split[0], host: split[1] ?? null };
}

export async function resolveRemoteAccount(from_acct: string, to_acct: string, fromClient?: Misskey.api.APIClient): Promise<Misskey.entities.UserDetailedNotMe> {
	const [from, to] = [parseAcct(from_acct), parseAcct(to_acct)];
	const fromAdminClient: Misskey.api.APIClient = fromClient ?? (await fetchAdmin(from.username))[1];

	return new Promise<Misskey.entities.UserDetailedNotMe>((resolve, reject) => {
		console.log(`Resolving @${to.username}@${to.host} from @${from.username}@${from.host} ...`);
		fromAdminClient.request('ap/show', { uri: `https://${to.host}/@${to.username}` })
			.then(res => {
				console.log(`Resolved @${to.username}@${to.host} from @${from.username}@${from.host}`);
				strictEqual(res.type, 'User');
				strictEqual(res.object.url, `https://${to.host}/@${to.username}`);
				resolve(res.object);
			})
			.catch(err => reject(err));
	});
}

export async function uploadFile(host: string, path: string, token: string): Promise<Misskey.entities.DriveFile> {
	const filename = path.split('/').pop() ?? 'untitled';
	const blob = new Blob([await readFile(join(__dirname, path))]);

	const body = new FormData();
	body.append('i', token);
	body.append('force', 'true');
	body.append('file', blob);
	body.append('name', filename);

	return new Promise<Misskey.entities.DriveFile>((resolve, reject) => {
		fetch(`https://${host}/api/drive/files/create`, {
			method: 'POST',
			body,
		}).then(async res => {
			resolve(await res.json());
		}).catch(err => {
			reject(err);
		});
	});
}
