<template>
<div>
	<x-timeline v-if="list" :list="list" :key="list.id"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XTimeline from './list.timeline.vue';

export default Vue.extend({
	components: {
		XTimeline
	},

	data() {
		return {
			list: null
		};
	},

	watch: {
		$route: 'fetch'
	},

	created() {
		this.fetch();
	},
	
	methods: {
		fetch() {
			this.$root.api('users/lists/show', {
				listId: this.$route.params.list
			}).then(list => {
				this.list = list;
			});
		}
	}
});
</script>
