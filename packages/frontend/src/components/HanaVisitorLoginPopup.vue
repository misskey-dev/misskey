<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_panel _shadow" :class="$style.root">
	<img src="https://static-assets.misskey.flowers/misc/bg-particles/popup_v1.png" :class="$style.bg"/>
	<div :class="$style.main" class="_gaps_s">
		<div :class="$style.title">{{ i18n.ts._hana._visitorLoginPopup.title }}</div>
		<div :class="$style.text">{{ i18n.ts._hana._visitorLoginPopup.description }}</div>
		<div class="_buttonsCenter">
			<MkButton rounded gradate link to="/" @click.passive="close">{{ i18n.ts.joinThisServer }}</MkButton>
		</div>
		<div class="_buttonsCenter">
			<button :class="$style.loginButton" class="_textButton" @click="signin">{{ i18n.ts.login }}</button>
		</div>
	</div>
	<button class="_button" :class="$style.close" @click="close"><i class="ti ti-x"></i></button>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { useRouter } from '@/router.js';

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const zIndex = os.claimZIndex('low');

const router = useRouter();

router.on('change', ({ path }) => {
	if (path === '/') {
		close();
	}
});

function signin() {
	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkSigninDialog.vue')), {
		autoSet: true,
	}, {
		closed: () => dispose(),
	});
}

function close() {
	emit('closed');
}
</script>

<style lang="scss" module>
.root {
	position: fixed;
	z-index: v-bind(zIndex);
	bottom: var(--MI-margin);
	left: 0;
	right: 0;
	margin: auto;
	box-sizing: border-box;
	overflow: hidden;
	overflow: clip;
	width: calc(100% - (var(--MI-margin) * 2));
	max-width: 500px;
}

.main {
	position: relative;
	padding: 25px;
	text-align: center;
}

.bg {
	position: absolute;
	bottom: 0;
	right: 0;
	height: 100%;
	width: auto;
	opacity: 0.6;
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.close {
	position: absolute;
	top: 8px;
	right: 8px;
	padding: 8px;
}

.title {
	font-weight: bold;
	font-size: 1.2em;
}

.loginButton {
	font-size: 0.85em;
	color: var(--MI_THEME-fg);
}
</style>
