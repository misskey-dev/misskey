import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Koa from 'koa';

import { Reader } from '@maxmind/geoip2-node';
import config from '@/config/index.js';
import { ILocalUser } from '@/models/entities/user.js';
import { Signins } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { publishMainStream } from '@/services/stream.js';

// Open maxmind database
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbBuffer = readFileSync(path.join(__dirname, '../../../../assets/geoip.mmdb'));
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
		const ipGeo = r.city(ctx.ip);
		let ipLocation = 'Unknown';
		if (ipGeo.country) {
			ipLocation = ipGeo.country.names['zh-CN'] || ipGeo.country.names['en'] || ipGeo.country.isoCode;
			if (ipGeo.city) {
				ipLocation += ipGeo.city.names['zh-CN'] || ipGeo.city.names['en'];
			}
		}

		const record = await Signins.insert({
			id: genId(),
			createdAt: new Date(),
			userId: user.id,
			// ip: ctx.ip, // Hide for security reason
			ip: ipLocation,
			// headers: ctx.headers,
			headers: {
				'hidden': 'for-security-reason',
			},
			success: true,
		}).then(x => Signins.findOneByOrFail(x.identifiers[0]));

		// Publish signin event
		publishMainStream(user.id, 'signin', await Signins.pack(record));
	})();
}

// For backward compatibility
export default signin;
