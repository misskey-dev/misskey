<template>
<div :class="$style.root">
	<XCategory v-if="tab === 'category'"/>
</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
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
			})),
			tab: 'category',
		}
	},
});
</script>

<style lang="scss" module>
.root {
	max-width: 1000px;
	margin: 0 auto;
}
</style>
