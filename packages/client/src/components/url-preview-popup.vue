<template>
<div class="fgmtyycl" :style="{ zIndex, top: top + 'px', left: left + 'px' }">
	<transition :name="$store.state.animation ? 'zoom' : ''" @after-leave="$emit('closed')">
		<MkUrlPreview v-if="showing" class="_popup _shadow" :url="url"/>
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
			zIndex: os.claimZIndex('middle'),
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
	width: 500px;
	max-width: calc(90vw - 12px);
	pointer-events: none;
}
</style>
