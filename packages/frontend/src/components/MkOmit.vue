<template>
<div ref="content" :class="[$style.content, { [$style.omitted]: omitted }]">
	<slot></slot>
	<button v-if="omitted" :class="$style.fade" class="_button" @click="() => { ignoreOmit = true; omitted = false; }">
		<span :class="$style.fadeLabel">{{ $ts.showMore }}</span>
	</button>
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';

const props = withDefaults(defineProps<{
	maxHeight: number;
}>(), {
	maxHeight: 200,
});

let content = $ref<HTMLElement>();
let omitted = $ref(false);
let ignoreOmit = $ref(false);

onMounted(() => {
	const calcOmit = () => {
		if (omitted || ignoreOmit) return;
		omitted = content.offsetHeight > props.maxHeight;
	};

	calcOmit();
	new ResizeObserver((entries, observer) => {
		calcOmit();
	}).observe(content);
});
</script>

<style lang="scss" module>
.content {
	--stickyTop: 0px;

	&.omitted {
		position: relative;
		max-height: v-bind("props.maxHeight + 'px'");
		overflow: hidden;

		> .fade {
			display: block;
			position: absolute;
			z-index: 10;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			background: linear-gradient(0deg, var(--panel), var(--X15));

			> .fadeLabel {
				display: inline-block;
				background: var(--panel);
				padding: 6px 10px;
				font-size: 0.8em;
				border-radius: 999px;
				box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
			}

			&:hover {
				> .fadeLabel {
					background: var(--panelHighlight);
				}
			}
		}
	}
}
</style>
