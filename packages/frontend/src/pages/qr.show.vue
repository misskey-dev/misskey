<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root" :style="{
	backgroundColor: bgColor,
	'--MI-QrShowMinHeight': scrollContainer ? `${scrollHeight}px` : `calc( 100dvh - var(--MI-minBottomSpacing) )`,
}">
	<MkAnimBg style="position: absolute; top: 0;" :scale="1.5" />
	<div :class="$style.fg">
		<div
			:class="[$style.content, '_spacer']"
			:style="{
				'--MI_SPACER-w': '512px',
				'--MI_SPACER-max': '14px',
			}"
		>
			<div
				:class="$style.qrOuter"
				:style="{
					'cursor': canShare ? 'pointer' : 'default',
				}"
				@click="share"
			>
				<div ref="qrCodeEl" v-flip :class="$style.qrInner"></div>
			</div>
			<div :class="$style.user">
				<MkAvatar v-flip :class="$style.avatar" :user="$i" :indicator="false"/>
				<div :class="$style.names">
					<div v-flip :class="$style.username"><MkCondensedLine :minScale="2 / 3">{{ acct }}</MkCondensedLine></div>
					<div v-flip :class="$style.name"><MkCondensedLine :minScale="2 / 3">{{ userName($i) }}</MkCondensedLine></div>
				</div>
			</div>
			<img v-if="deviceMotionPermissionNeeded" v-flip :class="$style.logo" :src="misskeysvg" alt="Misskey Logo" @click="requestDeviceMotion" />
			<img v-else v-flip :class="$style.logo" :src="misskeysvg" alt="Misskey Logo" />
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { extractAvgColorFromBlurhash } from '@@/js/extract-avg-color-from-blurhash.js';
import tinycolor from 'tinycolor2';
import QRCodeStyling from 'qr-code-styling';
import type { Directive } from 'vue';
import { computed, ref, shallowRef, watch, onMounted, onUnmounted } from 'vue';
import { host } from '@@/js/config.js';
import { instance } from '@/instance.js';
import { ensureSignin } from '@/i.js';
import { userPage, userName } from '@/filters/user.js';
import misskeysvg from '/client-assets/misskey.svg';
import MkAnimBg from '@/components/MkAnimBg.vue';
import { getStaticImageUrl } from '@/utility/media-proxy.js';
import { i18n } from '@/i18n.js';
import { getScrollContainer } from '@@/js/scroll';

const $i = ensureSignin();

const scrollContainer = shallowRef<HTMLElement | null>(null);
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

const qrCodeInstance = new QRCodeStyling({
	width: 600,
	height: 600,
	margin: 36,
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
		margin: 16,
		crossOrigin: 'anonymous',
	},
	dotsOptions: {
		color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 18)`).toRgbString(),
		gradient: {
			type: 'linear',
			rotation: 1, // radian
			colorStops: [
				{ offset: 0, color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 25)`).toRgbString() },
				{ offset: 0.5, color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 20)`).toRgbString() },
				{ offset: 1, color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 6)`).toRgbString() },
			],
		},
		type: 'classy-rounded',
	},
	backgroundOptions: {
		color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 97)`).toRgbString(),
	},
});

onMounted(() => {
	if (qrCodeEl.value != null) {
		qrCodeInstance.append(qrCodeEl.value);
	}
});

//#region scroll height
function checkScrollHeight() {
	scrollHeight.value = scrollContainer.value ? scrollContainer.value.clientHeight : window.innerHeight;
}

let ro: ResizeObserver | undefined;

onMounted(() => {
	scrollContainer.value = getScrollContainer(rootEl.value);
	checkScrollHeight();

	if (scrollContainer.value) {
		ro = new ResizeObserver(checkScrollHeight);
		ro.observe(scrollContainer.value);
	}
});

onUnmounted(() => {
	ro?.disconnect();
});
//#endregion

//#region flip
const THRESHOLD = -3;
// @ts-ignore
const deviceMotionPermissionNeeded = window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission === 'function';
const flipEls: Set<Element> = new Set();
const flip = ref(false);

function handleOrientationChange(event: DeviceOrientationEvent) {
	const isUpsideDown = event.beta ? event.beta < THRESHOLD : false;
	flip.value = isUpsideDown;
}

watch(flip, (newState) => {
	flipEls.forEach(el => {
		el.classList.toggle('_qrShowFlipFliped', newState);
	});
});

function requestDeviceMotion() {
	if (!deviceMotionPermissionNeeded) return;
	// @ts-ignore
	window.DeviceMotionEvent.requestPermission()
		.then((response: string) => {
			if (response === 'granted') {
				window.addEventListener('deviceorientation', handleOrientationChange);
			}
		})
		.catch(console.error);
}

onMounted(() => {
	window.addEventListener('deviceorientation', handleOrientationChange);
});

onUnmounted(() => {
	window.removeEventListener('deviceorientation', handleOrientationChange);
});

const vFlip = {
	mounted(el: Element) {
		flipEls.add(el);
		el.classList.add('_qrShowFlip');
	},
	unmounted(el: Element) {
		el.classList.remove('_qrShowFlip');
		flipEls.delete(el);
	}
} as Directive;
//#endregion
</script>

<style lang="scss" module>
$s1: 14px;
$s2: 21px;
$s3: 28px;
$avatarSize: 58px;

.root {
	position: relative;
	box-sizing: border-box;
	margin-top: calc( -1 * var(--MI-stickyTop) );
	margin-bottom: calc( -1 * var(--MI-stickyBottom) );
	height: 100%;
	min-height: var(--MI-QrShowMinHeight);
}

.fg {
	position: sticky;
  padding-top: var(--MI-stickyTop);
	padding-bottom: var(--MI-stickyBottom);
	width: 100%;
	height: 100%;
}

.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 0 auto;
	padding-top: $s1;
}

.qrOuter {
	display: flex;
	width: 100%;
	padding: 0 0 $s3;
	max-height: max(256px, calc((var(--MI-QrShowMinHeight) - var(--MI-stickyTop) - var(--MI-stickyBottom)) * 0.55));
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
	margin: -2px -2px 0 ($avatarSize * 0.3);
	padding-right: 16px;
	max-width: 100%;
	overflow-x: hidden;
	overflow-y: visible;
	mask-image: linear-gradient(90deg,#000,#000 calc(100% - 16px),#0000);
}

.name {
	display: inline-block;
	color: #fff;
	font-size: 18px;
	line-height: 21px;
	width: fit-content;
	max-width: 100%;
	overflow: visible;
}

.username {
	display: inline-block;
	color: rgba(255, 255, 255, 0.7);
	font-size: 13px;
	line-height: 15px;
	width: fit-content;
	max-width: 100%;
	overflow: visible;
}

.logo {
	width: 25%;
	margin: $s3 auto 0;
}
</style>

<style lang="scss">
/*
 * useCssModuleで$styleを読み込みたかったが、rollupでのunwindが壊れてしまうらしく失敗。
 * グローバルにクラスを定義することでお茶を濁す。
 */
._qrShowFlip {
	transition: rotate .3s linear, scale .3s .15s step-start;
}

._qrShowFlipFliped {
	scale: -1 1;
  rotate: x 180deg;
}
</style>
