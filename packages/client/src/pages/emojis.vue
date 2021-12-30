<template>
<div :class="$style.root">
	<XCategory v-if="tab === 'category'"/>
</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import XCategory from './emojis.category.vue';

export default defineComponent({
	components: {
		XCategory,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => ({
				title: this.$ts.customEmojis,
				icon: 'fas fa-laugh',
				bg: 'var(--bg)',
				actions: [{
					icon: 'fas fa-ellipsis-h',
					handler: this.menu
				}],
			})),
			tab: 'category',
		}
	},

	methods: {
		menu(ev) {
			os.popupMenu([{
				icon: 'fas fa-download',
				text: this.$ts.export,
				action: async () => {
					os.api('export-custom-emojis', {
					})
					.then(() => {
						os.alert({
							type: 'info',
							text: this.$ts.exportRequested,
						});
					}).catch((e) => {
						os.alert({
							type: 'error',
							text: e.message,
						});
					});
				}
			}], ev.currentTarget || ev.target);
		}
	}
});
</script>

<style lang="scss" module>
.root {
	max-width: 1000px;
	margin: 0 auto;
}
</style>
