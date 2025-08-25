<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" :style="{ backgroundColor: bgColor }">
	<MkAnimBg style="position: absolute; top: 0;" :scale="1.5" />
	<div :class="$style.fg">
		<div
			:class="$style.content" class="_spacer"
			@click="share"
			:style="{
				'--MI_SPACER-w': '512px',
				'cursor': canShare ? 'pointer' : 'default',
			}"
		>
			<div :class="$style.qrOuter">
				<div v-flip-on-device-orientation ref="qrCodeEl" :class="$style.qrInner"></div>
			</div>
			<div :class="$style.user">
				<MkAvatar v-flip-on-device-orientation :class="$style.avatar" :user="$i" :indicator="false"/>
				<div :class="$style.names">
					<div v-flip-on-device-orientation :class="$style.username"><MkCondensedLine :minScale="2 / 3">{{ acct }}</MkCondensedLine></div>
					<div v-flip-on-device-orientation :class="$style.name"><MkCondensedLine :minScale="2 / 3">{{ userName($i) }}</MkCondensedLine></div>
				</div>
			</div>
			<img v-flip-on-device-orientation :class="$style.logo" :src="misskeysvg" alt="Misskey Logo"/>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { extractAvgColorFromBlurhash } from '@@/js/extract-avg-color-from-blurhash.js';
import tinycolor from 'tinycolor2';
import QRCodeStyling from 'qr-code-styling';
import { computed, ref, watch, onMounted } from 'vue';
import { host } from '@@/js/config.js';
import { instance } from '@/instance.js';
import { ensureSignin } from '@/i.js';
import { userPage, userName } from '@/filters/user.js';
import misskeysvg from '/client-assets/misskey.svg';
import MkAnimBg from '@/components/MkAnimBg.vue';
import { getStaticImageUrl } from '@/utility/media-proxy.js';
import { i18n } from '@/i18n.js';

const $i = ensureSignin();

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
		text: i18n.tsx._qr.shareText({ name: userName($i), acct: acct.value }),
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
			margin: 8,
			crossOrigin: 'anonymous',
		},
		dotsOptions: {
			color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 18)`).toRgbString(),
			gradient: {
				type: 'linear',
				rotation: 1, // radian
				colorStops: [
					{ offset: 0, color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 6)`).toRgbString() },
					{ offset: 0.5, color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 18)`).toRgbString() },
					{ offset: 1, color: tinycolor(`hsl(${avatarHsl.value.h}, 100, 25)`).toRgbString() },
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

</script>

<style lang="scss" module>
.root {
	position: relative;
	margin-top: calc( -1 * var(--MI-stickyTop) );
  padding-top: var(--MI-stickyTop);
	height: calc( 100dvh - var(--MI-stickyTop) - var(--MI-stickyBottom) );
}

.fg {
	position: absolute;
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

.qrOuter {
	display: flex;
}

.qrInner {
	width: 100%;
	max-height: 40dvh;
	margin: 58px auto 32px;

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
	margin: 32px auto;
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
	margin: -4px -2px 0 8px;
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
	width: 30%;
	margin: 32px auto 0;
}
</style>
