<template>
<mk-window ref="window" is-modal width="450px" height="500px" @closed="destroyDom">
	<span slot="header">%fa:list% %i18n:@title%</span>

	<div class="xkxvokkjlptzyewouewmceqcxhpgzprp">
		<button class="ui" @click="add">%i18n:@create-list%</button>
		<a v-for="list in lists" :key="list.id" @click="choice(list)">{{ list.title }}</a>
	</div>
</mk-window>
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
				title: '%i18n:@list-name%',
			}).then(async title => {
				const list = await (this as any).api('users/lists/create', {
					title
				});

				this.$emit('choosen', list);
			});
		},
		choice(list) {
			this.$emit('choosen', list);
		},
		close() {
			(this as any).$refs.window.close();
		}
	}
});
</script>

<style lang="stylus" scoped>
.xkxvokkjlptzyewouewmceqcxhpgzprp
	padding 16px

	> button
		margin-bottom 16px

	> a
		display block
		padding 16px
		border solid 1px var(--faceDivider)
		border-radius 4px

</style>
