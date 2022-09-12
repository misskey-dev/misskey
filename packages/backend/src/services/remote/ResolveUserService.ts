import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import chalk from 'chalk';
import { IsNull } from 'typeorm';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Users } from '@/models/index.js';
import type { IRemoteUser, User } from '@/models/entities/user.js';
import type { Config } from '@/config/types.js';
import { toPuny } from '@/misc/convert-host.js';
import { remoteLogger } from './logger.js';
import { createPerson, updatePerson } from './activitypub/models/person.js';
import webFinger from './webfinger.js';

const logger = remoteLogger.createSubLogger('resolve-user');

@Injectable()
export class ResolveUserService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,
	) {
	}

	public async resolveUser(username: string, host: string | null): Promise<User> {
		const usernameLower = username.toLowerCase();
	
		if (host == null) {
			logger.info(`return local user: ${usernameLower}`);
			return await this.usersRepository.findOneBy({ usernameLower, host: IsNull() }).then(u => {
				if (u == null) {
					throw new Error('user not found');
				} else {
					return u;
				}
			});
		}
	
		host = toPuny(host);
	
		if (this.config.host === host) {
			logger.info(`return local user: ${usernameLower}`);
			return await this.usersRepository.findOneBy({ usernameLower, host: IsNull() }).then(u => {
				if (u == null) {
					throw new Error('user not found');
				} else {
					return u;
				}
			});
		}
	
		const user = await this.usersRepository.findOneBy({ usernameLower, host }) as IRemoteUser | null;
	
		const acctLower = `${usernameLower}@${host}`;
	
		if (user == null) {
			const self = await this.#resolveSelf(acctLower);
	
			logger.succ(`return new remote user: ${chalk.magenta(acctLower)}`);
			return await createPerson(self.href);
		}
	
		// ユーザー情報が古い場合は、WebFilgerからやりなおして返す
		if (user.lastFetchedAt == null || Date.now() - user.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24) {
			// 繋がらないインスタンスに何回も試行するのを防ぐ, 後続の同様処理の連続試行を防ぐ ため 試行前にも更新する
			await this.usersRepository.update(user.id, {
				lastFetchedAt: new Date(),
			});
	
			logger.info(`try resync: ${acctLower}`);
			const self = await this.#resolveSelf(acctLower);
	
			if (user.uri !== self.href) {
				// if uri mismatch, Fix (user@host <=> AP's Person id(IRemoteUser.uri)) mapping.
				logger.info(`uri missmatch: ${acctLower}`);
				logger.info(`recovery missmatch uri for (username=${username}, host=${host}) from ${user.uri} to ${self.href}`);
	
				// validate uri
				const uri = new URL(self.href);
				if (uri.hostname !== host) {
					throw new Error('Invalid uri');
				}
	
				await this.usersRepository.update({
					usernameLower,
					host: host,
				}, {
					uri: self.href,
				});
			} else {
				logger.info(`uri is fine: ${acctLower}`);
			}
	
			await updatePerson(self.href);
	
			logger.info(`return resynced remote user: ${acctLower}`);
			return await this.usersRepository.findOneBy({ uri: self.href }).then(u => {
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

	async #resolveSelf(acctLower: string) {
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
}
