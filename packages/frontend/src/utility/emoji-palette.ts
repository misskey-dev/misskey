/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { prefer } from '@/preferences.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import type { MkSelectItem } from '@/components/MkSelect.vue';

export function chooseEmojiPalette() {
	return os.select({
		title: i18n.ts.chooseEmojiPalette,
		default: prefer.s.emojiPaletteForMain ?? prefer.s.emojiPaletteForReaction ?? prefer.s.emojiPalettes[0]?.id,
		items: prefer.s.emojiPalettes.map<MkSelectItem<string>>((palette) => {
			let caption: string | undefined = undefined;

			if (prefer.s.emojiPaletteForMain === palette.id) {
				caption = i18n.ts._emojiPalette.paletteForMain;
			} else if (prefer.s.emojiPaletteForReaction === palette.id) {
				caption = i18n.ts._emojiPalette.paletteForReaction;
			}

			return {
				label: palette.name || `(${i18n.ts.noName})`,
				caption,
				value: palette.id,
			};
		}),
	});
}

export async function addToEmojiPalette(emoji: string) {
	const res = await chooseEmojiPalette();

	if (res.canceled || res.result == null) return;

	const palette = prefer.s.emojiPalettes.find((p) => p.id === res.result);
	if (!palette) return;
	let emojis = [...palette.emojis];

	if (!emojis.includes(emoji)) {
		emojis.push(emoji);
		prefer.commit('emojiPalettes', prefer.s.emojiPalettes.map((p) => {
			if (p.id === palette.id) {
				return {
					...p,
					emojis,
				};
			} else {
				return p;
			}
		}));
		os.success();
	} else {
		const res = await os.actions({
			type: 'warning',
			text: i18n.ts.emojiPaletteAlreadyAddedConfirm,
			actions: [{
				value: 'prepend',
				text: i18n.ts.prepend,
			}, {
				value: 'append',
				text: i18n.ts.append,
			}, {
				value: 'doNothing',
				text: i18n.ts.doNothing,
			}],
		});

		if (res.canceled || res.result === 'doNothing') return;

		emojis = emojis.filter((e) => e !== emoji);

		if (res.result === 'append') {
			emojis.push(emoji);
		} else if (res.result === 'prepend') {
			emojis.unshift(emoji);
		}

		prefer.commit('emojiPalettes', prefer.s.emojiPalettes.map((p) => {
			if (p.id === palette.id) {
				return {
					...p,
					emojis,
				};
			} else {
				return p;
			}
		}));

		os.success();
	}
}
