<template>
<div class="mk-deck" :class="`${$store.state.deviceUser.deckColumnAlign} ${$store.state.deviceUser.deckColumnWidth}`" v-hotkey.global="keymap">
	<template v-for="ids in layout">
		<div v-if="ids.length > 1" class="folder">
			<template v-for="id, i in ids">
				<deck-column-core :ref="id" :key="id" :column="columns.find(c => c.id == id)" :is-stacked="true" @parentFocus="moveFocus(id, $event)"/>
			</template>
		</div>
		<x-column-core v-else :ref="ids[0]" :key="ids[0]" :column="columns.find(c => c.id == ids[0])" @parentFocus="moveFocus(ids[0], $event)"/>
	</template>
	<router-view></router-view>
	<button @click="addColumn" :title="$t('@deck.add-column')"><fa :icon="faPlus"/></button>

	<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>

	<stream-indicator v-if="$store.getters.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import {  } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuid } from 'uuid';
import { host } from './config';
import { search } from './scripts/search';
import DeckColumnCore from './components/deck/column-core.vue';

export default Vue.extend({
	components: {
		DeckColumnCore
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			showNav: false,
			searching: false,
			connection: null,
			searchQuery: '',
			searchWait: false,
			canBack: false,
			wallpaper: localStorage.getItem('wallpaper') != null,
			faPlus
		};
	},

	computed: {
		deck() {
			return this.$store.state.deviceUser.deck;
		},
		columns(): any[] {
			return this.deck.columns;
		},
		layout(): any[] {
			return this.deck.layout;
		},
		keymap(): any {
			return {
				'p': this.post,
				'n': this.post,
				's': this.search,
				'h|/': this.help
			};
		},
	},

	watch:{
		$route(to, from) {
			this.pageKey++;
			this.showNav = false;
			this.canBack = (window.history.length > 0 && !['index'].includes(to.name));
		},
	},

	created() {
		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream.useSharedConnection('main');
			this.connection.on('notification', this.onNotification);
		}
	},

	mounted() {
	},

	methods: {
		help() {
			this.$router.push('/docs/keyboard-shortcut');
		},

		back() {
			if (this.canBack) window.history.back();
		},

		post() {
			this.$root.post();
		},

		search() {
			if (this.searching) return;

			this.$root.dialog({
				title: this.$t('search'),
				input: true
			}).then(async ({ canceled, result: query }) => {
				if (canceled || query == null || query === '') return;

				this.searching = true;
				search(this, query).finally(() => {
					this.searching = false;
				});
			});
		},

		async onNotification(notification) {
			if (document.visibilityState === 'visible') {
				this.$root.stream.send('readNotification', {
					id: notification.id
				});

				this.$root.new(await import('./components/toast.vue').then(m => m.default), {
					notification
				});
			}

			this.$root.sound('notification');
		},

		addColumn(ev) {
			const columns = [
				'memo',
				'notifications',
				'timeline',
				'calendar',
				'rss',
				'trends',
				'clock',
				'activity',
				'photos',
			];

			this.$root.menu({
				items: columns.map(column => ({
					text: this.$t('_deck._columns.' + column),
					action: () => {
						this.$store.commit('deviceUser/addDeckColumn', {
							name: column,
							id: uuid(),
						});
					}
				})),
				source: ev.currentTarget || ev.target,
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.mk-deck {
	display: flex;
	flex: 1;
	padding: var(--margin) 0 var(--margin) var(--margin);
	overflow: auto;
	overflow-y: hidden;

	> div {
		margin-right: 8px;
		width: 330px;
		min-width: 330px;

		&:last-of-type {
			margin-right: 0;
		}

		&.folder {
			display: flex;
			flex-direction: column;

			> *:not(:last-child) {
				margin-bottom: 8px;
			}
		}
	}
}
</style>
