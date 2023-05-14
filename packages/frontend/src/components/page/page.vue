<template>
<div class="iroscrza" :class="{ center: page.alignCenter, serif: page.font === 'serif' }">
	<XBlock v-for="child in page.content" :key="child.id" :block="child" :h="2"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted, nextTick } from 'vue';
import * as Misskey from 'misskey-js';
import XBlock from './page.block.vue';

defineProps<{
	page: Misskey.entities.Page,
}>();
</script>

<style lang="scss" scoped>
.iroscrza {
	&.serif {
		> div {
			font-family: serif;
		}
	}

	&.center {
		text-align: center;
	}
}
</style>
