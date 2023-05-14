<template>
<component :is="'x-' + block.type" :key="block.id" :page="page" :block="block" :h="h"/>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import XText from './page.text.vue';
import XSection from './page.section.vue';
import XImage from './page.image.vue';
import XNote from './page.note.vue';
import { Block } from './block.type';

defineProps<{
	block: Block,
	h: number,
	page: Misskey.entities.Page,
}>();
</script>
