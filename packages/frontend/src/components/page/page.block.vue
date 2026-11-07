<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component :is="getComponent(block.type)" :key="block.id" :page="page" :block="block" :h="h"/>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import XText from './page.text.vue';
import XSection from './page.section.vue';
import XImage from './page.image.vue';
import XNote from './page.note.vue';
import XDynamic from './page.dynamic.vue';

function getComponent(type: string) {
	switch (type) {
		case 'text': return XText;
		case 'section': return XSection;
		case 'image': return XImage;
		case 'note': return XNote;

		// 動的ページの代替用ブロック
		case 'button':
		case 'if':
		case 'textarea':
		case 'post':
		case 'canvas':
		case 'numberInput':
		case 'textInput':
		case 'switch':
		case 'radioButton':
		case 'counter':
			return XDynamic;

		default: return null;
	}
}

defineProps<{
	block: Misskey.entities.PageBlock,
	h: number,
	page: Misskey.entities.Page,
}>();
</script>
