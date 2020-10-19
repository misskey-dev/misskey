<template>
<section class="sdgxphyu">
	<component :is="'h' + h">{{ value.title }}</component>

	<div class="children">
		<XBlock v-for="child in value.children" :value="child" :page="page" :hpml="hpml" :key="child.id" :h="h + 1"/>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import * as os from '@/os';

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

<style lang="scss" scoped>
.sdgxphyu {
	margin: 1.5em 0;

	> h2 {
		font-size: 1.35em;
		margin: 0 0 0.5em 0;
	}

	> h3 {
		font-size: 1em;
		margin: 0 0 0.5em 0;
	}

	> h4 {
		font-size: 1em;
		margin: 0 0 0.5em 0;
	}

	> .children {
		//padding 16px
	}
}
</style>
