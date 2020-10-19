<template>
<div v-show="hpml.vars[value.var]">
	<XBlock v-for="child in value.children" :value="child" :page="page" :hpml="hpml" :key="child.id" :h="h"/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';

export default defineComponent({
	components: {
		XBlock: defineAsyncComponent(() => import('./page.block.vue'))
	},
	props: {
		value: {
			required: true
		},
		hpml: {
			required: true
		},
		page: {
			required: true
		},
		h: {
			required: true
		}
	},
});
</script>
