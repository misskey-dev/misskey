/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import type { AnalyticsInstance, AnalyticsPlugin } from 'analytics';

/**
 * analytics moduleを読み込まなくても動作するようにするためのラッパー
 */
class AnalyticsProxy implements AnalyticsInstance {
	private analytics?: AnalyticsInstance;

	constructor(analytics?: AnalyticsInstance) {
		if (analytics) {
			this.analytics = analytics;
		}
	}

	public setAnalytics(analytics: AnalyticsInstance) {
		if (this.analytics) {
			throw new Error('Analytics instance already exists.');
		}
		this.analytics = analytics;
	}

	public identify(...args: Parameters<AnalyticsInstance['identify']>) {
		return this.analytics?.identify(...args) ?? Promise.resolve();
	}

	public track(...args: Parameters<AnalyticsInstance['track']>) {
		return this.analytics?.track(...args) ?? Promise.resolve();
	}

	public page(...args: Parameters<AnalyticsInstance['page']>) {
		return this.analytics?.page(...args) ?? Promise.resolve();
	}

	public user(...args: Parameters<AnalyticsInstance['user']>) {
		return this.analytics?.user(...args) ?? Promise.resolve();
	}

	public reset(...args: Parameters<AnalyticsInstance['reset']>) {
		return this.analytics?.reset(...args) ?? Promise.resolve();
	}

	public ready(...args: Parameters<AnalyticsInstance['ready']>) {
		return this.analytics?.ready(...args) ?? function () { void 0; };
	}

	public on(...args: Parameters<AnalyticsInstance['on']>) {
		return this.analytics?.on(...args) ?? function () { void 0; };
	}

	public once(...args: Parameters<AnalyticsInstance['once']>) {
		return this.analytics?.once(...args) ?? function () { void 0; };
	}

	public getState(...args: Parameters<AnalyticsInstance['getState']>) {
		return this.analytics?.getState(...args) ?? Promise.resolve();
	}

	public get storage() {
		return this.analytics?.storage ?? {
			getItem: () => null,
			setItem: () => void 0,
			removeItem: () => void 0,
		};
	}

	public get plugins() {
		return this.analytics?.plugins ?? {
			enable: (p, c) => Promise.resolve(c ? c() : void 0),
			disable: (p, c) => Promise.resolve(c ? c() : void 0),
		};
	}
}

export const analytics = new AnalyticsProxy();

export async function initAnalytics(instance: Misskey.entities.MetaDetailed) {
	// アナリティクスプロバイダに関する設定がひとつもない場合は、アナリティクスモジュールを読み込まない
	if (!instance.googleAnalyticsMeasurementId) {
		return;
	}

	const { default: Analytics } = await import('analytics');
	const plugins: AnalyticsPlugin[] = [];

	// Google Analytics
	if (instance.googleAnalyticsMeasurementId) {
		//@ts-expect-error Dynamic import
		const { default: googleAnalytics } = await import('@analytics/google-analytics');

		plugins.push(googleAnalytics({
			measurementIds: [instance.googleAnalyticsMeasurementId],
			debug: _DEV_,
		}));
	}

	analytics.setAnalytics(Analytics({
		app: 'misskey',
		version: _VERSION_,
		debug: _DEV_,
		plugins,
	}));
}
