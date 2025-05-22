<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<MkClickerGame/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import MkClickerGame from '@/components/MkClickerGame.vue';
import { definePage } from '@/page.js';

definePage(() => ({
	title: '🍪👈',
	icon: 'ti ti-cookie',
}));
</script>

<style lang="scss" module>

</style>
