<template>
<mk-window ref="window" width="450px" height="500px" @closed="destroyDom">
	<template #header><fa icon="list"/> {{ $t('title') }}</template>

	<div class="xkxvokkjlptzyewouewmceqcxhpgzprp">
		<button class="ui" @click="add">{{ $t('create-list') }}</button>
		<a v-for="list in lists" :key="list.id" @click="choice(list)">{{ list.title }}</a>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/user-lists-window.vue'),
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

	> a
		display block
		padding 16px
		border solid 1px var(--faceDivider)
		border-radius 4px

</style>
