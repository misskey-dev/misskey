<template>
<div class="jmelgwjh">
	<div class="body">
		<XNotes class="notes" :pagination="pagination" :detail="true" :prop="'note'"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import XNotes from '@/components/notes.vue';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const pagination = {
	endpoint: 'i/favorites',
	limit: 10,
	params: () => ({
	})
};

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.locale.favorites,
		icon: 'fas fa-star',
		bg: 'var(--bg)',
	},
});
</script>

<style lang="scss" scoped>
.jmelgwjh {
	background: var(--bg);

	> .body {
		box-sizing: border-box;
		max-width: 800px;
		margin: 0 auto;
		padding: 16px;
	}
}
</style>
