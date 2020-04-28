<template>
	<div ref="hCaptcha"></div>
</template>

<script lang="ts">
import Vue from 'vue';

declare global {
	interface Window {
		hcaptcha?: {
			render(container: string | Node, options: {
				readonly [_ in 'sitekey' | 'theme' | 'type' | 'size' | 'tabindex' | 'callback' | 'expired' | 'expired-callback' | 'error-callback' | 'endpoint']?: unknown;
			}): string;
			remove(id: string): void;
			execute(id: string): void;
			reset(id: string): void;
			getResponse(id: string): string;
		};
	}
}

export default Vue.extend({
	props: {
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

	created() {
		if (window.hcaptcha) { // loaded
			this.available = true;
		} else {
			const alreadyLoading = document.getElementById('hcaptcha');

			if (alreadyLoading) { // loading
				alreadyLoading.addEventListener('load', () => this.available = true);

				return;
			} // init

			const script = document.createElement('script');
			script.addEventListener('load', () => this.available = true);
			script.async = true;
			script.id = 'hcaptcha';
			script.src = 'https://hcaptcha.com/1/api.js?render=explicit';
			document.head.appendChild(script);
		}
	},

	mounted() {
		if (this.available) {
			this.render();
		} else {
			this.$watch('available', this.render);
		}
	},

	methods: {
		render() {
			if (this.$refs.hCaptcha instanceof Element) {
				window.hcaptcha!.render(this.$refs.hCaptcha, {
					sitekey: this.sitekey,
					theme: this.$store.state.device.darkMode ? 'dark' : 'light',
					callback: this.callback,
					'expired-callback': this.callback,
					'error-callback': this.callback,
				});
			}
		},
		callback(response?: string) {
			this.$emit('input', typeof response == 'string' ? response : null);
		},
	},
});
</script>
