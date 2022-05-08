<template>
<div ref="rootEl">
	<slot name="header"></slot>
	<div ref="bodyEl" :data-sticky-container-header-height="headerHeight">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
	autoSticky?: boolean;
}>(), {
	autoSticky: false,
})

const rootEl = $ref<HTMLElement>();
const bodyEl = $ref<HTMLElement>();

let headerHeight = $ref<string | undefined>();

const calc = () => {
	const currentStickyTop = getComputedStyle(rootEl).getPropertyValue('--stickyTop') || '0px';

	const header = rootEl.children[0] as HTMLElement;
	if (header === bodyEl) {
		bodyEl.style.setProperty('--stickyTop', currentStickyTop);
	} else {
		bodyEl.style.setProperty('--stickyTop', `calc(${currentStickyTop} + ${header.offsetHeight}px)`);
		headerHeight = header.offsetHeight.toString();

		if (props.autoSticky) {
			header.style.setProperty('--stickyTop', currentStickyTop);
			header.style.position = 'sticky';
			header.style.top = 'var(--stickyTop)';
			header.style.zIndex = '1';
		}
	}
};

const observer = new MutationObserver(() => {
	window.setTimeout(() => {
		calc();
	}, 100);
});

onMounted(() => {
	calc();

	observer.observe(rootEl, {
		attributes: false,
		childList: true,
		subtree: false,
	});
});

onUnmounted(() => {
	observer.disconnect();
});
</script>

<style lang="scss" module>

</style>
