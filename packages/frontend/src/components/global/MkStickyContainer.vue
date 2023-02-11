<template>
<div ref="rootEl">
	<div ref="beforeEl">
		<slot name="beforeHeader"></slot>
	</div>
	<div ref="headerEl">
		<slot name="header"></slot>
	</div>
	<div ref="bodyEl" :data-sticky-container-header-height="headerHeight">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
// なんか動かない
//const CURRENT_STICKY_TOP = Symbol('CURRENT_STICKY_TOP');
const CURRENT_STICKY_TOP = 'CURRENT_STICKY_TOP';
</script>

<script lang="ts" setup>
import { onMounted, onUnmounted, provide, inject, Ref, ref, watch } from 'vue';

const rootEl = $shallowRef<HTMLElement>();
const headerEl = $shallowRef<HTMLElement>();
const bodyEl = $shallowRef<HTMLElement>();

let headerHeight = $ref<string | undefined>();
let childStickyTop = $ref(0);
const parentStickyTop = inject<Ref<number>>(CURRENT_STICKY_TOP, ref(0));
provide(CURRENT_STICKY_TOP, $$(childStickyTop));

const calc = () => {
	if (!headerEl) return;
	childStickyTop = parentStickyTop.value + headerEl.offsetHeight;
	headerHeight = headerEl.offsetHeight.toString();
};

const observer = new ResizeObserver(() => {
	window.setTimeout(() => {
		calc();
	}, 100);
});

onMounted(() => {
	calc();

	watch(parentStickyTop, calc);

	watch($$(childStickyTop), () => {
		if (!bodyEl) return;
		bodyEl.style.setProperty('--stickyTop', `${childStickyTop}px`);
	}, {
		immediate: true,
	});

	if (headerEl) {
		headerEl.style.position = 'sticky';
		headerEl.style.top = 'var(--stickyTop, 0)';
		headerEl.style.zIndex = '1000';

		observer.observe(headerEl);
	}
});

onUnmounted(() => {
	observer.disconnect();
});
</script>

<style lang="scss" module>

</style>
