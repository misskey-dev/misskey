<template>
<mk-ui>
	<span slot="header" v-if="!fetching"><fa icon="list"/>{{ list.title }}</span>

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

<style lang="stylus" scoped>
main
	width 100%
	max-width 680px
	margin 0 auto
	padding 8px

	@media (min-width 500px)
		padding 16px

	@media (min-width 600px)
		padding 32px

</style>
