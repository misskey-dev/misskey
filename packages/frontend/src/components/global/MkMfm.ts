/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createMfmRenderer } from '@@/js/mfm-renderer.js';
import type { MfmBaseProps } from '@@/js/mfm-renderer.js';
import type { MkABehavior } from '@/components/global/MkA.vue';
import MkUrl from '@/components/global/MkUrl.vue';
import MkTime from '@/components/global/MkTime.vue';
import MkLink from '@/components/MkLink.vue';
import MkMention from '@/components/MkMention.vue';
import MkEmoji from '@/components/global/MkEmoji.vue';
import MkCustomEmoji from '@/components/global/MkCustomEmoji.vue';
import MkCode from '@/components/MkCode.vue';
import MkCodeInline from '@/components/MkCodeInline.vue';
import MkGoogle from '@/components/MkGoogle.vue';
import MkSparkle from '@/components/MkSparkle.vue';
import MkA from '@/components/global/MkA.vue';
import { prefer } from '@/preferences.js';

type MfmProps = MfmBaseProps & {
	enableEmojiMenu?: boolean;
	enableEmojiMenuReaction?: boolean;
	linkNavigationBehavior?: MkABehavior;
};

// eslint-disable-next-line import/no-default-export
export default createMfmRenderer<MfmProps>({
	components: () => ({
		Url: MkUrl,
		Link: MkLink,
		Mention: MkMention,
		A: MkA,
		Time: MkTime,
		Emoji: MkEmoji,
		CustomEmoji: MkCustomEmoji,
		Code: MkCode,
		CodeInline: MkCodeInline,
		Search: MkGoogle,
		Sparkle: MkSparkle,
	}),
	getOptions: () => ({
		advancedMfm: prefer.s.advancedMfm,
		animatedMfm: prefer.s.animatedMfm,
	}),
	supports: {
		navigationBehavior: true,
		emojiMenu: true,
	},
});
