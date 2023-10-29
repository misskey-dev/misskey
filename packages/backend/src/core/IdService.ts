/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { genAid, parseAid } from '@/misc/id/aid.js';
import { genAidx, parseAidx } from '@/misc/id/aidx.js';
import { genMeid, parseMeid } from '@/misc/id/meid.js';
import { genMeidg, parseMeidg } from '@/misc/id/meidg.js';
import { genObjectId, parseObjectId } from '@/misc/id/object-id.js';
import { bindThis } from '@/decorators.js';
import { parseUlid } from '@/misc/id/ulid.js';

@Injectable()
export class IdService {
	private method: string;

	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
		this.method = config.id.toLowerCase();
	}

	/**
	 * 時間を元にIDを生成します(省略時は現在日時)
	 * @param time 日時
	 */
	@bindThis
	public gen(time?: number): string {
		const t = (!time || (time > Date.now())) ? Date.now() : time;

		switch (this.method) {
			case 'aid': return genAid(t);
			case 'aidx': return genAidx(t);
			case 'meid': return genMeid(t);
			case 'meidg': return genMeidg(t);
			case 'ulid': return ulid(t);
			case 'objectid': return genObjectId(t);
			default: throw new Error('unrecognized id generation method');
		}
	}

	@bindThis
	public parse(id: string): { date: Date; } {
		switch (this.method) {
			case 'aid': return parseAid(id);
			case 'aidx': return parseAidx(id);
			case 'objectid': return parseObjectId(id);
			case 'meid': return parseMeid(id);
			case 'meidg': return parseMeidg(id);
			case 'ulid': return parseUlid(id);
			default: throw new Error('unrecognized id generation method');
		}
	}
}
