<template>
<div ref="root" :class="$style.root" :style="{ padding: margin + 'px' }">
	<div ref="content" :class="$style.content">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';

export default defineComponent({
	props: {
		contentMax: {
			type: Number,
			required: false,
			default: null,
		}
	},

	setup(props, context) {
		let ro: ResizeObserver;
		const root = ref<HTMLElement>(null);
		const content = ref<HTMLElement>(null);
		const margin = ref(0);
		const adjust = (rect: { width: number; height: number; }) => {
			if (rect.width > (props.contentMax || 500)) {
				margin.value = 32;
			} else {
				margin.value = 12;
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
					width: root.value.offsetWidth,
					height: root.value.offsetHeight,
				});
			});
			ro.observe(root.value);

			if (props.contentMax) {
				content.value.style.maxWidth = `${props.contentMax}px`;
			}
		});

		onUnmounted(() => {
			ro.disconnect();
		});

		return {
			root,
			content,
			margin,
		};
	},
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
