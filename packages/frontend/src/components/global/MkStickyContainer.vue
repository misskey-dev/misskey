<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl">
	<div ref="headerEl">
		<slot name="header"></slot>
	</div>
	<div ref="bodyEl" :data-sticky-container-header-height="headerHeight">
		<slot></slot>
	</div>
	<div ref="footerEl">
		<slot name="footer"></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, provide, inject, Ref, ref, watch, shallowRef } from 'vue';

import { CURRENT_STICKY_BOTTOM, CURRENT_STICKY_TOP } from '@/const.js';

const rootEl = shallowRef<HTMLElement>();
const headerEl = shallowRef<HTMLElement>();
const footerEl = shallowRef<HTMLElement>();
const bodyEl = shallowRef<HTMLElement>();

const headerHeight = ref<string | undefined>();
const childStickyTop = ref(0);
const parentStickyTop = inject<Ref<number>>(CURRENT_STICKY_TOP, ref(0));
provide(CURRENT_STICKY_TOP, childStickyTop);

const footerHeight = ref<string | undefined>();
const childStickyBottom = ref(0);
const parentStickyBottom = inject<Ref<number>>(CURRENT_STICKY_BOTTOM, ref(0));
provide(CURRENT_STICKY_BOTTOM, childStickyBottom);

const calc = () => {
	// コンポーネントが表示されてないけどKeepAliveで残ってる場合などは null になる
	if (headerEl.value != null) {
		childStickyTop.value = parentStickyTop.value + headerEl.value.offsetHeight;
		headerHeight.value = headerEl.value.offsetHeight.toString();
	}

	// コンポーネントが表示されてないけどKeepAliveで残ってる場合などは null になる
	if (footerEl.value != null) {
		childStickyBottom.value = parentStickyBottom.value + footerEl.value.offsetHeight;
		footerHeight.value = footerEl.value.offsetHeight.toString();
	}
};

const observer = new ResizeObserver(() => {
	window.setTimeout(() => {
		calc();
	}, 100);
});

onMounted(() => {
	calc();

	watch([parentStickyTop, parentStickyBottom], calc);

	watch(childStickyTop, () => {
		bodyEl.value.style.setProperty('--stickyTop', `${childStickyTop.value}px`);
	}, {
		immediate: true,
	});

	watch(childStickyBottom, () => {
		bodyEl.value.style.setProperty('--stickyBottom', `${childStickyBottom.value}px`);
	}, {
		immediate: true,
	});

	headerEl.value.style.position = 'sticky';
	headerEl.value.style.top = 'var(--stickyTop, 0)';
	headerEl.value.style.zIndex = '1000';

	footerEl.value.style.position = 'sticky';
	footerEl.value.style.bottom = 'var(--stickyBottom, 0)';
	footerEl.value.style.zIndex = '1000';

	observer.observe(headerEl.value);
	observer.observe(footerEl.value);
});

onUnmounted(() => {
	observer.disconnect();
});

defineExpose({
	rootEl: rootEl,
});
</script>
