/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';

@Injectable()
export class VkemoRelayTimelineService {
	instanceHosts: Set<string>;

	constructor() {
		// TODO: fetch instance list from https://relay.virtualkemomimi.net/api/servers
		this.instanceHosts = new Set<string>([
			'buicha.social',
			'misskey.niri.la',
			'metaskey.net',
			'virtualkemomimi.net',
			'kawaiivrc.site',
			'misskey.pm',
			'vrc-ins.net',
			'misskey.shunrin.com',
			'vrcjp.hostdon.ne.jp',
			'key.hinasense.jp',
			'mi.harumakizaemon.net',
			'misskey.emymin.net',
			'msky.summersweet.jp',
			'misskey.nokotaro.com',
			'mewl.me',
			'mstdn.virtecam.net',
			'inokashiraskey.jp',
			'misskey.kakunpc.com',
			'misskey.invr.chat',
			'superneko.net',
			'misskey.syuuta.net',
			'mi.nyaa.app',
			'nep.one',
			'meron.cloud',
			'misskey.tsukiyo.dev',
			'mi-x500.i-0.io',
			'misskey.yukkukomei.com',
			'itsukey.net',
			'misskey.narazaka.net',
			'misskey.meglia.dev',
			'misskey.makihiro.info',
			'misskey.ayatovr.dev',
			'atsuchan.page',
			'mochitter.net',
		]);
	}

	@bindThis
	isRelayedInstance(host: string | null): boolean {
		// assuming the current instance is joined to the i relay
		if (host == null) return true;
		return this.instanceHosts.has(host);
	}
}
