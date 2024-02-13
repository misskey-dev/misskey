/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import vary from 'vary';
import fastifyAccepts from '@fastify/accepts';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';
import type { Config } from '@/config.js';
import { escapeAttribute, escapeValue } from '@/misc/prelude/xml.js';
import type { MiUser } from '@/models/User.js';
import * as Acct from '@/misc/acct.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { NodeinfoServerService } from './NodeinfoServerService.js';
import { OAuth2ProviderService } from './oauth/OAuth2ProviderService.js';
import type { FindOptionsWhere } from 'typeorm';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

@Injectable()
export class WellKnownServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private nodeinfoServerService: NodeinfoServerService,
		private userEntityService: UserEntityService,
		private oauth2ProviderService: OAuth2ProviderService,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		const XRD = (...x: { element: string, value?: string, attributes?: Record<string, string> }[]) =>
			`<?xml version="1.0" encoding="UTF-8"?><XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">${x.map(({ element, value, attributes }) =>
				`<${
					Object.entries(typeof attributes === 'object' && attributes || {}).reduce((a, [k, v]) => `${a} ${k}="${escapeAttribute(v)}"`, element)
				}${
					typeof value === 'string' ? `>${escapeValue(value)}</${element}` : '/'
				}>`).reduce((a, c) => a + c, '')}</XRD>`;

		const allPath = '/.well-known/*';
		const webFingerPath = '/.well-known/webfinger';
		const jrd = 'application/jrd+json';
		const xrd = 'application/xrd+xml';

		fastify.register(fastifyAccepts);

		fastify.addHook('onRequest', (request, reply, done) => {
			reply.header('Access-Control-Allow-Headers', 'Accept');
			reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
			reply.header('Access-Control-Allow-Origin', '*');
			reply.header('Access-Control-Expose-Headers', 'Vary');
			done();
		});

		fastify.options(allPath, async (request, reply) => {
			reply.code(204);
		});

		fastify.get('/.well-known/host-meta', async (request, reply) => {
			reply.header('Content-Type', xrd);
			return XRD({ element: 'Link', attributes: {
				rel: 'lrdd',
				type: xrd,
				template: `${this.config.url}${webFingerPath}?resource={uri}`,
			} });
		});

		fastify.get('/.well-known/host-meta.json', async (request, reply) => {
			reply.header('Content-Type', 'application/json');
			return {
				links: [{
					rel: 'lrdd',
					type: jrd,
					template: `${this.config.url}${webFingerPath}?resource={uri}`,
				}],
			};
		});

		fastify.get('/.well-known/nodeinfo', async (request, reply) => {
			return { links: this.nodeinfoServerService.getLinks() };
		});

		fastify.get('/.well-known/oauth-authorization-server', async () => {
			return this.oauth2ProviderService.generateRFC8414();
		});

		/* TODO
fastify.get('/.well-known/change-password', async (request, reply) => {
});
*/

		fastify.get<{ Querystring: { resource: string } }>(webFingerPath, async (request, reply) => {
			const fromId = (id: MiUser['id']): FindOptionsWhere<MiUser> => ({
				id,
				host: IsNull(),
				isSuspended: false,
			});

			const generateQuery = (resource: string): FindOptionsWhere<MiUser> | number =>
				resource.startsWith(`${this.config.url.toLowerCase()}/users/`) ?
					fromId(resource.split('/').pop()!) :
					fromAcct(Acct.parse(
						resource.startsWith(`${this.config.url.toLowerCase()}/@`) ? resource.split('/').pop()! :
						resource.startsWith('acct:') ? resource.slice('acct:'.length) :
						resource));

			const fromAcct = (acct: Acct.Acct): FindOptionsWhere<MiUser> | number =>
				!acct.host || acct.host === this.config.host.toLowerCase() ? {
					usernameLower: acct.username,
					host: IsNull(),
					isSuspended: false,
				} : 422;

			if (typeof request.query.resource !== 'string') {
				reply.code(400);
				return;
			}

			const query = generateQuery(request.query.resource.toLowerCase());

			if (typeof query === 'number') {
				reply.code(query);
				return;
			}

			const user = await this.usersRepository.findOneBy(query);

			if (user == null) {
				reply.code(404);
				return;
			}

			const subject = `acct:${user.username}@${this.config.host}`;
			const self = {
				rel: 'self',
				type: 'application/activity+json',
				href: this.userEntityService.genLocalUserUri(user.id),
			};
			const profilePage = {
				rel: 'http://webfinger.net/rel/profile-page',
				type: 'text/html',
				href: `${this.config.url}/@${user.username}`,
			};
			const subscribe = {
				rel: 'http://ostatus.org/schema/1.0/subscribe',
				template: `${this.config.url}/authorize-follow?acct={uri}`,
			};

			vary(reply.raw, 'Accept');
			reply.header('Cache-Control', 'public, max-age=180');

			if (request.accepts().type([jrd, xrd]) === xrd) {
				reply.type(xrd);
				return XRD(
					{ element: 'Subject', value: subject },
					{ element: 'Link', attributes: self },
					{ element: 'Link', attributes: profilePage },
					{ element: 'Link', attributes: subscribe });
			} else {
				reply.type(jrd);
				return {
					subject,
					links: [self, profilePage, subscribe],
				};
			}
		});

		done();
	}
}
