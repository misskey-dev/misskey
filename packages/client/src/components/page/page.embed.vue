<template>
<div class="rfbysshq" :style="frameStyle">
	<iframe v-if="isURL" class="wrapped-iframe" allow="fullscreen" name="Page Contents in HTML" :src="src ?? undefined" sandbox="">
		😢{{ $ts.pageLoadError }}
	</iframe>
	<iframe v-if="!isURL" class="wrapped-iframe" allow="fullscreen" name="Page Contents from a URL" :srcdoc="src ?? undefined" sandbox="">
		😢{{ $ts.pageLoadError }}
	</iframe>
</div>
</template>

<script lang="ts">
import { EmbedBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
	components: {
	},
	props: {
		block: {
			type: Object as PropType<EmbedBlock>,
			required: true
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true
		},
	},
	data() {
		return {
			isURL: !!this.block.url,
			src: this.hpml.interpolate(this.block.url ? this.block.url : this.block.srcdoc ?? 'NULL'),
			frameStyle: {
				height: `${this.block.height ?? window.innerHeight}px`,
				'background-color': this.block.backgroundColor ?? 'white', // TODO replace 'white' with theme background color
			},
		};
	},
});
</script>

<style lang="scss" scoped>
.rfbysshq {
	position: relative;
	overflow: hidden;

	&:not(:first-child) {
		margin-top: 0.5em;
	}

	&:not(:last-child) {
		margin-bottom: 0.5em;
	}

	.wrapped-iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}
}
</style>
