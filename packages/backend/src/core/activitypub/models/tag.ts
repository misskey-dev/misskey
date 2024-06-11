/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toArray } from '@/misc/prelude/array.js';
import { isNotNull } from '@/misc/is-not-null.js';
import { isHashtag } from '../type.js';
import type { IObject, IApHashtag } from '../type.js';

export function extractApHashtags(tags: IObject | IObject[] | null | undefined): string[] {
	if (tags == null) return [];

	const hashtags = extractApHashtagObjects(tags);

	return hashtags.map(tag => {
		const m = tag.name.match(/^#(.+)/);
		return m ? m[1] : null;
	}).filter(isNotNull);
}

export function extractApHashtagObjects(tags: IObject | IObject[] | null | undefined): IApHashtag[] {
	if (tags == null) return [];
	return toArray(tags).filter(isHashtag);
}
