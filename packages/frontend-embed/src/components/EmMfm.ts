/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createMfmRenderer } from '@@/js/mfm-renderer.js';
import EmUrl from '@/components/EmUrl.vue';
import EmTime from '@/components/EmTime.vue';
import EmLink from '@/components/EmLink.vue';
import EmMention from '@/components/EmMention.vue';
import EmEmoji from '@/components/EmEmoji.vue';
import EmCustomEmoji from '@/components/EmCustomEmoji.vue';
import EmA from '@/components/EmA.vue';

// eslint-disable-next-line import/no-default-export
export default createMfmRenderer({
	components: () => ({
		Url: EmUrl,
		Link: EmLink,
		Mention: EmMention,
		A: EmA,
		Time: EmTime,
		Emoji: EmEmoji,
		CustomEmoji: EmCustomEmoji,
	}),
});
