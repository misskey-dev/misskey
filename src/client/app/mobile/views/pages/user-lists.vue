<template>
<mk-ui>
	<span slot="header"><fa icon="list"/>{{ $t('title') }}</span>
	<template slot="func"><button @click="fn"><fa icon="plus"/></button></template>

	<main>
		<ul>
			<li v-for="list in lists" :key="list.id"><router-link :to="`/i/lists/${list.id}`">{{ list.title }}</router-link></li>
		</ul>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/user-lists.vue'),
	data() {
		return {
			fetching: true,
			lists: []
		};
	},
	mounted() {
		document.title = this.$t('title');

		Progress.start();

		this.$root.api('users/lists/list').then(lists => {
			this.fetching = false;
			this.lists = lists;

			Progress.done();
		});
	},
	methods: {
		fn() {
			this.$input({
				title: this.$t('enter-list-name'),
			}).then(async title => {
				const list = await this.$root.api('users/lists/create', {
					title
				});

				this.$router.push(`/i/lists/${list.id}`);
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
