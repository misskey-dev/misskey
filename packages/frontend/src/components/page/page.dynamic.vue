<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 動的ページのブロックの代替。利用できないということを表示する -->
<template>
<div :class="$style.root">
	<div :class="$style.heading"><i class="ti ti-dice-5"></i> {{ i18n.ts._pages.blocks.dynamic }}</div>
	<I18n :src="i18n.ts._pages.blocks.dynamicDescription" tag="div" :class="$style.text">
		<template #play>
			<MkA to="/play" class="_link">Play</MkA>
		</template>
	</I18n>
</div>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	block: Misskey.entities.PageBlock,
	page: Misskey.entities.Page,
}>();
</script>

<style lang="scss" module>
.root {
	border: 1px solid var(--divider);
	border-radius: var(--radius);
	padding: var(--margin);
	text-align: center;
}

.heading {
	font-weight: 700;
}

.text {
	font-size: 90%;
}
</style>
