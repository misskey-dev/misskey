import { Inject, Injectable } from '@nestjs/common';
import Router from '@koa/router';
import { IsNull, MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import { escapeAttribute, escapeValue } from '@/misc/prelude/xml.js';
import type { User } from '@/models/entities/User.js';
import * as Acct from '@/misc/acct.js';
import { NodeinfoServerService } from './NodeinfoServerService.js';
import type { FindOptionsWhere } from 'typeorm';

@Injectable()
export class WellKnownServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private nodeinfoServerService: NodeinfoServerService,
	) {
	}

	public createRouter() {
		const router = new Router();

		const XRD = (...x: { element: string, value?: string, attributes?: Record<string, string> }[]) =>
			`<?xml version="1.0" encoding="UTF-8"?><XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">${x.map(({ element, value, attributes }) =>
				`<${
					Object.entries(typeof attributes === 'object' && attributes || {}).reduce((a, [k, v]) => `${a} ${k}="${escapeAttribute(v)}"`, element)
				}${
					typeof value === 'string' ? `>${escapeValue(value)}</${element}` : '/'
				}>`).reduce((a, c) => a + c, '')}</XRD>`;

		const allPath = '/.well-known/(.*)';
		const webFingerPath = '/.well-known/webfinger';
		const jrd = 'application/jrd+json';
		const xrd = 'application/xrd+xml';

		router.use(allPath, async (request, reply) => {
			reply.header({
				'Access-Control-Allow-Headers': 'Accept',
				'Access-Control-Allow-Methods': 'GET, OPTIONS',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Expose-Headers': 'Vary',
			});
			await next();
		});

		router.options(allPath, async ctx => {
			reply.code(204);
		});

		fastify.get('/.well-known/host-meta', async (request, reply) => {
			reply.header('Content-Type', xrd);
			ctx.body = XRD({ element: 'Link', attributes: {
				rel: 'lrdd',
				type: xrd,
				template: `${this.config.url}${webFingerPath}?resource={uri}`,
			} });
		});

		fastify.get('/.well-known/host-meta.json', async (request, reply) => {
			reply.header('Content-Type', jrd);
			ctx.body = {
				links: [{
					rel: 'lrdd',
					type: jrd,
					template: `${this.config.url}${webFingerPath}?resource={uri}`,
				}],
			};
		});

		fastify.get('/.well-known/nodeinfo', async (request, reply) => {
			ctx.body = { links: this.nodeinfoServerService.getLinks() };
		});

		/* TODO
fastify.get('/.well-known/change-password', async (request, reply) => {
});
*/

		fastify.get(webFingerPath, async ctx => {
			const fromId = (id: User['id']): FindOptionsWhere<User> => ({
				id,
				host: IsNull(),
				isSuspended: false,
			});

			const generateQuery = (resource: string): FindOptionsWhere<User> | number =>
				resource.startsWith(`${this.config.url.toLowerCase()}/users/`) ?
					fromId(resource.split('/').pop()!) :
					fromAcct(Acct.parse(
						resource.startsWith(`${this.config.url.toLowerCase()}/@`) ? resource.split('/').pop()! :
						resource.startsWith('acct:') ? resource.slice('acct:'.length) :
						resource));

			const fromAcct = (acct: Acct.Acct): FindOptionsWhere<User> | number =>
				!acct.host || acct.host === this.config.host.toLowerCase() ? {
					usernameLower: acct.username,
					host: IsNull(),
					isSuspended: false,
				} : 422;

			if (typeof ctx.query.resource !== 'string') {
				reply.code(400);
				return;
			}

			const query = generateQuery(ctx.query.resource.toLowerCase());

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
				href: `${this.config.url}/users/${user.id}`,
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

			if (ctx.accepts(jrd, xrd) === xrd) {
				ctx.body = XRD(
					{ element: 'Subject', value: subject },
					{ element: 'Link', attributes: self },
					{ element: 'Link', attributes: profilePage },
					{ element: 'Link', attributes: subscribe });
				ctx.type = xrd;
			} else {
				ctx.body = {
					subject,
					links: [self, profilePage, subscribe],
				};
				ctx.type = jrd;
			}

			ctx.vary('Accept');
			reply.header('Cache-Control', 'public, max-age=180');
		});

		// Return 404 for other .well-known
		router.all(allPath, async ctx => {
			reply.code(404);
		});

		return router;
	}
}
