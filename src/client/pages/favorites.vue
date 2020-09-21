<template>
<div>
	<portal to="header"><Fa :icon="faStar"/>{{ $t('favorites') }}</portal>
	<XNotes :pagination="pagination" :detail="true" :prop="'note'" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import XNotes from '@/components/notes.vue';
import * as os from '@/os';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('favorites') as string
		};
	},

	components: {
		XNotes
	},

	data() {
		return {
			pagination: {
				endpoint: 'i/favorites',
				limit: 10,
				params: () => ({
				})
			},
			faStar
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
