<template>
<div>
	<span v-if="!available">{{ $t('waiting') }}<mk-ellipsis/></span>
	<div ref="captcha"></div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

type Captcha = {
	render(container: string | Node, options: {
		readonly [_ in 'sitekey' | 'theme' | 'type' | 'size' | 'tabindex' | 'callback' | 'expired' | 'expired-callback' | 'error-callback' | 'endpoint']?: unknown;
	}): string;
	remove(id: string): void;
	execute(id: string): void;
	reset(id: string): void;
	getResponse(id: string): string;
};

type CaptchaProvider = 'hcaptcha' | 'grecaptcha';

type CaptchaContainer = {
	readonly [_ in CaptchaProvider]?: Captcha;
};

declare global {
	interface Window extends CaptchaContainer {
	}
}
import * as os from '@/os';

export default defineComponent({
	props: {
		provider: {
			type: String,
			required: true,
		},
		sitekey: {
			type: String,
			required: true,
		},
		value: {
			type: String,
		},
	},

	data() {
		return {
			available: false,
		};
	},

	computed: {
		loaded() {
			return !!window[this.provider as CaptchaProvider];
		},
		src() {
			const endpoint = ({
				hcaptcha: 'https://hcaptcha.com/1',
				grecaptcha: 'https://www.google.com/recaptcha',
			} as Record<PropertyKey, unknown>)[this.provider];

			return `${typeof endpoint == 'string' ? endpoint : 'about:invalid'}/api.js?render=explicit`;
		},
		captcha() {
			return window[this.provider as CaptchaProvider] || {} as unknown as Captcha;
		},
	},

	created() {
		if (this.loaded) {
			this.available = true;
		} else {
			(document.getElementById(this.provider) || document.head.appendChild(Object.assign(document.createElement('script'), {
				async: true,
				id: this.provider,
				src: this.src,
			})))
				.addEventListener('load', () => this.available = true);
		}
	},

	mounted() {
		if (this.available) {
			this.requestRender();
		} else {
			this.$watch('available', this.requestRender);
		}
	},

	beforeUnmount() {
		this.reset();
	},

	methods: {
		reset() {
			this.captcha?.reset();
		},
		requestRender() {
			if (this.captcha.render && this.$refs.captcha instanceof Element) {
				this.captcha.render(this.$refs.captcha, {
					sitekey: this.sitekey,
					theme: this.$store.state.device.darkMode ? 'dark' : 'light',
					callback: this.callback,
					'expired-callback': this.callback,
					'error-callback': this.callback,
				});
			} else {
				setTimeout(this.requestRender.bind(this), 1);
			}
		},
		callback(response?: string) {
			this.$emit('update:value', typeof response == 'string' ? response : null);
		},
	},
});
</script>
