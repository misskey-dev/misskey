<template>
<mk-window ref="window" is-modal width="450px" height="500px" @closed="destroyDom">
	<span slot="header"><fa icon="list"/> {{ $t('title') }}</span>

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
			this.$input({
				title: this.$t('list-name'),
			}).then(async title => {
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
		margin-bottom 16px

	> a
		display block
		padding 16px
		border solid 1px var(--faceDivider)
		border-radius 4px

</style>
