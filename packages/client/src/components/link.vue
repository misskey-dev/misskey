<template>
<component :is="self ? 'MkA' : 'a'" class="xlcxczvw _link" :[attr]="self ? url.substr(local.length) : url" :rel="rel" :target="target"
	:title="url"
	@mouseover="onMouseover"
	@mouseleave="onMouseleave"
>
	<slot></slot>
	<i v-if="target === '_blank'" class="fas fa-external-link-square-alt icon"></i>
</component>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { url as local } from '@/config';
import { isTouchUsing } from '@/scripts/touch';
import * as os from '@/os';

export default defineComponent({
	props: {
		url: {
			type: String,
			required: true,
		},
		rel: {
			type: String,
			required: false,
		}
	},
	data() {
		const self = this.url.startsWith(local);
		return {
			local,
			self: self,
			attr: self ? 'to' : 'href',
			target: self ? null : '_blank',
			showTimer: null,
			hideTimer: null,
			checkTimer: null,
			close: null,
		};
	},
	methods: {
		async showPreview() {
			if (!document.body.contains(this.$el)) return;
			if (this.close) return;

			const { dispose } = await os.popup(import('@/components/url-preview-popup.vue'), {
				url: this.url,
				source: this.$el
			});

			this.close = () => {
				dispose();
			};

			this.checkTimer = setInterval(() => {
				if (!document.body.contains(this.$el)) this.closePreview();
			}, 1000);
		},
		closePreview() {
			if (this.close) {
				clearInterval(this.checkTimer);
				this.close();
				this.close = null;
			}
		},
		onMouseover() {
			if (isTouchUsing) return;
			clearTimeout(this.showTimer);
			clearTimeout(this.hideTimer);
			this.showTimer = setTimeout(this.showPreview, 500);
		},
		onMouseleave() {
			if (isTouchUsing) return;
			clearTimeout(this.showTimer);
			clearTimeout(this.hideTimer);
			this.hideTimer = setTimeout(this.closePreview, 500);
		}
	}
});
</script>

<style lang="scss" scoped>
.xlcxczvw {
	word-break: break-all;

	> .icon {
		padding-left: 2px;
		font-size: .9em;
	}
}
</style>
