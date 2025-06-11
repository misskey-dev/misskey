/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { $i } from '@/i.js';
import { instance } from '@/instance.js';
import { prefer } from '@/preferences.js';

export const basicTimelineTypes = [
	'home',
	'yami',
	'local',
	'social',
	'global',
] as const;

export type BasicTimelineType = typeof basicTimelineTypes[number];

export function isBasicTimeline(timeline: string): timeline is BasicTimelineType {
	return basicTimelineTypes.includes(timeline as BasicTimelineType);
}

export function basicTimelineIconClass(timeline: BasicTimelineType): string {
	switch (timeline) {
		case 'home':
			return 'ti ti-home';
		case 'yami':
			return 'ti ti-moon';
		case 'local':
			return 'ti ti-planet';
		case 'social':
			return 'ti ti-universe';
		case 'global':
			return 'ti ti-whirl';
	}
}

export function isAvailableBasicTimeline(timeline: BasicTimelineType | undefined | null): boolean {
	// ユーザー設定による非表示
	if (timeline === 'local' && prefer.s.hideLocalTimeLine) return false;
	if (timeline === 'social' && prefer.s.hideSocialTimeLine) return false;
	if (timeline === 'global' && prefer.s.hideGlobalTimeLine) return false;

	switch (timeline) {
		case 'home':
			return $i != null;
		case 'yami':
			return $i != null && $i.policies.yamiTlAvailable;
		case 'local':
			return ($i == null && instance.policies.ltlAvailable) || ($i != null && $i.policies.ltlAvailable);
		case 'social':
			return $i != null && $i.policies.ltlAvailable;
		case 'global':
			return ($i == null && instance.policies.gtlAvailable) || ($i != null && $i.policies.gtlAvailable);
		default:
			return false;
	}
}

export function availableBasicTimelines(): BasicTimelineType[] {
	return basicTimelineTypes.filter(isAvailableBasicTimeline);
}

export function hasWithReplies(timeline: BasicTimelineType | undefined | null): boolean {
	return timeline === 'local' || timeline === 'social';
}
