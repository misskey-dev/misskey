<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition :name="prefer.s.animation ? '_transition_zoom' : ''" appear>
	<div :class="$style.root" class="_gaps">
		<img v-if="type === 'empty' && instance.infoImageUrl" :src="instance.infoImageUrl" draggable="false" :class="$style.img"/>
		<MkSystemIcon v-else-if="type === 'empty'" type="info" :class="$style.icon"/>
		<img v-if="type === 'notFound' && instance.notFoundImageUrl" :src="instance.notFoundImageUrl" draggable="false" :class="$style.img"/>
		<MkSystemIcon v-else-if="type === 'notFound'" type="question" :class="$style.icon"/>
		<img v-if="type === 'error' && instance.serverErrorImageUrl" :src="instance.serverErrorImageUrl" draggable="false" :class="$style.img"/>
		<MkSystemIcon v-else-if="type === 'error'" type="error" :class="$style.icon"/>

		<div style="opacity: 0.7;">{{ props.text ?? (type === 'empty' ? i18n.ts.nothing : type === 'notFound' ? i18n.ts.notFound : type === 'error' ? i18n.ts.somethingHappened : null) }}</div>
		<slot></slot>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import {} from 'vue';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';

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
	margin: auto auto 16px;
	border-radius: 16px;
}

.icon {
	width: 65px;
	height: 65px;
	margin: 0 auto;
}
</style>
