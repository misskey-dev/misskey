/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Hono } from 'hono';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiMeta, UsersRepository } from '@/models/_.js';
import type { Config } from '@/config.js';
import { escapeAttribute, escapeValue } from '@/misc/prelude/xml.js';
import { vary } from '@/misc/hono-vary.js';
import type { MiUser } from '@/models/User.js';
import * as Acct from '@/misc/acct.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { NodeinfoServerService } from './NodeinfoServerService.js';
import { OAuth2ProviderService } from './oauth/OAuth2ProviderService.js';
import type { FindOptionsWhere } from 'typeorm';

@Injectable()
export class WellKnownServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private nodeinfoServerService: NodeinfoServerService,
		private userEntityService: UserEntityService,
		private oauth2ProviderService: OAuth2ProviderService,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	public createServer(): Hono {
		const XRD = (...x: { element: string, value?: string, attributes?: Record<string, string> }[]) =>
			`<?xml version="1.0" encoding="UTF-8"?><XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">${x.map(({ element, value, attributes }) =>
				`<${
					Object.entries(typeof attributes === 'object' && attributes || {}).reduce((a, [k, v]) => `${a} ${k}="${escapeAttribute(v)}"`, element)
				}${
					typeof value === 'string' ? `>${escapeValue(value)}</${element}` : '/'
				}>`).reduce((a, c) => a + c, '')}</XRD>`;

		const webFingerPath = '/.well-known/webfinger';
		const jrd = 'application/jrd+json';
		const xrd = 'application/xrd+xml';
		const hono = new Hono();

		hono.use('/.well-known/*', async (ctx, next) => {
			ctx.header('Access-Control-Allow-Headers', 'Accept');
			ctx.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
			ctx.header('Access-Control-Allow-Origin', '*');
			ctx.header('Access-Control-Expose-Headers', 'Vary');
			await next();
		});

		hono.options('/.well-known/*', (ctx) => ctx.body(null, 204));

		hono.get('/.well-known/host-meta', async (ctx) => {
			if (this.meta.federation === 'none') {
				return ctx.body(null, 403);
			}

			ctx.header('Content-Type', xrd);
			return ctx.body(XRD({ element: 'Link', attributes: {
				rel: 'lrdd',
				type: xrd,
				template: `${this.config.url}${webFingerPath}?resource={uri}`,
			} }));
		});

		hono.get('/.well-known/host-meta.json', async (ctx) => {
			if (this.meta.federation === 'none') {
				return ctx.body(null, 403);
			}

			ctx.header('Content-Type', 'application/json');
			return ctx.json({
				links: [{
					rel: 'lrdd',
					type: jrd,
					template: `${this.config.url}${webFingerPath}?resource={uri}`,
				}],
			});
		});

		hono.get('/.well-known/nodeinfo', async (ctx) => {
			if (this.meta.federation === 'none') {
				return ctx.body(null, 403);
			}

			return ctx.json({ links: this.nodeinfoServerService.getLinks() });
		});

		hono.get('/.well-known/oauth-authorization-server', async (ctx) => {
			return ctx.json(this.oauth2ProviderService.generateRFC8414());
		});

		/* TODO
hono.get('/.well-known/change-password', async (ctx) => {
});
*/

		hono.get(webFingerPath, async (ctx) => {
			if (this.meta.federation === 'none') {
				return ctx.body(null, 403);
			}

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
					usernameLower: acct.username.toLowerCase(),
					host: IsNull(),
					isSuspended: false,
				} : 422;

			const resource = ctx.req.query('resource');
			if (resource == null) {
				return ctx.body(null, 400);
			}

			const query = generateQuery(resource.toLowerCase());

			if (typeof query === 'number') {
				ctx.status(422);
				return ctx.body(null);
			}

			const user = await this.usersRepository.findOneBy(query);

			if (user == null) {
				return ctx.body(null, 404);
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

			vary(ctx, 'Accept');
			ctx.header('Cache-Control', 'public, max-age=180');

			const accepted = ctx.req.header('accept') ?? '';
			if (accepted.includes(xrd)) {
				ctx.header('Content-Type', xrd);
				return ctx.body(XRD(
					{ element: 'Subject', value: subject },
					{ element: 'Link', attributes: self },
					{ element: 'Link', attributes: profilePage },
					{ element: 'Link', attributes: subscribe }));
			} else {
				ctx.header('Content-Type', jrd);
				return ctx.json({
					subject,
					links: [self, profilePage, subscribe],
				});
			}
		});

		return hono;
	}
}
