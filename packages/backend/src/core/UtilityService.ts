import { URL } from 'node:url';
import { toASCII } from 'punycode';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';

@Injectable()
export class UtilityService {
	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
	}

	public getFullApAccount(username: string, host: string | null): string {
		return host ? `${username}@${this.toPuny(host)}` : `${username}@${this.toPuny(this.config.host)}`;
	}

	public isSelfHost(host: string | null): boolean {
		if (host == null) return true;
		return this.toPuny(this.config.host) === this.toPuny(host);
	}

	public extractDbHost(uri: string): string {
		const url = new URL(uri);
		return this.toPuny(url.hostname);
	}

	public toPuny(host: string): string {
		return toASCII(host.toLowerCase());
	}

	public toPunyNullable(host: string | null | undefined): string | null {
		if (host == null) return null;
		return toASCII(host.toLowerCase());
	}
}
