<template>
<mk-ui :class="$style.root">
	<div class="qlvquzbjribqcaozciifydkngcwtyzje" ref="body" :style="style" :class="`${$store.state.device.deckColumnAlign} ${$store.state.device.deckColumnWidth}`" v-hotkey.global="keymap">
		<template v-for="ids in layout">
			<div v-if="ids.length > 1" class="folder">
				<template v-for="id, i in ids">
					<x-column-core :ref="id" :key="id" :column="columns.find(c => c.id == id)" :is-stacked="true" @parentFocus="moveFocus(id, $event)"/>
				</template>
			</div>
			<x-column-core v-else :ref="ids[0]" :key="ids[0]" :column="columns.find(c => c.id == ids[0])" @parentFocus="moveFocus(ids[0], $event)"/>
		</template>
		<router-view></router-view>
		<button ref="add" @click="add" :title="$t('@deck.add-column')"><fa icon="plus"/></button>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XColumnCore from './deck.column-core.vue';
import Menu from '../../../common/views/components/menu.vue';
import MkUserListsWindow from '../components/user-lists-window.vue';

import * as uuid from 'uuid';

export default Vue.extend({
	i18n: i18n('deck'),
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
		},

		style(): any {
			return {
				height: `calc(100vh - ${this.$store.state.uiHeaderHeight}px)`
			};
		},

		keymap(): any {
			return {
				't': this.focus
			};
		}
	},

	watch: {
		$route() {
			if (this.$route.name == 'index') return;
			this.$nextTick(() => {
				this.$refs.body.scrollTo({
					left: this.$refs.body.scrollWidth - this.$refs.body.clientWidth,
					behavior: 'smooth'
				});
			});
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
		document.title = this.$root.instanceName;
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
			this.$root.new(Menu, {
				source: this.$refs.add,
				items: [{
					icon: 'home',
					text: this.$t('@deck.home'),
					action: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'home'
						});
					}
				}, {
					icon: ['far', 'comments'],
					text: this.$t('@deck.local'),
					action: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'local'
						});
					}
				}, {
					icon: 'share-alt',
					text: this.$t('@deck.hybrid'),
					action: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'hybrid'
						});
					}
				}, {
					icon: 'globe',
					text: this.$t('@deck.global'),
					action: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'global'
						});
					}
				}, {
					icon: 'at',
					text: this.$t('@deck.mentions'),
					action: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'mentions'
						});
					}
				}, {
					icon: ['far', 'envelope'],
					text: this.$t('@deck.direct'),
					action: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'direct'
						});
					}
				}, {
					icon: 'list',
					text: this.$t('@deck.list'),
					action: () => {
						const w = this.$root.new(MkUserListsWindow);
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
					icon: 'hashtag',
					text: this.$t('@deck.hashtag'),
					action: () => {
						this.$root.dialog({
							title: this.$t('enter-hashtag-tl-title'),
							input: true
						}).then(({ canceled, result: title }) => {
							if (canceled) return;
							this.$store.dispatch('settings/addDeckColumn', {
								id: uuid(),
								type: 'hashtag',
								tagTlId: this.$store.state.settings.tagTimelines.find(x => x.title == title).id
							});
						});
					}
				}, {
					icon: ['far', 'bell'],
					text: this.$t('@deck.notifications'),
					action: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'notifications'
						});
					}
				}, {
					icon: 'calculator',
					text: this.$t('@deck.widgets'),
					action: () => {
						this.$store.dispatch('settings/addDeckColumn', {
							id: uuid(),
							type: 'widgets',
							widgets: []
						});
					}
				}]
			});
		},

		focus() {
			// Flatten array of arrays
			const ids = [].concat.apply([], this.layout);
			const firstTl = ids.find(id => this.isTlColumn(id));

			if (firstTl) {
				this.$refs[firstTl][0].focus();
			}
		},

		moveFocus(id, direction) {
			let targetColumn;

			if (direction == 'right') {
				const currentColumnIndex = this.layout.findIndex(ids => ids.includes(id));
				this.layout.some((ids, i) => {
					if (i <= currentColumnIndex) return false;
					const tl = ids.find(id => this.isTlColumn(id));
					if (tl) {
						targetColumn = tl;
						return true;
					}
				});
			} else if (direction == 'left') {
				const currentColumnIndex = [...this.layout].reverse().findIndex(ids => ids.includes(id));
				[...this.layout].reverse().some((ids, i) => {
					if (i <= currentColumnIndex) return false;
					const tl = ids.find(id => this.isTlColumn(id));
					if (tl) {
						targetColumn = tl;
						return true;
					}
				});
			} else if (direction == 'down') {
				const currentColumn = this.layout.find(ids => ids.includes(id));
				const currentIndex = currentColumn.indexOf(id);
				currentColumn.some((_id, i) => {
					if (i <= currentIndex) return false;
					if (this.isTlColumn(_id)) {
						targetColumn = _id;
						return true;
					}
				});
			} else if (direction == 'up') {
				const currentColumn = [...this.layout.find(ids => ids.includes(id))].reverse();
				const currentIndex = currentColumn.indexOf(id);
				currentColumn.some((_id, i) => {
					if (i <= currentIndex) return false;
					if (this.isTlColumn(_id)) {
						targetColumn = _id;
						return true;
					}
				});
			}

			if (targetColumn) {
				this.$refs[targetColumn][0].focus();
			}
		},

		isTlColumn(id) {
			const column = this.columns.find(c => c.id === id);
			return ['home', 'local', 'hybrid', 'global', 'list', 'hashtag', 'mentions', 'direct'].includes(column.type);
		}
	}
});
</script>

<style lang="stylus" module>
.root
	height 100vh
</style>

<style lang="stylus" scoped>
.qlvquzbjribqcaozciifydkngcwtyzje
	display flex
	flex 1
	padding 16px 0 16px 16px
	overflow auto

	> div
		margin-right 8px
		width 330px
		min-width 330px

		&:last-of-type
			margin-right 0

		&.folder
			display flex
			flex-direction column

			> *:not(:last-child)
				margin-bottom 8px

	&.narrow
		> div
			width 303px
			min-width 303px

	&.narrower
		> div
			width 316.5px
			min-width 316.5px

	&.wider
		> div
			width 343.5px
			min-width 343.5px

	&.wide
		> div
			width 357px
			min-width 357px

	&.center
		> *
			&:first-child
				margin-left auto

			&:last-child
				margin-right auto

	&.:not(.flexible)
		> *
			flex-grow 0
			flex-shrink 0

	&.flexible
		> *
			flex-grow 1
			flex-shrink 0

	> button
		padding 0 16px
		color var(--faceTextButton)
		flex-grow 0 !important

		&:hover
			color var(--faceTextButtonHover)

		&:active
			color var(--faceTextButtonActive)

</style>
