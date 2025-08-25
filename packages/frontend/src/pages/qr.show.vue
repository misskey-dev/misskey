<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root" :style="{
	backgroundColor: bgColor,
	minHeight: container ?
		`calc( ${scrollHeight}px - var(--MI-stickyTop) - var(--MI-stickyBottom) )`
		: `calc( 100dvh - var(--MI-stickyTop) - var(--MI-stickyBottom) )`,
}">
	<MkAnimBg style="position: absolute; top: 0;" :scale="1.5" />
	<div :class="$style.fg">
		<div
			:class="$style.content" class="_spacer"
			@click="share"
			:style="{
				'--MI_SPACER-w': '512px',
				'--MI_SPACER-max': '16px',
				'cursor': canShare ? 'pointer' : 'default',
			}"
		>
			<div
				:class="$style.qrOuter"
				:style="{
					maxHeight: container ? `max(256px, ${scrollHeight * 0.5}px)` : `max(256px, 50dvh)`,
				}"
			>
				<div v-flip ref="qrCodeEl" :class="$style.qrInner"></div>
			</div>
			<div :class="$style.user">
				<MkAvatar v-flip :class="$style.avatar" :user="$i" :indicator="false"/>
				<div :class="$style.names">
					<div v-flip :class="$style.username"><MkCondensedLine :minScale="2 / 3">{{ acct }}</MkCondensedLine></div>
					<div v-flip :class="$style.name"><MkCondensedLine :minScale="2 / 3">{{ userName($i) }}</MkCondensedLine></div>
				</div>
			</div>
			<img v-flip :class="$style.logo" :src="misskeysvg" alt="Misskey Logo"/>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { extractAvgColorFromBlurhash } from '@@/js/extract-avg-color-from-blurhash.js';
import tinycolor from 'tinycolor2';
import QRCodeStyling from 'qr-code-styling';
import { computed, ref, watch, onMounted, type Directive, useCssModule, onUnmounted, type ComponentPublicInstance, nextTick } from 'vue';
import { host } from '@@/js/config.js';
import { instance } from '@/instance.js';
import { ensureSignin } from '@/i.js';
import { userPage, userName } from '@/filters/user.js';
import misskeysvg from '/client-assets/misskey.svg';
import MkAnimBg from '@/components/MkAnimBg.vue';
import { getStaticImageUrl } from '@/utility/media-proxy.js';
import { i18n } from '@/i18n.js';
import { getScrollContainer } from '@@/js/scroll';

const $style = useCssModule();

const $i = ensureSignin();

const container = ref<HTMLElement | null>(null);
const rootEl = ref<HTMLDivElement | null>(null);
const scrollHeight = ref(window.innerHeight);

const acct = computed(() => `@${$i.username}@${host}`);
const url = computed(() => userPage($i, undefined, true));

const canShare = computed(() => navigator.canShare && navigator.canShare({ url: url.value }));

const qrCodeEl = ref<HTMLDivElement | null>(null);

const avatarColor = computed(() => tinycolor(
	$i.avatarBlurhash ?
		extractAvgColorFromBlurhash($i.avatarBlurhash)
		: instance.themeColor
		?? '#86b300',
));
const avatarHsl = computed(() => avatarColor.value.toHsl());
const bgColor = tinycolor(`hsl(${avatarHsl.value.h}, 60, 46)`).toRgbString();

function share() {
	if (!canShare.value) return;
	return navigator.share({
		title: i18n.tsx._qr.shareTitle({ name: userName($i), acct: acct.value }),
		text: i18n.ts._qr.shareText,
		url: url.value,
	});
}

watch([qrCodeEl, avatarHsl, url], () => {
	const qrCodeInstance = new QRCodeStyling({
		width: 512,
		height: 512,
		margin: 40,
		type: 'canvas',
		data: url.value,
		image: instance.iconUrl ? getStaticImageUrl(instance.iconUrl) : '/favicon.ico',
		qrOptions: {
			typeNumber: 0,
			mode: 'Byte',
			errorCorrectionLevel: 'H',
		},
		imageOptions: {
			hideBackgroundDots: true,
			imageSize: 0.3,
			margin: 12,
			crossOrigin: 'anonymous',
		},
		dotsOptions: {
			color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 18)`).toRgbString(),
			gradient: {
				type: 'linear',
				rotation: 1, // radian
				colorStops: [
					{ offset: 0, color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 25)`).toRgbString() },
					{ offset: 0.5, color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 18)`).toRgbString() },
					{ offset: 1, color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 6)`).toRgbString() },
				],
			},
			type: 'classy-rounded',
		},
		backgroundOptions: {
			color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 97)`).toRgbString(),
		},
	});

	if (qrCodeEl.value != null) {
		qrCodeInstance.append(qrCodeEl.value);
	}
}, { immediate: true });

//#region scroll height
function checkScrollHeight() {
	scrollHeight.value = container.value ? container.value.clientHeight : window.innerHeight;
}

let ro: ResizeObserver | undefined;

onMounted(() => {
	container.value = getScrollContainer(rootEl.value);
	checkScrollHeight();

	if (container.value) {
		ro = new ResizeObserver(checkScrollHeight);
		ro.observe(container.value);
	}
});

onUnmounted(() => {
	ro?.disconnect();
});
//#endregion

//#region flip
const flipEls: Set<Element> = new Set();
const flip = ref(false);

function handleOrientationChange(event: DeviceOrientationEvent) {
	const isUpsideDown = event.beta ? event.beta < 5 : false;
	flip.value = isUpsideDown;
}

watch(flip, (newState) => {
	flipEls.forEach(el => {
		el.classList.toggle($style.fliped, newState);
	});
});

onMounted(() => {
	window.addEventListener('deviceorientation', handleOrientationChange);
});

onUnmounted(() => {
	window.removeEventListener('deviceorientation', handleOrientationChange);
});

const vFlip = {
	mounted(el: Element) {
		flipEls.add(el);
		el.classList.add($style.flip);
	},
	unmounted(el: Element) {
		el.classList.remove($style.flip);
		flipEls.delete(el);
	}
} as Directive;
//#endregion
</script>

<style lang="scss" module>
$s1: 16px;
$s2: 24px;
$s3: 32px;

.root {
	position: relative;
	margin-top: calc( -1 * var(--MI-stickyTop) );
	margin-bottom: calc( -1 * var(--MI-stickyBottom) );
  padding-top: var(--MI-stickyTop);
	padding-bottom: var(--MI-stickyBottom);
	height: 100%;
}

.fg {
	position: sticky;
	top: var(--MI-stickyTop);
	width: 100%;
	height: 100%;
}

.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 0 auto;
}

.flip {
	transition: scale rotate 0.3s ease-in;
}

.fliped {
	rotate: x 1;
	scale: y -1;
}

.qrOuter {
	display: flex;
	width: 100%;
	padding: $s3 0;
}

.qrInner {
	margin: 0;

	> svg,
	> canvas {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
}

$avatarSize: 58px;

.user {
	display: flex;
	margin: $s3 auto;
	justify-content: center;
	align-items: center;
	overflow: visible;
	width: fit-content;
	max-width: 100%;
}

.avatar {
	width: $avatarSize;
	height: $avatarSize;
}

.names {
	display: flex;
	font-weight: bold;
	flex-direction: column;
	justify-content: center;
	align-items: start;
	margin: -4px -2px 0 ($avatarSize * 0.25);
	padding-right: 16px;
	max-width: 100%;
	overflow-x: hidden;
	overflow-y: visible;
	mask-image: linear-gradient(90deg,#000,#000 calc(100% - 16px),#0000);
}

.name {
	display: inline-block;
	color: #fff;
	font-size: 20px;
	line-height: 24px;
	width: fit-content;
	max-width: 100%;
	overflow: visible;
}

.username {
	display: inline-block;
	color: rgba(255, 255, 255, 0.7);
	font-size: 14px;
	line-height: 16px;
	width: fit-content;
	max-width: 100%;
	overflow: visible;
}

.logo {
	width: 25%;
	margin: $s3 auto 0;
}
</style>
