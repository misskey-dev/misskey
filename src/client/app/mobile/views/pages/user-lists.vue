<template>
<mk-ui>
	<span slot="header">%fa:list%%i18n:@title%</span>
	<template slot="func"><button @click="fn">%fa:plus%</button></template>

	<main>
		<ul>
			<li v-for="list in lists" :key="list.id"><router-link :to="`/i/lists/${list.id}`">{{ list.title }}</router-link></li>
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
			lists: []
		};
	},
	mounted() {
		document.title = 'Misskey | %i18n:@title%';

		Progress.start();

		(this as any).api('users/lists/list').then(lists => {
			this.fetching = false;
			this.lists = lists;

			Progress.done();
		});
	},
	methods: {
		fn() {
			(this as any).apis.input({
				title: '%i18n:@enter-list-name%',
			}).then(async title => {
				const list = await (this as any).api('users/lists/create', {
					title
				});

				this.$router.push('/i/lists/' + list.id);
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
