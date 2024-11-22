/*
 * SPDX-FileCopyrightText: dakkar and sharkey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { IObject } from '../type.js';

export function assertActivityMatchesUrls(activity: IObject, urls: string[]) {
	const idOk = activity.id !== undefined && urls.includes(activity.id);

	// technically `activity.url` could be an `ApObject = IObject |
	// string | (IObject | string)[]`, but if it's a complicated thing
	// and the `activity.id` doesn't match, I think we're fine
	// rejecting the activity
	const urlOk = typeof(activity.url) === 'string' && urls.includes(activity.url);

	if (!idOk && !urlOk) {
		throw new Error(`bad Activity: neither id(${activity?.id}) nor url(${activity?.url}) match location(${urls})`);
	}
}
