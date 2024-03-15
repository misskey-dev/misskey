<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<span v-if="!available">Loading<MkEllipsis/></span>
	<div v-if="props.provider == 'mcaptcha'">
		<div id="mcaptcha__widget-container" class="m-captcha-style"></div>
		<div ref="captchaEl"></div>
	</div>
	<div v-else ref="captchaEl"></div>
</div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, watch, onUnmounted } from 'vue';
import { defaultStore } from '@/store.js';

// APIs provided by Captcha services
export type Captcha = {
	render(container: string | Node, options: {
		readonly [_ in 'sitekey' | 'theme' | 'type' | 'size' | 'tabindex' | 'callback' | 'expired' | 'expired-callback' | 'error-callback' | 'endpoint']?: unknown;
	}): string;
	remove(id: string): void;
	execute(id: string): void;
	reset(id?: string): void;
	getResponse(id: string): string;
};

export type CaptchaProvider = 'hcaptcha' | 'recaptcha' | 'turnstile' | 'mcaptcha';

type CaptchaContainer = {
	readonly [_ in CaptchaProvider]?: Captcha;
};

declare global {
	interface Window extends CaptchaContainer { }
}

const props = defineProps<{
	provider: CaptchaProvider;
	sitekey: string | null; // null will show error on request
	instanceUrl?: string | null;
	modelValue?: string | null;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', v: string | null): void;
}>();

const available = ref(false);

const captchaEl = shallowRef<HTMLDivElement | undefined>();

const variable = computed(() => {
	switch (props.provider) {
		case 'hcaptcha': return 'hcaptcha';
		case 'recaptcha': return 'grecaptcha';
		case 'turnstile': return 'turnstile';
		case 'mcaptcha': return 'mcaptcha';
	}
});

const loaded = !!window[variable.value];

const src = computed(() => {
	switch (props.provider) {
		case 'hcaptcha': return 'https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off';
		case 'recaptcha': return 'https://www.recaptcha.net/recaptcha/api.js?render=explicit';
		case 'turnstile': return 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
		case 'mcaptcha': return null;
	}
});

const scriptId = computed(() => `script-${props.provider}`);

const captcha = computed<Captcha>(() => window[variable.value] || {} as unknown as Captcha);

if (loaded || props.provider === 'mcaptcha') {
	available.value = true;
} else if (src.value !== null) {
	(document.getElementById(scriptId.value) ?? document.head.appendChild(Object.assign(document.createElement('script'), {
		async: true,
		id: scriptId.value,
		src: src.value,
	})))
		.addEventListener('load', () => available.value = true);
}

function reset() {
	if (captcha.value.reset) captcha.value.reset();
}

async function requestRender() {
	if (captcha.value.render && captchaEl.value instanceof Element) {
		captcha.value.render(captchaEl.value, {
			sitekey: props.sitekey,
			theme: defaultStore.state.darkMode ? 'dark' : 'light',
			callback: callback,
			'expired-callback': callback,
			'error-callback': callback,
		});
	} else if (props.provider === 'mcaptcha' && props.instanceUrl && props.sitekey) {
		const { default: Widget } = await import('@mcaptcha/vanilla-glue');
		// @ts-expect-error avoid typecheck error
		new Widget({
			siteKey: {
				instanceUrl: new URL(props.instanceUrl),
				key: props.sitekey,
			},
		});
	} else {
		window.setTimeout(requestRender, 1);
	}
}

function callback(response?: string) {
	emit('update:modelValue', typeof response === 'string' ? response : null);
}

function onReceivedMessage(message: MessageEvent) {
	if (message.data.token) {
		if (props.instanceUrl && new URL(message.origin).host === new URL(props.instanceUrl).host) {
			callback(message.data.token);
		}
	}
}

onMounted(() => {
	if (available.value) {
		window.addEventListener('message', onReceivedMessage);
		requestRender();
	} else {
		watch(available, requestRender);
	}
});

onUnmounted(() => {
	window.removeEventListener('message', onReceivedMessage);
});

onBeforeUnmount(() => {
	reset();
});

defineExpose({
	reset,
});

</script>
