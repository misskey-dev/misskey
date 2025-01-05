<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<img
	v-if="errored && fallbackToImage"
	:class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]"
	src="/client-assets/dummy.png"
	:title="alt"
/>
<span v-else-if="errored">:{{ customEmojiName }}:</span>
<img
	v-else
	:class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]"
	:src="url"
	:alt="alt"
	:title="alt"
	decoding="async"
	@error="errored = true"
	@load="errored = false"
	@click="onClick"
/>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, inject, ref } from 'vue';
import type { MenuItem } from '@/types/menu.js';
import { getProxiedImageUrl, getStaticImageUrl } from '@/scripts/media-proxy.js';
import { defaultStore } from '@/store.js';
import { customEmojisMap } from '@/custom-emojis.js';
import * as os from '@/os.js';
import { misskeyApi, misskeyApiGet } from '@/scripts/misskey-api.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import * as sound from '@/scripts/sound.js';
import { i18n } from '@/i18n.js';
import MkCustomEmojiDetailedDialog from '@/components/MkCustomEmojiDetailedDialog.vue';
import { $i } from '@/account.js';

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
}>();

const react = inject<((name: string) => void) | null>('react', null);

const customEmojiName = computed(() => (props.name[0] === ':' ? props.name.substring(1, props.name.length - 1) : props.name).replace('@.', ''));
const isLocal = computed(() => !props.host && (customEmojiName.value.endsWith('@.') || !customEmojiName.value.includes('@')));

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
	return defaultStore.reactiveState.disableShowingAnimatedImages.value
		? getStaticImageUrl(proxied)
		: proxied;
});

const alt = computed(() => `:${customEmojiName.value}:`);
const errored = ref(url.value == null);

function onClick(ev: MouseEvent) {
	if (props.menu) {
		const menuItems: MenuItem[] = [];

		menuItems.push({
			type: 'label',
			text: `:${props.name}:`,
		}, {
			text: i18n.ts.copy,
			icon: 'ti ti-copy',
			action: () => {
				copyToClipboard(`:${props.name}:`);
				os.success();
			},
		});

		if (props.menuReaction && react) {
			menuItems.push({
				text: i18n.ts.doReaction,
				icon: 'ti ti-plus',
				action: () => {
					react(`:${props.name}:`);
					sound.playMisskeySfx('reaction');
				},
			});
		}

		menuItems.push({
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

		if ($i?.isModerator ?? $i?.isAdmin) {
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
	const { dispose } = os.popup(defineAsyncComponent(() => import('@/pages/emoji-edit-dialog.vue')), {
		emoji: emoji,
	}, {
		closed: () => dispose(),
	});
}

</script>

<style lang="scss" module>
.root {
	height: 2em;
	vertical-align: middle;
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
