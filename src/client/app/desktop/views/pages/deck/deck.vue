<template>
<mk-ui :class="$style.root">
	<div class="qlvquzbjribqcaozciifydkngcwtyzje" :data-darkmode="$store.state.device.darkmode">
		<template v-for="ids in layout">
			<div v-if="ids.length > 1" class="folder">
				<template v-for="id, i in ids">
					<x-column-core :ref="id" :key="id" :column="columns.find(c => c.id == id)" :is-stacked="true" :is-active="i == 0"/>
				</template>
			</div>
			<x-column-core v-else :ref="ids[0]" :key="ids[0]" :column="columns.find(c => c.id == ids[0])"/>
		</template>
		<button ref="add" @click="add" title="%i18n:common.deck.add-column%">%fa:plus%</button>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumnCore from './deck.column-core.vue';
import Menu from '../../../../common/views/components/menu.vue';
import MkUserListsWindow from '../../components/user-lists-window.vue';
import * as uuid from 'uuid';

export default Vue.extend({
	components: {
		XColumnCore
	},

	computed: {
		columns(): any[] {
			if (this.$store.state.settings.deck == null) return [];
			return this.$store.state.settings.deck.columns;
		},
		layout(): any[] {
			if (this.$store.state.settings.deck == null) return [];
			if (this.$store.state.settings.deck.layout == null) return this.$store.state.settings.deck.columns.map(c => [c.id]);
			return this.$store.state.settings.deck.layout;
		}
	},

	provide() {
		return {
			getColumnVm: this.getColumnVm
		};
	},

	created() {
		if (this.$store.state.settings.deck == null) {
			const deck = {
				columns: [/*{
					type: 'widgets',
					widgets: []
				}, */{
					id: uuid(),
					type: 'home'
				}, {
					id: uuid(),
					type: 'notifications'
				}, {
					id: uuid(),
					type: 'local'
				}, {
					id: uuid(),
					type: 'global'
				}]
			};

			deck.layout = deck.columns.map(c => [c.id]);

			this.$store.dispatch('settings/set', {
				key: 'deck',
				value: deck
			});
		}

		// 互換性のため
		if (this.$store.state.settings.deck != null && this.$store.state.settings.deck.layout == null) {
			this.$store.dispatch('settings/set', {
				key: 'deck',
				value: Object.assign({}, this.$store.state.settings.deck, {
					layout: this.$store.state.settings.deck.columns.map(c => [c.id])
				})
			});
		}
	},

	mounted() {
		document.documentElement.style.overflow = 'hidden';
	},

	beforeDestroy() {
		document.documentElement.style.overflow = 'auto';
	},

	methods: {
		getColumnVm(id) {
			return this.$refs[id][0];
		},

		add() {
			this.os.new(Menu, {
				source: this.$refs.add,
				compact: true,
				items: [{
					content: '%i18n:common.deck.home%',
					onClick: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'home'
						});
					}
				}, {
					content: '%i18n:common.deck.local%',
					onClick: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'local'
						});
					}
				}, {
					content: '%i18n:common.deck.global%',
					onClick: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'global'
						});
					}
				}, {
					content: '%i18n:common.deck.list%',
					onClick: () => {
						const w = (this as any).os.new(MkUserListsWindow);
						w.$once('choosen', list => {
							this.$store.dispatch('settings/addDeckColumn', {
								id: uuid(),
								type: 'list',
								list: list
							});
							w.close();
						});
					}
				}, {
					content: '%i18n:common.deck.notifications%',
					onClick: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'notifications'
						});
					}
				}, {
					content: '%i18n:common.deck.widgets%',
					onClick: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'widgets',
							widgets: []
						});
					}
				}]
			});
		}
	}
});
</script>

<style lang="stylus" module>
.root
	height 100vh
</style>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	display flex
	flex 1
	padding 16px 0 16px 16px
	overflow auto

	> div
		margin-right 8px

		&:last-of-type
			margin-right 0

		&.folder
			display flex
			flex-direction column

			> *:not(:last-child)
				margin-bottom 8px

	> *
		&:first-child
			margin-left auto

		&:last-child
			margin-right auto

	> button
		padding 0 16px
		color isDark ? #93a0a5 : #888

		&:hover
			color isDark ? #b8c5ca : #777

		&:active
			color isDark ? #fff : #555

.qlvquzbjribqcaozciifydkngcwtyzje[data-darkmode]
	root(true)

.qlvquzbjribqcaozciifydkngcwtyzje:not([data-darkmode])
	root(false)

</style>
