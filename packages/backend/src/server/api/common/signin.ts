import Koa from 'koa';

import config from '@/config/index.js';
import { ILocalUser } from '@/models/entities/user.js';
import { Signins } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { publishMainStream } from '@/services/stream.js';
import { Reader } from '@maxmind/geoip2-node';
import { readFileSync } from 'fs';

// Open maxmind database
const dbBuffer = readFileSync('../../../../assets/geoip.mmdb');
const r = Reader.openBuffer(dbBuffer);

export function signin(ctx: Koa.Context, user: ILocalUser, redirect = false): void {
	if (redirect) {
		//#region Cookie
		ctx.cookies.set('igi', user.token!, {
			path: '/',
			// SEE: https://github.com/koajs/koa/issues/974
			// When using a SSL proxy it should be configured to add the "X-Forwarded-Proto: https" header
			secure: config.url.startsWith('https'),
			httpOnly: false,
		});
		//#endregion

		ctx.redirect(config.url);
	} else {
		ctx.body = {
			id: user.id,
			i: user.token,
		};
		ctx.status = 200;
	}

	(async (): Promise<void> => {
		// Append signin history
		const record = await Signins.insert({
			id: genId(),
			createdAt: new Date(),
			userId: user.id,
			// ip: ctx.ip, // Hide for security reason
			ip: r.country(ctx.ip).country?.isoCode || 'Unknown',
			// headers: ctx.headers,
			headers: () => ('Hide for security reasons'),
			success: true,
		}).then(x => Signins.findOneByOrFail(x.identifiers[0]));

		// Publish signin event
		publishMainStream(user.id, 'signin', await Signins.pack(record));
	})();
}

// For backward compatibility
export default signin;
