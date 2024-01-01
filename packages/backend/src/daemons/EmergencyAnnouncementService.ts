/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { MetaService } from '@/core/MetaService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { AnnouncementService } from '@/core/AnnouncementService.js';
import type { AnnouncementsRepository } from '@/models/_.js';
import type { OnApplicationShutdown } from '@nestjs/common';

const interval = 5000;

@Injectable()
export class EmergencyAnnouncementService implements OnApplicationShutdown {
	private intervalId: NodeJS.Timeout | null = null;

	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		private metaService: MetaService,
		private httpRequestService: HttpRequestService,
		private announcementService: AnnouncementService,
	) {
	}

	/**
	 * Check emergemncy information from external provider.
	 */
	@bindThis
	public async start(): Promise<void> {
		const checkExisingEmergencyAnnouncement = async (): Promise<boolean> => {
			const announcements = await this.announcementsRepository.findBy({
				display: 'emergency',
				isActive: true,
			});

			return announcements.length > 0;
		};

		const tick = async () => {
			const meta = await this.metaService.fetch(true);

			if (!meta.enableEmergencyAnnouncementIntegration || meta.emergencyAnnouncementIntegrationConfig.type === 'none') return;

			const hasExistingEmergencyAnnouncement = await checkExisingEmergencyAnnouncement();

			switch (meta.emergencyAnnouncementIntegrationConfig.type) {
				// P2P地震情報（日本、津波）
				case 'p2pquake': {
					// 津波情報のみ取得
					const res = await this.httpRequestService.getJson<Record<string, any>[]>('https://api.p2pquake.net/v2/history?codes=552');
					if (res.some((v) => v.cancelled === false) && !hasExistingEmergencyAnnouncement) {
						// 1件でも発令中があれば ＆ 既存の緊急情報が出ていなければ作成
						await this.announcementService.create({
							title: '__PROVIDER_p2pquake__',
							text: '',
							icon: 'warning',
							display: 'emergency',
							needConfirmationToRead: true,
						});
					} else if (res.every((v) => v.cancelled) && hasExistingEmergencyAnnouncement) {
						// 全て解除されている ＆ 既存の緊急情報が出ていれば削除
						await this.announcementsRepository.update({
							title: '__PROVIDER_p2pquake__',
							display: 'emergency',
							isActive: true,
						}, {
							isActive: false,
						});
					}
					break;
				}
			}
		};

		tick();

		this.intervalId = setInterval(tick, interval);
	}

	@bindThis
	public dispose(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
		}
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
