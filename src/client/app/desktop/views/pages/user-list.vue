<template>
<mk-ui>
	<div v-if="!fetching" data-id="02010e15-cc48-4245-8636-16078a9b623c">
		<div>
			<div><h1>{{ list.title }}</h1></div>
			<x-users :list="list"/>
		</div>
		<main>
			<mk-user-list-timeline :list="list"/>
		</main>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import XUsers from './user-list.users.vue';

export default Vue.extend({
	components: {
		XUsers
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
	mounted() {
		this.fetch();
	},
	methods: {
		fetch() {
			this.fetching = true;

			(this as any).api('users/lists/show', {
				listId: this.$route.params.list
			}).then(list => {
				this.list = list;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
[data-id="02010e15-cc48-4245-8636-16078a9b623c"]
	display flex
	justify-content center
	margin 0 auto
	max-width 1200px

	> main
	> div > div
		> *:not(:last-child)
			margin-bottom 16px

	> main
		padding 16px
		width calc(100% - 275px * 2)

	> div
		width 275px
		margin 0
		padding 16px 0 16px 16px

</style>
