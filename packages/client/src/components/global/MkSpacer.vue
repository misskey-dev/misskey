<template>
<div ref="root" :class="$style.root" :style="{ padding: margin + 'px' }">
	<div ref="content" :class="$style.content">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import { inject, onMounted, onUnmounted, ref } from 'vue';
import { deviceKind } from '@/scripts/device-kind';

const props = withDefaults(defineProps<{
	contentMax?: number | null;
	marginMin?: number;
	marginMax?: number;
}>(), {
	contentMax: null,
	marginMin: 12,
	marginMax: 24,
});

let ro: ResizeObserver;
let root = $ref<HTMLElement>();
let content = $ref<HTMLElement>();
let margin = $ref(0);
const shouldSpacerMin = inject('shouldSpacerMin', false);

const adjust = (rect: { width: number; height: number; }) => {
	if (shouldSpacerMin || deviceKind === 'smartphone') {
		margin = props.marginMin;
		return;
	}

	if (rect.width > (props.contentMax ?? 0) || (rect.width > 360 && window.innerWidth > 400)) {
		margin = props.marginMax;
	} else {
		margin = props.marginMin;
	}
};

onMounted(() => {
	ro = new ResizeObserver((entries) => {
		/* iOSが対応していない
		adjust({
			width: entries[0].borderBoxSize[0].inlineSize,
			height: entries[0].borderBoxSize[0].blockSize,
		});
		*/
		adjust({
			width: root!.offsetWidth,
			height: root!.offsetHeight,
		});
	});
	ro.observe(root!);

	if (props.contentMax) {
		content!.style.maxWidth = `${props.contentMax}px`;
	}
});

onUnmounted(() => {
	ro.disconnect();
});
</script>

<style lang="scss" module>
.root {
	box-sizing: border-box;
	width: 100%;
}

.content {
	margin: 0 auto;
}
</style>
