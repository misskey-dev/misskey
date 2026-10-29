/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import chalk from 'chalk';
import { AbortError, FetchError } from 'node-fetch';
import { IsNull } from 'typeorm';
import { StatusError } from '@/misc/status-error.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';
import type { MiLocalUser, MiRemoteUser } from '@/models/User.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import type { MiMeta } from '@/models/Meta.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { ILink, WebfingerService } from '@/core/WebfingerService.js';
import { RemoteLoggerService } from '@/core/RemoteLoggerService.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { bindThis } from '@/decorators.js';

// HttpRequestService uses node-fetch for both signed Actor GETs and WebFinger.
// Match transport failures only: invalid JSON, size limits and Actor validation
// errors must still propagate. Do not classify arbitrary Error.code values here:
// updatePerson also performs DB writes whose connection errors must not be hidden.
function isCommunicationError(err: unknown): boolean {
	if (err instanceof StatusError) {
		// 408/429 signal timeout/load; 404/410 allow reading a cached, removed Actor.
		// isRetryable also includes 3xx, so restrict it to actual server errors.
		return [404, 408, 410, 429].includes(err.statusCode)
			|| (err.statusCode >= 500 && err.statusCode < 600 && err.isRetryable);
	}
	return err instanceof AbortError || (err instanceof FetchError && err.type === 'system');
}

@Injectable()
export class RemoteUserResolveService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.meta)
		private meta: MiMeta,

		private federatedInstanceService: FederatedInstanceService,

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

		const user = await this.usersRepository.findOneBy({ usernameLower, host }) as MiRemoteUser | null;

		const acctLower = `${usernameLower}@${host}`;

		if (user == null) {
			const self = await this.resolveSelf(acctLower);

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

			this.logger.succ(`return new remote user: ${chalk.magenta(acctLower)}`);
			return await this.apPersonService.createPerson(self.href);
		}

		// ユーザー情報が古い場合は、WebFingerからやりなおして返す
		if (user.lastFetchedAt == null || Date.now() - user.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24) {
			// Match delivery's explicit suspension/blocked-host checks. isNotResponding
			// alone is transient (delivery retries until auto-suspension after a week).
			const instance = await this.federatedInstanceService.fetch(host);
			if (this.utilityService.isBlockedHost(this.meta.blockedHosts, host)
				|| (instance != null && instance.suspensionState !== 'none')) {
				// No fetch attempt: preserve lastFetchedAt so unsuspending can refresh immediately.
				this.logger.info(`return existing remote user from stopped host: ${acctLower}`);
				return user;
			}

			// 繋がらないインスタンスに何回も試行するのを防ぐ, 後続の同様処理の連続試行を防ぐ ため 試行前にも更新する
			await this.usersRepository.update(user.id, {
				lastFetchedAt: new Date(),
			});

			this.logger.info(`try resync: ${acctLower}`);
			let self: ILink;
			try {
				self = await this.resolveSelf(acctLower);
			} catch (err) {
				// resolveSelf preserves the original HTTP/transport error as its cause.
				if (!(err instanceof Error) || !isCommunicationError(err.cause)) throw err;
				this.logger.warn(`return existing remote user after failed WebFinger: ${acctLower}`, { err });
				return user;
			}

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
				});
			} else {
				this.logger.info(`uri is fine: ${acctLower}`);
			}

			try {
				await this.apPersonService.updatePerson(self.href);
			} catch (err) {
				if (!isCommunicationError(err)) throw err;
				this.logger.warn(`return existing remote user after failed Actor fetch: ${acctLower}`, { err });
				return user;
			}

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
	private async resolveSelf(acctLower: string): Promise<ILink> {
		this.logger.info(`WebFinger for ${chalk.yellow(acctLower)}`);
		const finger = await this.webfingerService.webfinger(acctLower).catch(err => {
			this.logger.error(`Failed to WebFinger for ${chalk.yellow(acctLower)}: ${ err.statusCode ?? err.message }`);
			throw new Error(`Failed to WebFinger for ${acctLower}: ${ err.statusCode ?? err.message }`, { cause: err });
		});
		const self = finger.links.find(link => link.rel != null && link.rel.toLowerCase() === 'self');
		if (!self) {
			this.logger.error(`Failed to WebFinger for ${chalk.yellow(acctLower)}: self link not found`);
			throw new Error('self link not found');
		}
		return self;
	}
}
