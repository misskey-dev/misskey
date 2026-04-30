/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import chalk from 'chalk';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';
import type { MiLocalUser, MiRemoteUser } from '@/models/User.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { UtilityService } from '@/core/UtilityService.js';
import { ILink, WebfingerService } from '@/core/WebfingerService.js';
import { RemoteLoggerService } from '@/core/RemoteLoggerService.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { bindThis } from '@/decorators.js';
import * as Acct from '@/misc/acct.js';

@Injectable()
export class RemoteUserResolveService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private utilityService: UtilityService,
		private webfingerService: WebfingerService,
		private remoteLoggerService: RemoteLoggerService,
		private apDbResolverService: ApDbResolverService,
		private apPersonService: ApPersonService,
	) {
		this.logger = this.remoteLoggerService.logger.createSubLogger('resolve-user');
	}

	@bindThis
	public async resolveUser(username: string, host: string | null): Promise<MiLocalUser | MiRemoteUser> {
		const usernameLower = username.toLowerCase();

		if (host == null) {
			this.logger.info(`return local user: ${usernameLower}`);
			return await this.usersRepository.findOneBy({ usernameLower, host: IsNull() }).then(u => {
				if (u == null) {
					throw new Error('user not found');
				} else {
					return u;
				}
			}) as MiLocalUser;
		}

		host = this.utilityService.toPuny(host);

		if (host === this.utilityService.toPuny(this.config.host)) {
			this.logger.info(`return local user: ${usernameLower}`);
			return await this.usersRepository.findOneBy({ usernameLower, host: IsNull() }).then(u => {
				if (u == null) {
					throw new Error('user not found');
				} else {
					return u;
				}
			}) as MiLocalUser;
		}

		const acctLower = `${usernameLower}@${host}`;

		const user = await this.usersRepository.findOneBy([
			{ usernameLower, host },
			{ acct: acctLower },
		]) as MiRemoteUser | null;

		if (user == null) {
			const { self, subject } = await this.resolveWebfinger(acctLower);

			if (this.utilityService.isUriLocal(self.href)) {
				const local = this.apDbResolverService.parseUri(self.href);
				if (local.local && local.type === 'users') {
					// the LR points to local
					return (await this.apDbResolverService
						.getUserFromApId(self.href)
						.then((u) => {
							if (u == null) {
								throw new Error('local user not found');
							} else {
								return u;
							}
						})) as MiLocalUser;
				}
			}

			this.logger.succ(`return new remote user: ${chalk.magenta(subject)}`);
			const newUser = await this.apPersonService.createPerson({ uri: self.href, acct: subject });

			if (newUser.acct !== subject) {
				await this.usersRepository.update({
					id: newUser.id,
				}, {
					acct: subject
				});

				newUser.acct = subject;
			}

			return newUser;
		}

		// ユーザー情報が古い場合は、WebFingerからやりなおして返す
		if (user.lastFetchedAt == null || Date.now() - user.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24) {
			// 繋がらないインスタンスに何回も試行するのを防ぐ, 後続の同様処理の連続試行を防ぐ ため 試行前にも更新する
			await this.usersRepository.update(user.id, {
				lastFetchedAt: new Date(),
			});

			this.logger.info(`try resync: ${acctLower}`);
			const { self, subject } = await this.resolveWebfinger(acctLower);

			if (user.uri !== self.href) {
				// if uri mismatch, Fix (user@host <=> AP's Person id(RemoteUser.uri)) mapping.
				this.logger.info(`uri missmatch: ${acctLower}`);
				this.logger.info(`recovery missmatch uri for (username=${username}, host=${host}) from ${user.uri} to ${self.href}`);

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
					acct: subject,
				});
			} else {
				this.logger.info(`uri is fine: ${acctLower}`);
			}

			await this.apPersonService.updatePerson({ uri: self.href, acct: subject });

			this.logger.info(`return resynced remote user: ${acctLower}`);
			return await this.usersRepository.findOneBy({ uri: self.href }).then(u => {
				if (u == null) {
					throw new Error('user not found');
				} else {
					return u as MiLocalUser | MiRemoteUser;
				}
			});
		}

		this.logger.info(`return existing remote user: ${acctLower}`);
		return user;
	}

	@bindThis
	private async resolveWebfinger(acctLower: string): Promise<{ self: ILink, subject: string | null }> {
		this.logger.info(`WebFinger for ${chalk.yellow(acctLower)}`);
		const finger = await this.webfingerService.webfinger(acctLower).catch(err => {
			this.logger.error(`Failed to WebFinger for ${chalk.yellow(acctLower)}: ${ err.statusCode ?? err.message }`);
			throw new Error(`Failed to WebFinger for ${acctLower}: ${ err.statusCode ?? err.message }`);
		});
		const self = finger.links.find(link => link.rel != null && link.rel.toLowerCase() === 'self');
		if (!self) {
			this.logger.error(`Failed to WebFinger for ${chalk.yellow(acctLower)}: self link not found`);
			throw new Error('self link not found');
		}
		let subject = Acct.validate(finger.subject) ? finger.subject :
			Acct.validate(acctLower) ? acctLower : null;
		if (subject) {
			subject = Acct.parse(subject).toString();
		}
		return { self, subject };
	}
}
