<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root]" class="_gaps">
	<img v-if="type === 'empty' && instance.infoImageUrl" :src="instance.infoImageUrl" draggable="false" :class="$style.img"/>
	<i v-else-if="type === 'empty'" class="ti ti-info-circle" :class="$style.icon"></i>
	<div>{{ props.text ?? (type === 'empty' ? i18n.ts.nothing : type === 'notFound' ? i18n.ts.notFound : null) }}</div>
	<slot></slot>
</div>
</template>

<script lang="ts" setup>
import {} from 'vue';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	type: 'empty' | 'notFound' | 'error';
	text?: string;
}>();
</script>

<style lang="scss" module>
.root {
	position: relative;
	text-align: center;
	padding: 32px;
}

.img {
	vertical-align: bottom;
	height: 128px;
	margin-bottom: 16px;
	border-radius: 16px;
}

.icon {
	font-size: 24px;
	margin: 0 auto;
}
</style>
