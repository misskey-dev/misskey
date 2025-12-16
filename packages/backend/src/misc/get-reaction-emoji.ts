/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// biome-ignore lint/style/noDefaultExport: historical reason
export default function(reaction: string): string {
	switch (reaction) {
		case 'like': return '👍';
		case 'love': return '❤️';
		case 'laugh': return '😆';
		case 'hmm': return '🤔';
		case 'surprise': return '😮';
		case 'congrats': return '🎉';
		case 'angry': return '💢';
		case 'confused': return '😥';
		case 'rip': return '😇';
		case 'pudding': return '🍮';
		case 'star': return '⭐';
		default: return reaction;
	}
}
