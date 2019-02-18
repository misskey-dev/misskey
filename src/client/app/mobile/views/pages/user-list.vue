<template>
<mk-ui>
	<template #header v-if="!fetching"><fa icon="list"/>{{ list.title }}</template>

	<main v-if="!fetching">
		<x-editor :list="list"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';
import XEditor from '../../../common/views/components/user-list-editor.vue';

export default Vue.extend({
	components: {
		XEditor
	},
	data() {
		return {
			fetching: true,
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
			Progress.start();
			this.fetching = true;

			this.$root.api('users/lists/show', {
				listId: this.$route.params.list
			}).then(list => {
				this.list = list;
				this.fetching = false;

				Progress.done();
			});
		}
	}
});
</script>
