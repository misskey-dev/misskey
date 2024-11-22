<template>
<div :class="$style.root">
	<div v-if="isTest">
		<button data-cy-signup @click="signup()">{{ i18n.ts.joinThisServer }}</button>
		<button data-cy-signin @click="signin()">{{ i18n.ts.login }}</button>
	</div>
	<iframe
		ref="frameEl"
		:src="frameUrl"
		:class="$style.frame"
		@load="onFrameLoad"
	></iframe>
</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue';
import { instance } from '@/instance.js';
import { miLocalStorage } from '@/local-storage.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router/supplier.js';
import * as os from '@/os.js';

import XSigninDialog from '@/components/MkSigninDialog.vue';
import XSignupDialog from '@/components/MkSignupDialog.vue';

// テストの場合はボタンを別途配置
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const isTest = (import.meta.env.MODE === 'test' || window.Cypress != null);

const dev = _DEV_ ? '?debug' : '';

const lang = miLocalStorage.getItem('lang')?.includes('ja') ? 'ja' : 'en';

const frameUrl = `https://frame-static-assets.misskey.flowers/${lang}/${dev}`;

const frameEl = useTemplateRef('frameEl');

let iframeLoaded = false;

function onFrameLoad() {
	if (!iframeLoaded) {
		iframeLoaded = true;
	} else if (frameEl.value) {
		frameEl.value.src = frameUrl;
		iframeLoaded = false;
	}
	frameEl.value?.contentWindow?.postMessage({
		type: 'hanamisskey:meta',
		payload: {
			colorMode: defaultStore.state.darkMode ? 'dark' : 'light',
			instance: JSON.parse(JSON.stringify(instance)),
		},
	}, 'https://frame-static-assets.misskey.flowers');
}

watch(defaultStore.reactiveState.darkMode, (to) => {
	console.log('darkMode changed');
	frameEl.value?.contentWindow?.postMessage({
		type: 'hanamisskey:colorMode',
		payload: to ? 'dark' : 'light',
	}, 'https://frame-static-assets.misskey.flowers');
});

function signin() {
	const { dispose } = os.popup(XSigninDialog, {
		autoSet: true,
	}, {
		closed: () => dispose(),
	});
}

function signup() {
	const { dispose } = os.popup(XSignupDialog, {
		autoSet: true,
	}, {
		closed: () => dispose(),
	});
}

function upcomingFeatureDialog() {
	os.alert({
		title: i18n.ts._hana._inDevelopment.title,
		text: i18n.ts._hana._inDevelopment.description,
	});
}

const router = useRouter();

function eventHandler(event: MessageEvent) {
	if (event.origin !== 'https://frame-static-assets.misskey.flowers') return;

	if (event.data?.type === 'hanamisskey:lp:clicked') {
		switch (event.data.payload.button) {
			case 'register':
				signup();
				break;
			case 'login':
				signin();
				break;
			case 'wipFeature':
				upcomingFeatureDialog();
				break;
			case 'aboutLink':
				router.push('/about');
				break;
		}
	}
}

onMounted(() => {
	window.addEventListener('message', eventHandler);
});

onUnmounted(() => {
	window.removeEventListener('message', eventHandler);
});
</script>

<style lang="scss" module>
.root {
	height: 100dvh;
	overflow: hidden;
	overflow: clip;
}

.frame {
	width: 100%;
	height: 100dvh;
	border: none;
}
</style>
