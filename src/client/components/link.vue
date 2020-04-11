<template>
<component :is="self ? 'router-link' : 'a'" class="xlcxczvw _link" :[attr]="self ? url.substr(local.length) : url" :rel="rel" :target="target"
	@mouseover="onMouseover"
	@mouseleave="onMouseleave"
	:title="url"
>
	<slot></slot>
	<fa :icon="faExternalLinkSquareAlt" v-if="target === '_blank'" class="icon"/>
</component>
</template>

<script lang="ts">
import Vue from 'vue';
import { faExternalLinkSquareAlt } from '@fortawesome/free-solid-svg-icons';
import { url as local } from '../config';
import MkUrlPreview from './url-preview-popup.vue';
import { isDeviceTouch } from '../scripts/is-device-touch'

export default Vue.extend({
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
			preview: null,
			faExternalLinkSquareAlt
		};
	},
	methods: {
		showPreview() {
			if (!document.body.contains(this.$el)) return;
			if (this.preview) return;

			this.preview = new MkUrlPreview({
				parent: this,
				propsData: {
					url: this.url,
					source: this.$el
				}
			}).$mount();

			document.body.appendChild(this.preview.$el);
		},
		closePreview() {
			if (this.preview) {
				this.preview.destroyDom();
				this.preview = null;
			}
		},
		onMouseover() {
			if (isDeviceTouch()) return;
			clearTimeout(this.showTimer);
			clearTimeout(this.hideTimer);
			this.showTimer = setTimeout(this.showPreview, 500);
		},
		onMouseleave() {
			if (isDeviceTouch()) return;
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
		font-weight: 400;
		font-style: normal;
	}
}
</style>
