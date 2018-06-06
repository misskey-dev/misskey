<template>
<mk-ui :class="$style.root">
	<div class="qlvquzbjribqcaozciifydkngcwtyzje" :data-darkmode="$store.state.device.darkmode">
		<template v-for="column in columns">
			<x-widgets-column v-if="column.type == 'widgets'" :key="column.id" :column="column"/>
			<x-notifications-column v-if="column.type == 'notifications'" :key="column.id" :id="column.id"/>
			<x-tl-column v-if="column.type == 'home'" :key="column.id" :column="column"/>
			<x-tl-column v-if="column.type == 'local'" :key="column.id" :column="column"/>
			<x-tl-column v-if="column.type == 'global'" :key="column.id" :column="column"/>
			<x-tl-column v-if="column.type == 'list'" :key="column.id" :column="column"/>
		</template>
		<button ref="add" @click="add" title="%i18n:common.deck.add-column%">%fa:plus%</button>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import XTlColumn from './deck.tl-column.vue';
import XNotificationsColumn from './deck.notifications-column.vue';
import XWidgetsColumn from './deck.widgets-column.vue';
import Menu from '../../../../common/views/components/menu.vue';
import MkUserListsWindow from '../../components/user-lists-window.vue';
import * as uuid from 'uuid';

export default Vue.extend({
	components: {
		XTlColumn,
		XNotificationsColumn,
		XWidgetsColumn
	},

	computed: {
		columns() {
			if (this.$store.state.settings.deck == null) return [];
			return this.$store.state.settings.deck.columns;
		}
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

			this.$store.dispatch('settings/set', {
				key: 'deck',
				value: deck
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
	justify-content center
	padding 16px 0 16px 16px
	overflow auto

	> div
		margin-right 8px

		&:last-of-type
			margin-right 0

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
