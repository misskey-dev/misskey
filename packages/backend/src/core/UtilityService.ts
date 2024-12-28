/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { isIP } from 'node:net';
import punycode from 'punycode.js';
import psl from 'psl';
import RE2 from 're2';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import type { IObject } from '@/core/activitypub/type.js';

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

	@bindThis
	public isRelatedHosts(hostA: string, hostB: string): boolean {
		// hostA と hostB は呼び出す側で正規化済みであることを前提とする

		// ポート番号が付いている可能性がある場合、ポート番号を除去するためにもう一度正規化
		if (hostA.includes(':')) hostA = new URL(`urn://${hostA}`).hostname;
		if (hostB.includes(':')) hostB = new URL(`urn://${hostB}`).hostname;

		// ホストが完全一致している場合は true
		if (hostA === hostB) {
			return true;
		}

		// -----------------------------
		// 1. IPアドレスの場合の処理
		// -----------------------------
		const aIpVersion = isIP(hostA);
		const bIpVersion = isIP(hostB);
		if (aIpVersion !== 0 || bIpVersion !== 0) {
			// どちらかが IP の場合、完全一致以外は false
			return false;
		}

		// -----------------------------
		// 2. ホストの場合の処理
		// -----------------------------
		const parsedA = psl.parse(hostA);
		const parsedB = psl.parse(hostB);

		// どちらか一方でもパース失敗 or eTLD+1が異なる場合は false
		if (parsedA.error || parsedB.error || parsedA.domain !== parsedB.domain) {
			return false;
		}

		// -----------------------------
		// 3. サブドメインの比較
		// -----------------------------
		// サブドメイン部分が後方一致で階層差が1以内かどうかを判定する。
		// 完全一致だと既に true で返しているので、ここでは完全一致以外の場合のみの判定
		// 例:
		//  subA = "www",         subB = ""          => true  (1階層差)
		//  subA = "alice.users", subB = "users"     => true  (1階層差)
		//  subA = "alice.users", subB = "bob.users" => true  (1階層差)
		//  subA = "alice.users", subB = ""          => false (2階層差)

		const labelsA = parsedA.subdomain?.split('.') ?? [];
		const levelsA = labelsA.length;
		const labelsB = parsedB.subdomain?.split('.') ?? [];
		const levelsB = labelsB.length;

		// 後ろ(右)から一致している部分をカウント
		let i = 0;
		while (
			i < levelsA &&
			i < levelsB &&
			labelsA[levelsA - 1 - i] === labelsB[levelsB - 1 - i]
			) {
			i++;
		}

		// 後方一致していないラベルの数 = (総数 - 一致数)
		const unmatchedA = levelsA - i;
		const unmatchedB = levelsB - i;

		// 不一致ラベルが1階層以内なら true
		return Math.max(unmatchedA, unmatchedB) <= 1;
	}

	@bindThis
	public isRelatedUris(uriA: string, uriB: string): boolean {
		// URI が完全一致している場合は true
		if (uriA === uriB) {
			return true;
		}

		const hostA = this.extractHost(uriA);
		const hostB = this.extractHost(uriB);

		return this.isRelatedHosts(hostA, hostB);
	}

	@bindThis
	public assertActivityRelatedToUrl(activity: IObject, url: string): void {
		if (activity.id && this.isRelatedUris(activity.id, url)) return;

		if (activity.url) {
			if (!Array.isArray(activity.url)) {
				if (typeof(activity.url) === 'string' && this.isRelatedUris(activity.url, url)) return;
				if (typeof(activity.url) === 'object' && activity.url.href && this.isRelatedUris(activity.url.href, url)) return;
			} else {
				if (activity.url.some(x => typeof(x) === 'string' && this.isRelatedUris(x, url))) return;
				if (activity.url.some(x => typeof(x) === 'object' && x.href && this.isRelatedUris(x.href, url))) return;
			}
		}

		throw new Error(`Invalid object: neither id(${activity.id}) nor url(${activity.url}) related to ${url}`);
	}
}
