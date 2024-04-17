import { $i } from '@/account.js';
import { instance } from '@/instance.js';

export const timelineTypes = [
	'home',
	'local',
	'social',
	'global',
] as const;

export type TimelineType = typeof timelineTypes[number];

export function isTimeline(timeline: string): timeline is TimelineType {
	return timelineTypes.includes(timeline as TimelineType);
}

export function timelineIconClass(timeline: TimelineType): string {
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

export function isAvailableTimeline(timeline: TimelineType | undefined | null): boolean {
	switch (timeline) {
		case 'home':
			return $i != null;
		case 'local':
			return ($i == null && instance.policies.ltlAvailable) || ($i != null && $i.policies.ltlAvailable);
		case 'social':
			return $i != null && instance.policies.ltlAvailable;
		case 'global':
			return ($i == null && instance.policies.gtlAvailable) || ($i != null && $i.policies.gtlAvailable);
		default:
			return false;
	}
}

export function availableTimelines(): TimelineType[] {
	return timelineTypes.filter(isAvailableTimeline);
}

export function hasWithReplies(timeline: TimelineType | undefined | null): boolean {
	return timeline === 'local' || timeline === 'social';
}
