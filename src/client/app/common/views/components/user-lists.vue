<template>
<div class="mk-user-lists">
	<div class="create">
		<button class="ui" @click="add">%fa:plus% %i18n:@create-list%</button>
	</div>
	<a v-for="list in lists" :key="list.id" @click="navigate(list)">{{ list.title }}</a>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			lists: []
		};
	},
	mounted() {
		(this as any).api('users/lists/list').then(lists => {
			this.fetching = false;
			this.lists = lists;
		});
	},
	methods: {
		add() {
			(this as any).apis.input({
				title: '%i18n:@create-list%'
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

root(isDark)
	> .create
		position -webkit-sticky
		position sticky
		top 0
		left 0
		z-index 1
		width 100%
		padding 8px
		background isDark ? #282c37 : #f7f7f7
		box-shadow 0 0px 2px rgba(0,0,0,0.2)

		> button
			width 100%

	> a
		display block
		padding 16px 24px
		border-bottom solid 1px isDark ? #1c2023 : #eee
		text-decoration none

		&:hover
			background-color isDark ? #1e2129 : #fafafa

.mk-user-lists[data-darkmode]
	root(true)

.mk-user-lists:not([data-darkmode])
	root(false)
</style>
