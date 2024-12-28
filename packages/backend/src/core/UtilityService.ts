/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import punycode from 'punycode.js';
import RE2 from 're2';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class UtilityService {
	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
	}

	@bindThis
	public getFullApAccount(username: string, host: string | null): string {
		return host ? `${username}@${this.normalizeHost(host)}` : `${username}@${this.normalizeHost(this.config.host)}`;
	}

	@bindThis
	public isSelfHost(host: string | null): boolean {
		if (host == null) return true;
		return this.normalizeHost(this.config.host) === this.normalizeHost(host);
	}

	@bindThis
	public isUriLocal(uri: string): boolean {
		return this.normalizeHost(this.config.hostname) === this.extractHost(uri);
	}

	@bindThis
	public isItemListedIn(item: string | null, list: string[] | undefined): boolean {
		if (!list || !item) return false;
		list = list.map(x => '.' + this.normalizeHost(x).split(':')[0]);
		item = '.' + this.normalizeHost(item).split(':')[0];
		return list.some(x => item.endsWith(x));
	}

	@bindThis
	public concatNoteContentsForKeyWordCheck(content: {
		cw?: string | null;
		text?: string | null;
		pollChoices?: string[] | null;
		others?: string[] | null;
	}): string {
		/**
		 * ノートの内容を結合してキーワードチェック用の文字列を生成する
		 * cwとtextは内容が繋がっているかもしれないので間に何も入れずにチェックする
		 */
		return `${content.cw ?? ''}${content.text ?? ''}\n${(content.pollChoices ?? []).join('\n')}\n${(content.others ?? []).join('\n')}`;
	}

	private static readonly isFilterRegExpPattern = /^\/(.+)\/(.*)$/;

	@bindThis
	public isKeyWordIncluded(text: string, keyWords: string[]): boolean {
		if (keyWords.length === 0) return false;
		if (text === '') return false;

		return keyWords.some(filter => {
			const regexp = UtilityService.isFilterRegExpPattern.exec(filter);

			if (!regexp) {
				const words = filter.split(' ');
				return words.every(keyword => text.includes(keyword));
			}

			try {
				// TODO: RE2インスタンスをキャッシュ
				return new RE2(regexp[1], regexp[2]).test(text);
			} catch (err) {
				// This should never happen due to input sanitization.
				return false;
			}
		});
	}

	@bindThis
	public normalizeHost(host: string): string {
		return punycode.toASCII(host.toLowerCase());
	}

	@bindThis
	public extractHost(uri: string): string {
		// ASCII String で返されるので punycode 化はいらない
		// ref: https://url.spec.whatwg.org/#host-serializing
		return new URL(uri).host;
	}
}
