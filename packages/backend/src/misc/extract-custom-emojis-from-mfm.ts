/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as mfm from 'mfm-js';
import { unique } from '@/misc/prelude/array.js';

export function extractCustomEmojisFromMfm(nodes: mfm.MfmNode[]): string[] {
	const emojiNodes = mfm.extract(nodes, (node) => {
		return (node.type === 'emojiCode' && node.props.name.length <= 100);
	}) as mfm.MfmEmojiCode[];

	return unique(emojiNodes.map(x => x.props.name));
}
