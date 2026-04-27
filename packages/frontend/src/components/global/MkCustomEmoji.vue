<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<img
	v-if="shouldMute"
	:class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]"
	src="/client-assets/unknown.png"
	:title="alt"
	draggable="false"
	style="-webkit-user-drag: none;"
	@click="onClick"
/>
<img
	v-else-if="errored && fallbackToImage"
	:class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]"
	src="/client-assets/dummy.png"
	:title="alt"
	draggable="false"
	style="-webkit-user-drag: none;"
/>
<span v-else-if="errored">:{{ customEmojiName }}:</span>
<img
	v-else
	:class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]"
	:src="url"
	:alt="alt"
	:title="alt"
	decoding="async"
	draggable="false"
	@error="errored = true"
	@load="errored = false"
	@click="onClick"
/>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, inject, ref } from 'vue';
import type { MenuItem } from '@/types/menu.js';
import { getProxiedImageUrl, getStaticImageUrl } from '@/utility/media-proxy.js';
import { customEmojisMap } from '@/custom-emojis.js';
import * as os from '@/os.js';
import { misskeyApi, misskeyApiGet } from '@/utility/misskey-api.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';
import MkCustomEmojiDetailedDialog from '@/components/MkCustomEmojiDetailedDialog.vue';
import { $i } from '@/i.js';
import { prefer } from '@/preferences.js';
import { DI } from '@/di.js';
import { makeEmojiMuteKey, mute as muteEmoji, unmute as unmuteEmoji, checkMuted as checkEmojiMuted } from '@/utility/emoji-mute';

const props = defineProps<{
	name: string;
	normal?: boolean;
	noStyle?: boolean;
	host?: string | null;
	url?: string;
	useOriginalSize?: boolean;
	menu?: boolean;
	menuReaction?: boolean;
	fallbackToImage?: boolean;
	ignoreMuted?: boolean;
}>();

const react = inject(DI.mfmEmojiReactCallback);

const customEmojiName = computed(() => (props.name[0] === ':' ? props.name.substring(1, props.name.length - 1) : props.name).replace('@.', ''));
const isLocal = computed(() => !props.host && (customEmojiName.value.endsWith('@.') || !customEmojiName.value.includes('@')));
const emojiCodeToMute = makeEmojiMuteKey(props);
const isMuted = checkEmojiMuted(emojiCodeToMute);
const shouldMute = computed(() => !props.ignoreMuted && isMuted.value);

const rawUrl = computed(() => {
	if (props.url) {
		return props.url;
	}
	if (isLocal.value) {
		return customEmojisMap.get(customEmojiName.value)?.url ?? null;
	}
	return props.host ? `/emoji/${customEmojiName.value}@${props.host}.webp` : `/emoji/${customEmojiName.value}.webp`;
});

const url = computed(() => {
	if (rawUrl.value == null) return undefined;

	const proxied =
		(rawUrl.value.startsWith('/emoji/') || (props.useOriginalSize && isLocal.value))
			? rawUrl.value
			: getProxiedImageUrl(
				rawUrl.value,
				props.useOriginalSize ? undefined : 'emoji',
				false,
				true,
			);
	return prefer.s.disableShowingAnimatedImages
		? getStaticImageUrl(proxied)
		: proxied;
});

const alt = computed(() => `:${customEmojiName.value}:`);
const errored = ref(url.value == null);

function onClick(ev: PointerEvent) {
	if (props.menu) {
		const menuItems: MenuItem[] = [];

		menuItems.push({
			type: 'label',
			text: `:${props.name}:`,
		});

		if (isLocal.value) {
			menuItems.push({
				text: i18n.ts.copy,
				icon: 'ti ti-copy',
				action: () => {
					copyToClipboard(`:${props.name}:`);
				},
			});
		}

		if (props.menuReaction && react) {
			menuItems.push({
				text: i18n.ts.doReaction,
				icon: 'ti ti-plus',
				action: () => {
					react(`:${props.name}:`);
				},
			});
		}

		if (isLocal.value) {
			menuItems.push({
				type: 'divider',
			}, {
				text: i18n.ts.info,
				icon: 'ti ti-info-circle',
				action: async () => {
					const { dispose } = os.popup(MkCustomEmojiDetailedDialog, {
						emoji: await misskeyApiGet('emoji', {
							name: customEmojiName.value,
						}),
					}, {
						closed: () => dispose(),
					});
				},
			});
		}

		if (isMuted.value) {
			menuItems.push({
				text: i18n.ts.emojiUnmute,
				icon: 'ti ti-mood-smile',
				action: async () => {
					await unmute();
				},
			});
		} else {
			menuItems.push({
				text: i18n.ts.emojiMute,
				icon: 'ti ti-mood-off',
				action: async () => {
					await mute();
				},
			});
		}

		if (($i?.isModerator ?? $i?.isAdmin) && isLocal.value) {
			menuItems.push({
				text: i18n.ts.edit,
				icon: 'ti ti-pencil',
				action: async () => {
					await edit(props.name);
				},
			});
		}

		os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
	}
}

async function edit(name: string) {
	const emoji = await misskeyApi('emoji', {
		name: name,
	});
	const { dispose } = await os.popupAsyncWithDialog(import('@/pages/emoji-edit-dialog.vue').then(x => x.default), {
		emoji: emoji,
	}, {
		closed: () => dispose(),
	});
}

function mute() {
	const titleEmojiName = isLocal.value
		? `:${customEmojiName.value}:`
		: emojiCodeToMute;
	os.confirm({
		type: 'question',
		title: i18n.tsx.muteX({ x: titleEmojiName }),
	}).then(({ canceled }) => {
		if (canceled) {
			return;
		}
		muteEmoji(emojiCodeToMute);
	});
}

function unmute() {
	const titleEmojiName = isLocal.value
		? `:${customEmojiName.value}:`
		: emojiCodeToMute;
	os.confirm({
		type: 'question',
		title: i18n.tsx.unmuteX({ x: titleEmojiName }),
	}).then(({ canceled }) => {
		if (canceled) {
			return;
		}
		unmuteEmoji(emojiCodeToMute);
	});
}

</script>

<style lang="scss" module>
.root {
	height: 2em;
	vertical-align: middle;
	-webkit-user-drag: none;
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.2);
	}
}

.normal {
	height: 1.25em;
	vertical-align: -0.25em;

	&:hover {
		transform: none;
	}
}

.noStyle {
	height: auto !important;
}
</style>
