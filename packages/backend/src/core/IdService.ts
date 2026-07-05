/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class IdService implements OnModuleInit {
	private method: string;
	private safeTFn: (t: number) => boolean;
	private genFn: (time: number) => string;
	private parseFn: (id: string) => { date: Date; };
	private parseFullFn: (id: string) => { date: number; additional: bigint; };

	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
		this.method = this.config.id.toLowerCase();
	}

	async onModuleInit() {
		switch (this.method) {
			case 'aid': {
				const aidModule = await import('@/misc/id/aid.js');
				this.safeTFn = aidModule.isSafeAidT;
				this.genFn = aidModule.genAid;
				this.parseFn = aidModule.parseAid;
				this.parseFullFn = aidModule.parseAidFull;
				break;
			}
			case 'aidx': {
				const aidxModule = await import('@/misc/id/aidx.js');
				this.safeTFn = aidxModule.isSafeAidxT;
				this.genFn = aidxModule.genAidx;
				this.parseFn = aidxModule.parseAidx;
				this.parseFullFn = aidxModule.parseAidxFull;
				break;
			}
			case 'meid': {
				const meidModule = await import('@/misc/id/meid.js');
				this.safeTFn = meidModule.isSafeMeidT;
				this.genFn = meidModule.genMeid;
				this.parseFn = meidModule.parseMeid;
				this.parseFullFn = meidModule.parseMeidFull;
				break;
			}
			case 'meidg': {
				const meidgModule = await import('@/misc/id/meidg.js');
				this.safeTFn = meidgModule.isSafeMeidgT;
				this.genFn = meidgModule.genMeidg;
				this.parseFn = meidgModule.parseMeidg;
				this.parseFullFn = meidgModule.parseMeidgFull;
				break;
			}
			case 'ulid': {
				const ulidModule = await import('@/misc/id/ulid.js');
				const { ulid: genUlid } = await import('ulid');
				this.safeTFn = (t) => t > 0;
				this.genFn = (time) => genUlid(time);
				this.parseFn = ulidModule.parseUlid;
				this.parseFullFn = ulidModule.parseUlidFull;
				break;
			}
			case 'objectid': {
				const objectIdModule = await import('@/misc/id/object-id.js');
				this.safeTFn = objectIdModule.isSafeObjectIdT;
				this.genFn = objectIdModule.genObjectId;
				this.parseFn = objectIdModule.parseObjectId;
				this.parseFullFn = objectIdModule.parseObjectIdFull;
				break;
			}
			default: throw new Error('unrecognized id generation method');
		}
	}

	@bindThis
	public isSafeT(t: number): boolean {
		return this.safeTFn(t);
	}

	/**
	 * 時間を元にIDを生成します(省略時は現在日時)
	 * @param time 日時
	 */
	@bindThis
	public gen(time?: number): string {
		const t = (!time || (time > Date.now())) ? Date.now() : time;
		return this.genFn(t);
	}

	@bindThis
	public parse(id: string): { date: Date; } {
		return this.parseFn(id);
	}

	// Note: additional is at most 64 bits
	@bindThis
	public parseFull(id: string): { date: number; additional: bigint; } {
		return this.parseFullFn(id);
	}
}
