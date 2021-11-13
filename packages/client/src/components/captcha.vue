<template>
<div>
	<span v-if="!available">{{ $ts.waiting }}<MkEllipsis/></span>
	<div ref="captcha"></div>
</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

type Captcha = {
	render(container: string | Node, options: {
		readonly [_ in 'sitekey' | 'theme' | 'type' | 'size' | 'tabindex' | 'callback' | 'expired' | 'expired-callback' | 'error-callback' | 'endpoint']?: unknown;
	}): string;
	remove(id: string): void;
	execute(id: string): void;
	reset(id: string): void;
	getResponse(id: string): string;
};

type CaptchaProvider = 'hcaptcha' | 'recaptcha';

type CaptchaContainer = {
	readonly [_ in CaptchaProvider]?: Captcha;
};

declare global {
	interface Window extends CaptchaContainer {
	}
}

export default defineComponent({
	props: {
		provider: {
			type: String as PropType<CaptchaProvider>,
			required: true,
		},
		sitekey: {
			type: String,
			required: true,
		},
		modelValue: {
			type: String,
		},
	},

	data() {
		return {
			available: false,
		};
	},

	computed: {
		variable(): string {
			switch (this.provider) {
				case 'hcaptcha': return 'hcaptcha';
				case 'recaptcha': return 'grecaptcha';
			}
		},
		loaded(): boolean {
			return !!window[this.variable];
		},
		src(): string {
			const endpoint = ({
				hcaptcha: 'https://hcaptcha.com/1',
				recaptcha: 'https://www.recaptcha.net/recaptcha',
			} as Record<CaptchaProvider, string>)[this.provider];

			return `${typeof endpoint === 'string' ? endpoint : 'about:invalid'}/api.js?render=explicit`;
		},
		captcha(): Captcha {
			return window[this.variable] || {} as unknown as Captcha;
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
			if (this.captcha?.reset) this.captcha.reset();
		},
		requestRender() {
			if (this.captcha.render && this.$refs.captcha instanceof Element) {
				this.captcha.render(this.$refs.captcha, {
					sitekey: this.sitekey,
					theme: this.$store.state.darkMode ? 'dark' : 'light',
					callback: this.callback,
					'expired-callback': this.callback,
					'error-callback': this.callback,
				});
			} else {
				setTimeout(this.requestRender.bind(this), 1);
			}
		},
		callback(response?: string) {
			this.$emit('update:modelValue', typeof response == 'string' ? response : null);
		},
	},
});
</script>
