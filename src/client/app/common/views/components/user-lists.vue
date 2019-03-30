<template>
<div class="xkxvokkjlptzyewouewmceqcxhpgzprp">
	<button class="ui" @click="add">{{ $t('create-list') }}</button>
	<a v-for="list in lists" :key="list.id" @click="choice(list)">{{ list.title }}</a>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/components/user-lists.vue'),
	data() {
		return {
			fetching: true,
			lists: []
		};
	},
	mounted() {
		this.$root.api('users/lists/list').then(lists => {
			this.fetching = false;
			this.lists = lists;
		});
	},
	methods: {
		add() {
			this.$root.dialog({
				title: this.$t('list-name'),
				input: true
			}).then(async ({ canceled, result: title }) => {
				if (canceled) return;
				const list = await this.$root.api('users/lists/create', {
					title
				});

				this.lists.push(list)
				this.$emit('choosen', list);
			});
		},
		choice(list) {
			this.$emit('choosen', list);
		}
	}
});
</script>

<style lang="stylus" scoped>
.xkxvokkjlptzyewouewmceqcxhpgzprp
	padding 16px
	background: var(--bg)

	> button
		display block
		margin-bottom 16px
		color var(--primaryForeground)
		background var(--primary)
		width 100%
		border-radius 38px
		user-select none
		cursor pointer
		padding 0 16px
		min-width 100px
		line-height 38px
		font-size 14px
		font-weight 700

		&:hover
			background var(--primaryLighten10)

		&:active
			background var(--primaryDarken10)

	a
		display block
		margin 8px 0
		padding 8px
		color var(--text)
		background var(--face)
		box-shadow 0 2px 16px var(--reversiListItemShadow)
		border-radius 6px
		cursor pointer
		line-height 32px

		*
			pointer-events none
			user-select none

		&:hover
			box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.05)

		&:active
			box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.1)

</style>
