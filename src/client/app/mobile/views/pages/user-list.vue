<template>
<mk-ui>
	<span slot="header" v-if="!fetching">%fa:list%{{ list.title }}</span>

	<main v-if="!fetching">
		<ul>
			<li v-for="user in list.users" :key="user.id"><router-link :to="user | userPage">{{ user | userName }}</router-link></li>
		</ul>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
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

			(this as any).api('users/lists/show', {
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
@import '~const.styl'

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
