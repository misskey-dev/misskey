/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type FollowApprovalPeriodUnit = 'hour' | 'day';

export const FOLLOW_APPROVAL_UNIT_SECONDS = { hour: 3600, day: 86400 };
export const FOLLOW_APPROVAL_MAX_SECONDS = 30 * 24 * 60 * 60;

export function followApprovalPeriodFromSeconds(seconds: number): { amount: number; unit: FollowApprovalPeriodUnit } {
	const unit = seconds % FOLLOW_APPROVAL_UNIT_SECONDS.day === 0 ? 'day' : 'hour';
	return { amount: seconds / FOLLOW_APPROVAL_UNIT_SECONDS[unit], unit };
}

export function followApprovalPeriodToSeconds(amount: number | null, unit: FollowApprovalPeriodUnit): number | null {
	if (amount == null || !Number.isFinite(amount) || amount <= 0) return null;
	const seconds = Math.round(amount * FOLLOW_APPROVAL_UNIT_SECONDS[unit]);
	return seconds >= 1 && seconds <= FOLLOW_APPROVAL_MAX_SECONDS ? seconds : null;
}
