<template>
<MkSpacer :content-max="800">
	<XNotes :pagination="pagination" :detail="true" :prop="'note'"/>
</MkSpacer>
</template>

<script lang="ts" setup>
import XNotes from '@/components/notes.vue';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const pagination = {
	endpoint: 'i/favorites',
	limit: 10,
	params: () => ({
	}),
};

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.locale.favorites,
		icon: 'fas fa-star',
		bg: 'var(--bg)',
	},
});
</script>
