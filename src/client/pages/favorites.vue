<template>
<div class="_section">
	<XNotes class="_content" :pagination="pagination" :detail="true" :prop="'note'" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import XNotes from '@/components/notes.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XNotes
	},

	data() {
		return {
			INFO: {
				header: [{
					title: this.$t('favorites'),
					icon: faStar
				}]
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
