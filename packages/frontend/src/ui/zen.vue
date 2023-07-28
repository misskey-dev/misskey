<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="showBottom ? $style.rootWithBottom : $style.root">
	<div style="container-type: inline-size;">
		<RouterView/>
	</div>

	<XCommon/>
</div>

<!--
	デッキUIが設定されている場合はデッキUIに戻れるようにする (ただし?zenが明示された場合は表示しない)
	See https://github.com/misskey-dev/misskey/issues/10905
-->
<div v-if="showBottom" :class="$style.bottom">
	<button v-tooltip="i18n.ts.goToMisskey" :class="['_button', '_shadow', $style.button]" @click="goToMisskey"><i class="ti ti-home"></i></button>
</div>
</template>

<script lang="ts" setup>
import { provide, ComputedRef } from 'vue';
import XCommon from './_common_/common.vue';
import { mainRouter } from '@/router';
import { PageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata';
import { instanceName, ui } from '@/config';
import { i18n } from '@/i18n';

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();

const showBottom = !(new URLSearchParams(location.search)).has('zen') && ui === 'deck';

provide('router', mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata = info;
	if (pageMetadata.value) {
		document.title = `${pageMetadata.value.title} | ${instanceName}`;
	}
});

function goToMisskey() {
	window.location.href = '/';
}

document.documentElement.style.overflowY = 'scroll';
</script>

<style lang="scss" module>
.root {
	min-height: 100dvh;
	box-sizing: border-box;
}

.rootWithBottom {
	min-height: calc(100dvh - (60px + (var(--margin) * 2) + env(safe-area-inset-bottom, 0px)));
	box-sizing: border-box;
}

.bottom {
	height: calc(60px + (var(--margin) * 2) + env(safe-area-inset-bottom, 0px));
	width: 100%;
	margin-top: auto;
}

.button {
	position: fixed !important;
	padding: 0;
	aspect-ratio: 1;
	width: 100%;
	max-width: 60px;
	margin: auto;
	border-radius: 100%;
	background: var(--panel);
	color: var(--fg);
	right: var(--margin);
	bottom: calc(var(--margin) + env(safe-area-inset-bottom, 0px));
}
</style>
