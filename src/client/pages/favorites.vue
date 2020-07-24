<template>
<div>
	<portal to="icon"><fa :icon="faStar"/></portal>
	<portal to="title" v-t="'favorites'"></portal>
	<x-notes :pagination="pagination" :detail="true" :extract="items => items.map(item => item.note)" @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import Progress from '../scripts/loading';
import XNotes from '../components/notes.vue';

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
