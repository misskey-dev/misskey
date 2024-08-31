/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { $i } from '@/account.js';

export const basicTimelineTypes = [
	'home',
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
		case 'local':
			return 'ti ti-planet';
		case 'social':
			return 'ti ti-universe';
		case 'global':
			return 'ti ti-whirl';
	}
}

export function isAvailableBasicTimeline(metadata: Misskey.entities.MetaDetailed, timeline: BasicTimelineType | undefined | null): boolean {
	switch (timeline) {
		case 'home':
			return $i != null;
		case 'local':
			return ($i == null && metadata.policies.ltlAvailable) || ($i != null && $i.policies.ltlAvailable);
		case 'social':
			return $i != null && $i.policies.ltlAvailable;
		case 'global':
			return ($i == null && metadata.policies.gtlAvailable) || ($i != null && $i.policies.gtlAvailable);
		default:
			return false;
	}
}

export function availableBasicTimelines(metadata: Misskey.entities.MetaDetailed): BasicTimelineType[] {
	return basicTimelineTypes.filter(timeline => isAvailableBasicTimeline(metadata, timeline));
}

export function hasWithReplies(timeline: BasicTimelineType | undefined | null): boolean {
	return timeline === 'local' || timeline === 'social';
}
