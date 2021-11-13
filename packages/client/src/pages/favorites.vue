<template>
<div class="jmelgwjh">
	<div class="body">
		<XNotes class="notes" :pagination="pagination" :detail="true" :prop="'note'" @before="before()" @after="after()"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Progress from '@/scripts/loading';
import XNotes from '@/components/notes.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		XNotes
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.favorites,
				icon: 'fas fa-star',
				bg: 'var(--bg)',
			},
			pagination: {
				endpoint: 'i/favorites',
				limit: 10,
				params: () => ({
				})
			},
		};
	},

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		}
	}
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
