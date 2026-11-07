<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkAnimBg style="position: absolute;"/>
	<div class="_pageScrollable" :class="$style.body">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import MkAnimBg from '@/components/MkAnimBg.vue';
</script>

<style lang="scss" module>
.body {
	position: absolute;
	top: 0;
	width: 100%;
	height: 100%;

	// _pageScrollable はパフォーマンス上の理由で背景色が設定されているため
	background: transparent !important;
}
</style>
