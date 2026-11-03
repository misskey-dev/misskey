<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="[$style.content]">
		<div
			v-flip :style="{
				'cursor': canShare ? 'pointer' : 'default',
			}"
			:class="$style.qr" @click="share"
			v-html="qrSvg"
		></div>
		<div v-flip :class="$style.user">
			<MkAvatar :class="$style.avatar" :user="$i" :indicator="false"/>
			<div>
				<div :class="$style.name"><MkCondensedLine :minScale="2 / 3"><MkUserName :user="$i" :nowrap="true"/></MkCondensedLine></div>
				<div><MkCondensedLine :minScale="2 / 3">{{ acct }}</MkCondensedLine></div>
			</div>
		</div>
		<img v-if="deviceMotionPermissionNeeded" v-flip :class="$style.logo" :src="misskeysvg" alt="Misskey Logo" @click="requestDeviceMotion"/>
		<img v-else v-flip :class="$style.logo" :src="misskeysvg" alt="Misskey Logo"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import tinycolor from 'tinycolor2';
import { qrcode } from 'etiket/qr';
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { url, host } from '@@/js/config.js';
import type { Directive } from 'vue';
import { instance } from '@/instance.js';
import { ensureSignin } from '@/i.js';
import { userPage, userName } from '@@/js/user.js';
import misskeysvg from '/client-assets/misskey.svg';
import { getStaticImageUrl } from '@/utility/media-proxy.js';
import { i18n } from '@/i18n.js';
import { qrOptions } from '@/utility/qr-code.js';

const $i = ensureSignin();

const acct = computed(() => `@${$i.username}@${host}`);
const userProfileUrl = computed(() => userPage($i, undefined, true));
const shareData = computed(() => ({
	title: i18n.tsx._qr.shareTitle({ name: userName($i), acct: acct.value }),
	text: i18n.ts._qr.shareText,
	url: userProfileUrl.value,
}));
const canShare = computed(() => navigator.canShare && navigator.canShare(shareData.value));

const qrColor = computed(() => tinycolor(instance.themeColor ?? '#86b300'));
const qrHsl = computed(() => qrColor.value.toHsl());

function share() {
	if (!canShare.value) return;
	return navigator.share(shareData.value);
}

const qrSvg = computed(() => {
	return qrcode(`${url}/users/${$i.id}`, {
		...qrOptions,
		size: 600,
		margin: 3,
		ecLevel: 'H',
		color: tinycolor(`hsl(${qrHsl.value.h}, 100, 18)`).toRgbString(),
		background: tinycolor(`hsl(${qrHsl.value.h}, 100, 97)`).toRgbString(),
		logo: {
			imageUrl: instance.iconUrl ? getStaticImageUrl(instance.iconUrl) : `${url}/favicon.ico`,
			size: 0.25,
			margin: 16,
		},
	});
});

//#region flip
const THRESHOLD = -3;
// @ts-expect-error TS(2339)
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
	// @ts-expect-error TS(2339)
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
	},
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
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.content {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.qr {
	position: relative;
	margin: 0 auto;
	width: 100%;
	max-width: 230px;
	border-radius: 12px;
	overflow: clip;
	aspect-ratio: 1;

	> svg {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
}

.user {
	display: flex;
	flex-direction: column;
	margin: $s3 auto;
	justify-content: center;
	align-items: center;
	text-align: center;
	overflow: visible;
	width: fit-content;
	max-width: 100%;
}

.avatar {
	width: $avatarSize;
	height: $avatarSize;
	margin-bottom: 16px;
}

.name {
	font-weight: bold;
	font-size: 110%;
}

.logo {
	width: 100px;
	margin: $s3 auto 0;
	filter: drop-shadow(0 0 6px #0007);
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
