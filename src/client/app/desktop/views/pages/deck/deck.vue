<template>
<mk-ui :class="$style.root">
	<div class="qlvquzbjribqcaozciifydkngcwtyzje">
		<template v-for="column in columns">
			<x-notifications-column v-if="column.type == 'notifications'" :key="column.id"/>
			<x-tl-column v-if="column.type == 'home'" :key="column.id" src="home"/>
			<x-tl-column v-if="column.type == 'local'" :key="column.id" src="local"/>
			<x-tl-column v-if="column.type == 'global'" :key="column.id" src="global"/>
		</template>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import XTlColumn from './deck.tl-column.vue';
import XNotificationsColumn from './deck.notifications-column.vue';
import * as uuid from 'uuid';

export default Vue.extend({
	components: {
		XTlColumn,
		XNotificationsColumn
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

.qlvquzbjribqcaozciifydkngcwtyzje[data-darkmode]
	root(true)

.qlvquzbjribqcaozciifydkngcwtyzje:not([data-darkmode])
	root(false)

</style>
