<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" :style="{ backgroundColor: bgColor }">
	<div :class="$style.content" class="_spacer" :style="{ '--MI_SPACER-w': '512px' }">
		<div :class="$style.qrOuter">
			<div v-flip-on-device-orientation ref="qrCodeEl" :class="$style.qrInner"></div>
		</div>
		<div :class="$style.user">
			<MkAvatar v-flip-on-device-orientation :class="$style.avatar" :user="$i" :indicator="false"/>
			<div :class="$style.names">
				<div v-flip-on-device-orientation :class="$style.username"><MkCondensedLine :minScale="2 / 3">@{{ $i.username }}@{{ host }}</MkCondensedLine></div>
				<div v-flip-on-device-orientation :class="$style.name"><MkCondensedLine :minScale="2 / 3">{{ userName($i) }}</MkCondensedLine></div>
			</div>
		</div>
		<img v-flip-on-device-orientation :class="$style.logo" :src="misskeysvg" alt="Misskey Logo"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { extractAvgColorFromBlurhash } from '@@/js/extract-avg-color-from-blurhash';
import tinycolor from 'tinycolor2';
import QRCodeStyling from 'qr-code-styling';
import { computed, ref, watch } from 'vue';
import { host } from '@@/js/config.js';
import { instance } from '@/instance';
import { ensureSignin } from '@/i';
import { userPage, userName } from '@/filters/user';
import misskeysvg from '/client-assets/misskey.svg';

const $i = ensureSignin();

const qrCodeEl = ref<HTMLDivElement | null>(null);

const avatarColor = computed(() => tinycolor(
	$i.avatarBlurhash ?
		extractAvgColorFromBlurhash($i.avatarBlurhash)
		: instance.themeColor
		?? '#86b300',
));
const avatarHsl = computed(() => avatarColor.value.toHsl());
const bgColor = tinycolor(`hsl(${avatarHsl.value.h}, 60, 46)`).toRgbString();

watch([qrCodeEl, avatarHsl], () => {
	const qrCodeInstance = new QRCodeStyling({
		width: 512,
		height: 512,
		margin: 40,
		type: 'canvas',
		data: userPage($i, undefined, true),
		image: instance.iconUrl ?? '/favicon.ico',
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
	margin-top: calc( -1 * var(--MI-stickyTop) );
  padding-top: var(--MI-stickyTop);
	height: calc( 100dvh - var(--MI-stickyTop) - var(--MI-stickyBottom) );
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
	margin: 5dvh auto 2dvh;

	> svg,
	> canvas {
		max-width: 100%;
		max-height: 100%;
	}
}

$avatarSize: 58px;

.user {
	display: flex;
	margin: 2dvh auto;
	justify-content: center;
	align-items: center;
	overflow: clip;
	width: fit-content;
	max-width: 100%;
}

.avatar {
	width: $avatarSize;
	height: $avatarSize;
	margin-right: 8px;
}

.names {
	display: flex;
	font-weight: bold;
	flex-direction: column;
	justify-content: center;
	align-items: start;
	margin-top: -4px;
	max-width: 100%;
	overflow: hidden;
}

.name {
	display: inline-block;
	color: #fff;
	font-size: 20px;
	line-height: 24px;
	width: fit-content;
	max-width: calc(100% - 16px);
	overflow: hidden;
	padding-right: 16px;
	mask-image: linear-gradient(90deg,#000,#000 calc(100% - 16px),#0000);
}

.username {
	display: inline-block;
	color: rgba(255, 255, 255, 0.7);
	font-size: 14px;
	line-height: 16px;
	width: fit-content;
	max-width: calc(100% - 16px);
	overflow: hidden;
	padding-right: 16px;
	mask-image: linear-gradient(90deg,#000,#000 calc(100% - 16px),#0000);
}

.logo {
	width: 30%;
	margin: 2dvh auto 0;
}
</style>
