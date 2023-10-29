/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { toASCII } from 'punycode';
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
		return host ? `${username}@${this.toPuny(host)}` : `${username}@${this.toPuny(this.config.host)}`;
	}

	@bindThis
	public isSelfHost(host: string | null): boolean {
		if (host == null) return true;
		return this.toPuny(this.config.host) === this.toPuny(host);
	}

	@bindThis
	public isBlockedHost(blockedHosts: string[], host: string | null): boolean {
		if (host == null) return false;
		return blockedHosts.some(x => `.${host.toLowerCase()}`.endsWith(`.${x}`));
	}

	@bindThis
	public isSilencedHost(silencedHosts: string[] | undefined, host: string | null): boolean {
		if (!silencedHosts || host == null) return false;
		return silencedHosts.some(x => `.${host.toLowerCase()}`.endsWith(`.${x}`));
	}

	@bindThis
	public extractDbHost(uri: string): string {
		const url = new URL(uri);
		return this.toPuny(url.hostname);
	}

	@bindThis
	public toPuny(host: string): string {
		return toASCII(host.toLowerCase());
	}

	@bindThis
	public toPunyNullable(host: string | null | undefined): string | null {
		if (host == null) return null;
		return toASCII(host.toLowerCase());
	}
}
