<template>
<div class="_section">
	<XNotes class="_content" :pagination="pagination" :detail="true" :prop="'note'" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Progress from '@client/scripts/loading';
import XNotes from '@client/components/notes.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		XNotes
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.favorites,
				icon: 'fas fa-star'
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
