<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	TODO
</div>
</template>

<script lang="ts" setup>
import { ensureSignin } from '@/i';

const $i = ensureSignin();
</script>

<style lang="scss" module>
.root {
	padding: 16px;
}
</style>
