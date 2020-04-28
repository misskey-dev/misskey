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
			(document.getElementById('hcaptcha') || document.head.appendChild(Object.assign(document.createElement('script'), {
				async: true,
				id: 'hcaptcha',
				src: 'https://hcaptcha.com/1/api.js?render=explicit',
			})))
				.addEventListener('load', () => this.available = true);
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
