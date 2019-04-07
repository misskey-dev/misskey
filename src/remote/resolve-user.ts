import { toUnicode, toASCII } from 'punycode';
import webFinger from './webfinger';
import config from '../config';
import { createPerson, updatePerson } from './activitypub/models/person';
import { URL } from 'url';
import { remoteLogger } from './logger';
import chalk from 'chalk';
import { User, IRemoteUser } from '../models/entities/user';
import { Users } from '../models';

const logger = remoteLogger.createSubLogger('resolve-user');

export async function resolveUser(username: string, _host: string, option?: any, resync = false): Promise<User> {
	const usernameLower = username.toLowerCase();

	if (_host == null) {
		logger.info(`return local user: ${usernameLower}`);
		return await Users.findOne({ usernameLower, host: null });
	}

	const configHostAscii = toASCII(config.host).toLowerCase();
	const configHost = toUnicode(configHostAscii);

	const hostAscii = toASCII(_host).toLowerCase();
	const host = toUnicode(hostAscii);

	if (configHost == host) {
		logger.info(`return local user: ${usernameLower}`);
		return await Users.findOne({ usernameLower, host: null });
	}

	const user = await Users.findOne({ usernameLower, host }, option);

	const acctLower = `${usernameLower}@${hostAscii}`;

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
			if (uri.hostname !== hostAscii) {
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
		return await Users.findOne({ uri: self.href });
	}

	logger.info(`return existing remote user: ${acctLower}`);
	return user;
}

async function resolveSelf(acctLower: string) {
	logger.info(`WebFinger for ${chalk.yellow(acctLower)}`);
	const finger = await webFinger(acctLower).catch(e => {
		logger.error(`Failed to WebFinger for ${chalk.yellow(acctLower)}: ${e.message} (${e.status})`);
		throw e;
	});
	const self = finger.links.find(link => link.rel && link.rel.toLowerCase() === 'self');
	if (!self) {
		logger.error(`Failed to WebFinger for ${chalk.yellow(acctLower)}: self link not found`);
		throw new Error('self link not found');
	}
	return self;
}
