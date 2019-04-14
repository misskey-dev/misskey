import webFinger from './webfinger';
import config from '../config';
import { createPerson, updatePerson } from './activitypub/models/person';
import { URL } from 'url';
import { remoteLogger } from './logger';
import chalk from 'chalk';
import { User, IRemoteUser } from '../models/entities/user';
import { Users } from '../models';
import { toPuny } from '../misc/convert-host';

const logger = remoteLogger.createSubLogger('resolve-user');

export async function resolveUser(username: string, host: string | null, option?: any, resync = false): Promise<User> {
	const usernameLower = username.toLowerCase();

	if (host == null) {
		logger.info(`return local user: ${usernameLower}`);
		return await Users.findOne({ usernameLower, host: null }).then(u => {
			if (u == null) {
				throw new Error('user not found');
			} else {
				return u;
			}
		});
	}

	host = toPuny(host);

	if (config.host == host) {
		logger.info(`return local user: ${usernameLower}`);
		return await Users.findOne({ usernameLower, host: null }).then(u => {
			if (u == null) {
				throw new Error('user not found');
			} else {
				return u;
			}
		});
	}

	const user = await Users.findOne({ usernameLower, host }, option);

	const acctLower = `${usernameLower}@${host}`;

	if (user == null) {
		const self = await resolveSelf(acctLower);

		logger.succ(`return new remote user: ${chalk.magenta(acctLower)}`);
		return await createPerson(self.href);
	}

	if (resync) {
		logger.info(`try resync: ${acctLower}`);
		const self = await resolveSelf(acctLower);

		if ((user as IRemoteUser).uri !== self.href) {
			// if uri mismatch, Fix (user@host <=> AP's Person id(IRemoteUser.uri)) mapping.
			logger.info(`uri missmatch: ${acctLower}`);
			logger.info(`recovery missmatch uri for (username=${username}, host=${host}) from ${(user as IRemoteUser).uri} to ${self.href}`);

			// validate uri
			const uri = new URL(self.href);
			if (uri.hostname !== host) {
				throw new Error(`Invalied uri`);
			}

			await Users.update({
				usernameLower,
				host: host
			}, {
				uri: self.href
			});
		} else {
			logger.info(`uri is fine: ${acctLower}`);
		}

		await updatePerson(self.href);

		logger.info(`return resynced remote user: ${acctLower}`);
		return await Users.findOne({ uri: self.href }).then(u => {
			if (u == null) {
				throw new Error('user not found');
			} else {
				return u;
			}
		});
	}

	logger.info(`return existing remote user: ${acctLower}`);
	return user;
}

async function resolveSelf(acctLower: string) {
	logger.info(`WebFinger for ${chalk.yellow(acctLower)}`);
	const finger = await webFinger(acctLower).catch(e => {
		logger.error(`Failed to WebFinger for ${chalk.yellow(acctLower)}: ${ e.statusCode || e.message }`);
		throw new Error(`Failed to WebFinger for ${acctLower}: ${ e.statusCode || e.message }`);
	});
	const self = finger.links.find(link => link.rel != null && link.rel.toLowerCase() === 'self');
	if (!self) {
		logger.error(`Failed to WebFinger for ${chalk.yellow(acctLower)}: self link not found`);
		throw new Error('self link not found');
	}
	return self;
}
