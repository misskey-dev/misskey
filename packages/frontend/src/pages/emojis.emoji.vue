<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button class="_button" :class="$style.root" @click="menu">
	<img :src="emoji.url" :class="$style.img" loading="lazy"/>
	<div :class="$style.body">
		<div :class="$style.name" class="_monospace">{{ emoji.name }}</div>
		<div :class="$style.info">{{ emoji.aliases.join(' ') }}</div>
	</div>
</button>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import type { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';
import { misskeyApiGet } from '@/utility/misskey-api.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';
import MkCustomEmojiDetailedDialog from '@/components/MkCustomEmojiDetailedDialog.vue';
import { $i } from '@/i.js';

const props = defineProps<{
	emoji: Misskey.entities.EmojiSimple;
}>();

function menu(ev: PointerEvent) {
	const menuItems: MenuItem[] = [];
	menuItems.push({
		type: 'label',
		text: ':' + props.emoji.name + ':',
	}, {
		text: i18n.ts.copy,
		icon: 'ti ti-copy',
		action: () => {
			copyToClipboard(`:${props.emoji.name}:`);
		},
	}, {
		text: i18n.ts.info,
		icon: 'ti ti-info-circle',
		action: async () => {
			const { dispose } = os.popup(MkCustomEmojiDetailedDialog, {
				emoji: await misskeyApiGet('emoji', {
					name: props.emoji.name,
				}),
			}, {
				closed: () => dispose(),
			});
		},
	});

	if ($i?.isModerator ?? $i?.isAdmin) {
		menuItems.push({
			text: i18n.ts.edit,
			icon: 'ti ti-pencil',
			action: async () => {
				const detailedEmoji = await misskeyApiGet('emoji', {
					name: props.emoji.name,
				});
				const { dispose } = await os.popupAsyncWithDialog(import('@/pages/emoji-edit-dialog.vue').then(x => x.default), {
					emoji: detailedEmoji,
				}, {
					closed: () => dispose(),
				});
			},
		});
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: center;
	padding: 12px;
	text-align: left;
	background: var(--MI_THEME-panel);
	border-radius: 8px;

	&:hover {
		border-color: var(--MI_THEME-accent);
	}
}

.img {
	width: 42px;
	height: 42px;
	object-fit: contain;
}

.body {
	padding: 0 0 0 8px;
	white-space: nowrap;
	overflow: hidden;
}

.name {
	text-overflow: ellipsis;
	overflow: hidden;
}

.info {
	opacity: 0.5;
	font-size: 0.9em;
	text-overflow: ellipsis;
	overflow: hidden;
}
</style>
