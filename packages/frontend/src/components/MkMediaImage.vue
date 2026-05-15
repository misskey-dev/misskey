<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[hide ? $style.hidden : $style.visible, (image.isSensitive && prefer.s.highlightSensitiveMedia) && $style.sensitive]" @click="reveal" @contextmenu.stop="onContextmenu">
	<component
		:is="disableImageLink ? 'div' : 'a'"
		v-bind="disableImageLink ? {
			title: image.name,
			class: $style.imageContainer,
		} : {
			title: image.name,
			class: $style.imageContainer,
			href: image.url,
			style: 'cursor: zoom-in;'
		}"
	>
		<MkImgWithBlurhash
			v-if="prefer.s.enableHighQualityImagePlaceholders"
			:hash="image.blurhash"
			:src="(prefer.s.dataSaver.media && hide) ? null : url"
			:forceBlurhash="hide"
			:cover="hide || cover"
			:alt="image.comment || image.name"
			:title="image.comment || image.name"
			:width="image.properties.width"
			:height="image.properties.height"
			:style="hide ? 'filter: brightness(0.7);' : null"
			:class="$style.image"
		/>
		<div
			v-else-if="prefer.s.dataSaver.media || hide"
			:title="image.comment || image.name"
			:style="hide ? 'background: #888;' : null"
			:class="$style.image"
		></div>
		<img
			v-else
			:src="url"
			:alt="image.comment || image.name"
			:title="image.comment || image.name"
			:class="$style.image"
		/>
	</component>
	<template v-if="hide">
		<div :class="$style.hiddenText">
			<div :class="$style.hiddenTextWrapper">
				<b v-if="image.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ prefer.s.dataSaver.media ? ` (${i18n.ts.image}${image.size ? ' ' + bytes(image.size) : ''})` : '' }}</b>
				<b v-else style="display: block;"><i class="ti ti-photo"></i> {{ prefer.s.dataSaver.media && image.size ? bytes(image.size) : i18n.ts.image }}</b>
				<span v-if="controls" style="display: block;">{{ i18n.ts.clickToShow }}</span>
			</div>
		</div>
	</template>
	<template v-else-if="controls">
		<div :class="$style.indicators">
			<div v-if="['image/gif', 'image/apng'].includes(image.type)" :class="$style.indicator">GIF</div>
			<div v-if="image.comment" :class="$style.indicator">ALT</div>
			<div v-if="image.isSensitive" :class="$style.indicator" style="color: var(--MI_THEME-warn);" :title="i18n.ts.sensitive"><i class="ti ti-eye-exclamation"></i></div>
		</div>
		<button :class="$style.menu" class="_button" @click.stop="showMenu"><i class="ti ti-dots" style="vertical-align: middle;"></i></button>
		<i class="ti ti-eye-off" :class="$style.hide" @click.stop="hide = true"></i>
	</template>
</div>
</template>

<script lang="ts" setup>
import { watch, ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import type { MenuItem } from '@/types/menu.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard';
import { getStaticImageUrl } from '@/utility/media-proxy.js';
import bytes from '@/filters/bytes.js';
import MkImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { $i, iAmModerator } from '@/i.js';
import { prefer } from '@/preferences.js';
import { shouldHideFileByDefault, canRevealFile } from '@/utility/sensitive-file.js';

const props = withDefaults(defineProps<{
	image: Misskey.entities.DriveFile;
	raw?: boolean;
	cover?: boolean;
	disableImageLink?: boolean;
	controls?: boolean;
}>(), {
	cover: false,
	disableImageLink: false,
	controls: true,
});

const hide = ref(true);

const url = computed(() => (props.raw || prefer.s.loadRawImages)
	? props.image.url
	: prefer.s.disableShowingAnimatedImages
		? getStaticImageUrl(props.image.url)
		: props.image.thumbnailUrl!,
);

async function reveal(ev: PointerEvent) {
	if (!props.controls) {
		return;
	}

	if (hide.value) {
		ev.stopPropagation();
		if (!(await canRevealFile(props.image))) {
			return;
		}

		hide.value = false;
	}
}

// Plugin:register_note_view_interruptor を使って書き換えられる可能性があるためwatchする
watch(() => props.image, (newImage) => {
	hide.value = shouldHideFileByDefault(newImage);
}, {
	deep: true,
	immediate: true,
});

function getMenu() {
	const menuItems: MenuItem[] = [];

	menuItems.push({
		text: i18n.ts.hide,
		icon: 'ti ti-eye-off',
		action: () => {
			hide.value = true;
		},
	});

	if (iAmModerator) {
		menuItems.push({
			text: props.image.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
			icon: 'ti ti-eye-exclamation',
			danger: true,
			action: async () => {
				const { canceled } = await os.confirm({
					type: 'warning',
					text: props.image.isSensitive ? i18n.ts.unmarkAsSensitiveConfirm : i18n.ts.markAsSensitiveConfirm,
				});

				if (canceled) return;

				os.apiWithDialog('drive/files/update', {
					fileId: props.image.id,
					isSensitive: !props.image.isSensitive,
				});
			},
		});
	}

	const details: MenuItem[] = [];
	if ($i?.id === props.image.userId) {
		details.push({
			type: 'link',
			text: i18n.ts._fileViewer.title,
			icon: 'ti ti-info-circle',
			to: `/my/drive/file/${props.image.id}`,
		});
	}

	if (iAmModerator) {
		details.push({
			type: 'link',
			text: i18n.ts.moderation,
			icon: 'ti ti-photo-exclamation',
			to: `/admin/file/${props.image.id}`,
		});
	}

	if (details.length > 0) {
		menuItems.push({ type: 'divider' }, ...details);
	}

	if (prefer.s.devMode) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-hash',
			text: i18n.ts.copyFileId,
			action: () => {
				copyToClipboard(props.image.id);
			},
		});
	}

	return menuItems;
}

function showMenu(ev: PointerEvent) {
	os.popupMenu(getMenu(), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function onContextmenu(ev: PointerEvent) {
	os.contextMenu(getMenu(), ev);
}
</script>

<style lang="scss" module>
.hidden {
	position: relative;
}

.sensitive {
	position: relative;

	&::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		border-radius: inherit;
		box-shadow: inset 0 0 0 4px var(--MI_THEME-warn);
	}
}

.hiddenText {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
}

.hide {
	display: block;
	position: absolute;
	background-color: rgba(0, 0, 0, 0.3);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-radius: 0 0 0 9px;
	color: #fff;
	font-size: 12px;
	opacity: .5;
	padding: 5px 8px;
	text-align: center;
	cursor: pointer;
	top: 0;
	right: 0;
}

.hiddenTextWrapper {
	display: table-cell;
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.visible {
	position: relative;
	//box-shadow: 0 0 0 1px var(--MI_THEME-divider) inset;
	background: var(--MI_THEME-bg);
	background-size: 16px 16px;
}

html[data-color-scheme=dark] .visible {
	--c: rgb(255 255 255 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

html[data-color-scheme=light] .visible {
	--c: rgb(0 0 0 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

.menu {
	display: block;
	position: absolute;
	background-color: rgba(0, 0, 0, 0.3);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-radius: 9px 0 0 0;
	color: #fff;
	font-size: 0.8em;
	width: 28px;
	height: 28px;
	text-align: center;
	bottom: 0;
	right: 0;
}

.imageContainer {
	display: block;
	overflow: hidden;
	width: 100%;
	height: 100%;
	background-position: center;
	background-size: contain;
	background-repeat: no-repeat;
}

.indicators {
	display: inline-flex;
	position: absolute;
	top: 10px;
	left: 10px;
	pointer-events: none;
	opacity: .5;
	gap: 6px;
}

.indicator {
	/* Hardcode to black because either --MI_THEME-bg or --MI_THEME-fg makes it hard to read in dark/light mode */
	background-color: black;
	border-radius: 6px;
	color: hsl(from var(--MI_THEME-accent) h s calc(l + 10));
	display: inline-block;
	font-weight: bold;
	font-size: 0.8em;
	padding: 2px 5px;
}

.image {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
	object-position: center;
}
</style>
