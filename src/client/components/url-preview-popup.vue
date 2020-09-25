<template>
<div class="fgmtyycl _shadow" :style="{ top: top + 'px', left: left + 'px' }">
	<transition name="zoom" @after-leave="$emit('closed')">
		<MkUrlPreview :url="url" v-if="showing"/>
	</transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkUrlPreview from './url-preview.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkUrlPreview
	},

	props: {
		url: {
			type: String,
			required: true
		},
		source: {
			required: true
		},
		showing: {
			type: Boolean,
			required: true
		},
	},

	data() {
		return {
			u: null,
			top: 0,
			left: 0,
		};
	},

	mounted() {
		const rect = this.source.getBoundingClientRect();
		const x = Math.max((rect.left + (this.source.offsetWidth / 2)) - (300 / 2), 6) + window.pageXOffset;
		const y = rect.top + this.source.offsetHeight + window.pageYOffset;

		this.top = y;
		this.left = x;
	},
});
</script>

<style lang="scss" scoped>
.fgmtyycl {
	position: absolute;
	z-index: 11000;
	width: 500px;
	max-width: calc(90vw - 12px);
	overflow: hidden;
	pointer-events: none;
	background: var(--bg);
	border-radius: var(--radius);
}
</style>
