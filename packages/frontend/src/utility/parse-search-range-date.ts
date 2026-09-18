/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseSearchRangeDate(dateValue: string | null, timeValue: string | null, boundary: 'start' | 'end'): number | null {
	if (!dateValue) return null;

	const dateOnlyMatch = dateOnlyPattern.exec(dateValue);
	if (!dateOnlyMatch) return null;

	const [, yearString, monthString, dayString] = dateOnlyMatch;
	const year = Number(yearString);
	const month = Number(monthString);
	const day = Number(dayString);
	const time = timeValue || (boundary === 'start' ? '00:00:00.000' : '23:59:59.999');
	const date = new Date(`${dateValue}T${time}`);

	if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		return null;
	}

	return date.getTime();
}
