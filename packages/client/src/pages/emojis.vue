<template>
<div :class="$style.root">
	<XCategory v-if="tab === 'category'"/>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import XCategory from './emojis.category.vue';
import { i18n } from '@/i18n';

const tab = ref('category');

function menu(ev) {
	os.popupMenu([{
		icon: 'fas fa-download',
		text: i18n.ts.export,
		action: async () => {
			os.api('export-custom-emojis', {
			})
			.then(() => {
				os.alert({
					type: 'info',
					text: i18n.ts.exportRequested,
				});
			}).catch((err) => {
				os.alert({
					type: 'error',
					text: err.message,
				});
			});
		}
	}], ev.currentTarget ?? ev.target);
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.customEmojis,
		icon: 'fas fa-laugh',
		bg: 'var(--bg)',
		actions: [{
			icon: 'fas fa-ellipsis-h',
			handler: menu,
		}],
	},
});
</script>

<style lang="scss" module>
.root {
	max-width: 1000px;
	margin: 0 auto;
}
</style>
