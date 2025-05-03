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
	<Transition
		:enterActiveClass="$style.transition_x_enterActive"
		:leaveActiveClass="$style.transition_x_leaveActive"
		:enterFromClass="$style.transition_x_enterFrom"
		:leaveToClass="$style.transition_x_leaveTo"
	>
		<div v-if="!isTest && !iframeLoaded" :class="$style.loader">
			<div :class="$style.loaderInner" class="_gaps">
				<MkLoading/>
				<div
					class="_gaps"
					:class="[$style.fallback, { [$style.fallbackShow]: isTakingTooLong }]"
				>
					<div>{{ i18n.ts._hana.takingTooLongToLoad }}</div>
					<div class="_buttonsCenter">
						<MkButton rounded gradate @click="signup">{{ i18n.ts.joinThisServer }}</MkButton>
						<MkButton rounded @click="signin">{{ i18n.ts.login }}</MkButton>
					</div>
				</div>
			</div>
		</div>
	</Transition>
</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, ref, watch } from 'vue';
import { instance } from '@/instance.js';
import { miLocalStorage } from '@/local-storage.js';
import { store } from '@/store.js';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';
import * as os from '@/os.js';

import MkButton from '@/components/MkButton.vue';
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

const iframeLoaded = ref(false);

function onFrameLoad() {
	if (!iframeLoaded.value) {
		iframeLoaded.value = true;
	} else if (frameEl.value) {
		frameEl.value.src = frameUrl;
		iframeLoaded.value = false;
	}
	frameEl.value?.contentWindow?.postMessage({
		type: 'hanamisskey:meta',
		payload: {
			colorMode: store.s.darkMode ? 'dark' : 'light',
			instance: JSON.parse(JSON.stringify(instance)),
		},
	}, 'https://frame-static-assets.misskey.flowers');
}

const isTakingTooLong = ref(false);
let timeoutId: number | null = null;
watch(iframeLoaded, (to) => {
	if (!to) {
		if (timeoutId) {
			window.clearTimeout(timeoutId);
		}
		timeoutId = window.setTimeout(() => {
			isTakingTooLong.value = true;
		}, 5000);
	} else {
		if (timeoutId) {
			window.clearTimeout(timeoutId);
			timeoutId = null;
		}
		isTakingTooLong.value = false;
	}
}, { immediate: true });

watch(store.r.darkMode, (to) => {
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
	position: relative;
	height: 100dvh;
	overflow: hidden;
	overflow: clip;
}

.frame {
	width: 100%;
	height: 100dvh;
	border: none;
}

.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s ease;
}

.transition_x_enterFrom,
.transition_x_leaveTo {
	opacity: 0;
}

.loader {
	position: fixed;
	top: 0;
	left: 0;
	width: 100dvw;
	height: 100dvh;
	background: var(--MI_THEME-bg);
	display: flex;
	align-items: center;
}

.loaderInner {
	margin: 0 auto;
	padding: 24px;
	text-align: center;
}

.fallback {
	visibility: hidden;
	opacity: 0;
	transition: visibility 0s, opacity 0.3s ease;
}

.fallbackShow {
	visibility: visible;
	opacity: 1;
}
</style>
