<template>
<div class="rfbysshq" :style="frameStyle">
	<iframe v-if="embedType === 'URL'" class="wrapped-iframe" allow="fullscreen" name="Page Contents in HTML" :src="src ?? undefined" sandbox="">
		😢{{ $ts.pageLoadError }}
	</iframe>
	<iframe v-if="embedType === 'HTML'" class="wrapped-iframe" allow="fullscreen" name="Page Contents from a URL" :srcdoc="src ?? undefined" sandbox="">
		😢{{ $ts.pageLoadError }}
	</iframe>
</div>
</template>

<script lang="ts">
import { EmbedBlock } from '@/scripts/hpml/block';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
	components: {
	},
	props: {
		block: {
			type: Object as PropType<EmbedBlock>,
			required: true
		},
	},
	data() {
		return {
			embedType: this.block.embedType,
			src: (this.block.embedType === 'URL' ? this.block.url : this.block.srcdoc) ?? 'NULL',
			frameStyle: {
				height: `${this.block.height ?? window.innerHeight}px`,
				'background-color': this.block.backgroundColor,
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
