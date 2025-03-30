<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.contents">
		<div style="flex: 1; min-height: 0;">
			<RouterView/>
		</div>

		<!--
			デッキUIが設定されている場合はデッキUIに戻れるようにする (ただし?zenが明示された場合は表示しない)
			See https://github.com/misskey-dev/misskey/issues/10905
		-->
		<div v-if="showBottom" :class="$style.bottom">
			<button v-tooltip="i18n.ts.goToMisskey" :class="['_button', '_shadow', $style.button]" @click="goToMisskey"><i class="ti ti-home"></i></button>
		</div>
	</div>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { computed, provide, ref } from 'vue';
import { instanceName, ui } from '@@/js/config.js';
import XCommon from './_common_/common.vue';
import type { PageMetadata } from '@/page.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@/page.js';
import { i18n } from '@/i18n.js';
import { mainRouter } from '@/router.js';
import { DI } from '@/di.js';

const isRoot = computed(() => mainRouter.currentRoute.value.name === 'index');

const pageMetadata = ref<null | PageMetadata>(null);

const showBottom = !(new URLSearchParams(window.location.search)).has('zen') && ui === 'deck';

provide(DI.router, mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
	if (pageMetadata.value) {
		if (isRoot.value && pageMetadata.value.title === instanceName) {
			window.document.title = pageMetadata.value.title;
		} else {
			window.document.title = `${pageMetadata.value.title} | ${instanceName}`;
		}
	}
});
provideReactiveMetadata(pageMetadata);

function goToMisskey() {
	window.location.href = '/';
}
</script>

<style lang="scss" module>
.root {
}

.contents {
	display: flex;
	flex-direction: column;
	height: 100dvh;
}

.bottom {
	height: calc(60px + (var(--MI-margin) * 2) + env(safe-area-inset-bottom, 0px));
	width: 100%;
	margin-top: auto;
}

.button {
	padding: 0;
	aspect-ratio: 1;
	width: 100%;
	max-width: 60px;
	margin: auto;
	border-radius: 100%;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	right: var(--MI-margin);
	bottom: calc(var(--MI-margin) + env(safe-area-inset-bottom, 0px));
}
</style>
