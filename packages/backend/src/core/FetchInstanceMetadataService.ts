/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import tinycolor from 'tinycolor2';
import * as Redis from 'ioredis';
import type { MiInstance } from '@/models/Instance.js';
import type Logger from '@/logger.js';
import { DI } from '@/di-symbols.js';
import { LoggerService } from '@/core/LoggerService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { bindThis } from '@/decorators.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import type { DOMWindow } from 'jsdom';

type NodeInfo = {
	openRegistrations?: unknown;
	software?: {
		name?: unknown;
		version?: unknown;
	};
	metadata?: {
		name?: unknown;
		nodeName?: unknown;
		nodeDescription?: unknown;
		description?: unknown;
		maintainer?: {
			name?: unknown;
			email?: unknown;
		};
		themeColor?: unknown;
	};
};

@Injectable()
export class FetchInstanceMetadataService {
	private logger: Logger;

	constructor(
		private httpRequestService: HttpRequestService,
		private loggerService: LoggerService,
		private federatedInstanceService: FederatedInstanceService,
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
	) {
		this.logger = this.loggerService.getLogger('metadata', 'cyan');
	}

	@bindThis
	public async tryLock(host: string): Promise<boolean> {
		const mutex = await this.redisClient.set(`fetchInstanceMetadata:mutex:${host}`, '1', 'GET');
		return mutex !== '1';
	}

	@bindThis
	public unlock(host: string): Promise<'OK'> {
		return this.redisClient.set(`fetchInstanceMetadata:mutex:${host}`, '0');
	}

	@bindThis
	public async fetchInstanceMetadata(instance: MiInstance, force = false): Promise<void> {
		const host = instance.host;
		// Acquire mutex to ensure no parallel runs
		if (!await this.tryLock(host)) return;
		try {
			if (!force) {
				const _instance = await this.federatedInstanceService.fetch(host);
				const now = Date.now();
				if (_instance && _instance.infoUpdatedAt && (now - _instance.infoUpdatedAt.getTime() < 1000 * 60 * 60 * 24)) {
					// unlock at the finally caluse
					return;
				}
			}

			this.logger.info(`Fetching metadata of ${instance.host} ...`);

			const [info, dom, manifest] = await Promise.all([
				this.fetchNodeinfo(instance).catch(() => null),
				this.fetchDom(instance).catch(() => null),
				this.fetchManifest(instance).catch(() => null),
			]);

			const [favicon, icon, themeColor, name, description] = await Promise.all([
				this.fetchFaviconUrl(instance, dom).catch(() => null),
				this.fetchIconUrl(instance, dom, manifest).catch(() => null),
				this.getThemeColor(info, dom, manifest).catch(() => null),
				this.getSiteName(info, dom, manifest).catch(() => null),
				this.getDescription(info, dom, manifest).catch(() => null),
			]);

			this.logger.succ(`Successfuly fetched metadata of ${instance.host}`);

			const updates = {
				infoUpdatedAt: new Date(),
			} as Record<string, any>;

			if (info) {
				updates.softwareName = typeof info.software?.name === 'string' ? info.software.name.toLowerCase() : '?';
				updates.softwareVersion = info.software?.version;
				updates.openRegistrations = info.openRegistrations;
				updates.maintainerName = info.metadata ? info.metadata.maintainer ? (info.metadata.maintainer.name ?? null) : null : null;
				updates.maintainerEmail = info.metadata ? info.metadata.maintainer ? (info.metadata.maintainer.email ?? null) : null : null;
			}

			if (name) updates.name = name;
			if (description) updates.description = description;
			if (icon ?? favicon) updates.iconUrl = (icon && !icon.includes('data:image/png;base64')) ? icon : favicon;
			if (favicon) updates.faviconUrl = favicon;
			if (themeColor) updates.themeColor = themeColor;

			await this.federatedInstanceService.update(instance.id, updates);

			this.logger.succ(`Successfuly updated metadata of ${instance.host}`);
		} catch (e) {
			this.logger.error(`Failed to update metadata of ${instance.host}: ${e}`);
		} finally {
			await this.unlock(host);
		}
	}

	@bindThis
	private async fetchNodeinfo(instance: MiInstance): Promise<NodeInfo> {
		this.logger.info(`Fetching nodeinfo of ${instance.host} ...`);

		try {
			const wellknown = await this.httpRequestService.getJson('https://' + instance.host + '/.well-known/nodeinfo')
				.catch(err => {
					if (err.statusCode === 404) {
						throw new Error('No nodeinfo provided');
					} else {
						throw err.statusCode ?? err.message;
					}
				}) as Record<string, unknown>;

			if (wellknown.links == null || !Array.isArray(wellknown.links)) {
				throw new Error('No wellknown links');
			}

			const links = wellknown.links as any[];

			const link1_0 = links.find(link => link.rel === 'http://nodeinfo.diaspora.software/ns/schema/1.0');
			const link2_0 = links.find(link => link.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.0');
			const link2_1 = links.find(link => link.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.1');
			const link = link2_1 ?? link2_0 ?? link1_0;

			if (link == null) {
				throw new Error('No nodeinfo link provided');
			}

			const info = await this.httpRequestService.getJson(link.href)
				.catch(err => {
					throw err.statusCode ?? err.message;
				});

			this.logger.succ(`Successfuly fetched nodeinfo of ${instance.host}`);

			return info as NodeInfo;
		} catch (err) {
			this.logger.error(`Failed to fetch nodeinfo of ${instance.host}: ${err}`);

			throw err;
		}
	}

	@bindThis
	private async fetchDom(instance: MiInstance): Promise<DOMWindow['document']> {
		this.logger.info(`Fetching HTML of ${instance.host} ...`);

		const url = 'https://' + instance.host;

		const html = await this.httpRequestService.getHtml(url);

		const { window } = new JSDOM(html);
		const doc = window.document;

		return doc;
	}

	@bindThis
	private async fetchManifest(instance: MiInstance): Promise<Record<string, unknown> | null> {
		const url = 'https://' + instance.host;

		const manifestUrl = url + '/manifest.json';

		const manifest = await this.httpRequestService.getJson(manifestUrl) as Record<string, unknown>;

		return manifest;
	}

	@bindThis
	private async fetchFaviconUrl(instance: MiInstance, doc: DOMWindow['document'] | null): Promise<string | null> {
		const url = 'https://' + instance.host;

		if (doc) {
			// https://github.com/misskey-dev/misskey/pull/8220#issuecomment-1025104043
			const href = Array.from(doc.getElementsByTagName('link')).reverse().find(link => link.relList.contains('icon'))?.href;

			if (href) {
				return (new URL(href, url)).href;
			}
		}

		const faviconUrl = url + '/favicon.ico';

		const favicon = await this.httpRequestService.send(faviconUrl, {
			method: 'HEAD',
		}, { throwErrorWhenResponseNotOk: false });

		if (favicon.ok) {
			return faviconUrl;
		}

		return null;
	}

	@bindThis
	private async fetchIconUrl(instance: MiInstance, doc: DOMWindow['document'] | null, manifest: Record<string, any> | null): Promise<string | null> {
		if (manifest && manifest.icons && manifest.icons.length > 0 && manifest.icons[0].src) {
			const url = 'https://' + instance.host;
			return (new URL(manifest.icons[0].src, url)).href;
		}

		if (doc) {
			const url = 'https://' + instance.host;

			// https://github.com/misskey-dev/misskey/pull/8220#issuecomment-1025104043
			const links = Array.from(doc.getElementsByTagName('link')).reverse();
			// https://github.com/misskey-dev/misskey/pull/8220/files/0ec4eba22a914e31b86874f12448f88b3e58dd5a#r796487559
			const href =
				[
					links.find(link => link.relList.contains('apple-touch-icon-precomposed'))?.href,
					links.find(link => link.relList.contains('apple-touch-icon'))?.href,
					links.find(link => link.relList.contains('icon'))?.href,
				]
					.find(href => href);

			if (href) {
				return (new URL(href, url)).href;
			}
		}

		return null;
	}

	@bindThis
	private async getThemeColor(info: NodeInfo | null, doc: DOMWindow['document'] | null, manifest: Record<string, any> | null): Promise<string | null> {
		const themeColor = info?.metadata?.themeColor ?? doc?.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? manifest?.theme_color;

		if (themeColor) {
			const color = new tinycolor(themeColor);
			if (color.isValid()) return color.toHexString();
		}

		return null;
	}

	@bindThis
	private async getSiteName(info: NodeInfo | null, doc: DOMWindow['document'] | null, manifest: Record<string, any> | null): Promise<string | null> {
		if (info && info.metadata) {
			if (typeof info.metadata.nodeName === 'string') {
				return info.metadata.nodeName;
			} else if (typeof info.metadata.name === 'string') {
				return info.metadata.name;
			}
		}

		if (doc) {
			const og = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');

			if (og) {
				return og;
			}
		}

		if (manifest) {
			return manifest.name ?? manifest.short_name;
		}

		return null;
	}

	@bindThis
	private async getDescription(info: NodeInfo | null, doc: DOMWindow['document'] | null, manifest: Record<string, any> | null): Promise<string | null> {
		if (info && info.metadata) {
			if (typeof info.metadata.nodeDescription === 'string') {
				return info.metadata.nodeDescription;
			} else if (typeof info.metadata.description === 'string') {
				return info.metadata.description;
			}
		}

		if (doc) {
			const meta = doc.querySelector('meta[name="description"]')?.getAttribute('content');
			if (meta) {
				return meta;
			}

			const og = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
			if (og) {
				return og;
			}
		}

		if (manifest) {
			return manifest.name ?? manifest.short_name;
		}

		return null;
	}
}
