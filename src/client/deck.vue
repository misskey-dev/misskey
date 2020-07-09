<template>
<div class="mk-deck" :class="`${$store.state.deviceUser.deckColumnAlign}`" v-hotkey.global="keymap">
	<x-sidebar/>

	<deck-column :paged="true" class="column">
		<template #action>
			<button class="_button back" v-if="canBack" @click="back()"><fa :icon="faChevronLeft"/></button>
		</template>

		<template #header>
			<div class="iwnjqeul">
				<div class="default">
					<portal-target name="avatar" slim/>
					<span class="title"><portal-target name="icon" slim/><portal-target name="title" slim/></span>
				</div>
				<div class="custom">
					<portal-target name="header" slim/>
				</div>
			</div>
		</template>

		<router-view></router-view>
	</deck-column>

	<template v-for="ids in layout">
		<div v-if="ids.length > 1" class="folder column">
			<deck-column-core v-for="id, i in ids" :ref="id" :key="id" :column="columns.find(c => c.id === id)" :is-stacked="true" @parent-focus="moveFocus(id, $event)"/>
		</div>
		<deck-column-core v-else class="column" :ref="ids[0]" :key="ids[0]" :column="columns.find(c => c.id === ids[0])" @parent-focus="moveFocus(ids[0], $event)"/>
	</template>

	<button @click="addColumn" :title="$t('@deck.add-column')" class="_button"><fa :icon="faPlus"/></button>

	<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>

	<stream-indicator v-if="$store.getters.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlus, faPencilAlt, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import {  } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuid } from 'uuid';
import { host } from './config';
import { search } from './scripts/search';
import DeckColumnCore from './components/deck/column-core.vue';
import DeckColumn from './components/deck/column.vue';
import XSidebar from './components/sidebar.vue';

export default Vue.extend({
	components: {
		XSidebar,
		DeckColumn,
		DeckColumnCore,
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
			faPlus, faPencilAlt, faChevronLeft
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

	provide() {
		return {
			getColumnVm: this.getColumnVm,
		};
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
		getColumnVm(id) {
			return this.$refs[id][0];
		},

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
				'widgets',
				'notifications',
				'home',
				'local',
				'social',
				'global',
			];

			this.$root.menu({
				items: columns.map(column => ({
					text: this.$t('_deck._columns.' + column),
					action: () => {
						this.$store.commit('deviceUser/addDeckColumn', {
							type: column,
							id: uuid(),
							name: 'Hoge', // TODO
							width: 330,
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
	--margin: var(--marginHalf);

	display: flex;
	height: 100vh;
	box-sizing: border-box;
	flex: 1;
	padding: var(--margin) 0 var(--margin) var(--margin);

	// TODO: この値を設定で変えられるようにする
	$columnMargin: 12px;

	> .column {
		flex-shrink: 0;
		margin-right: $columnMargin;

		&.folder {
			display: flex;
			flex-direction: column;

			> *:not(:last-child) {
				margin-bottom: $columnMargin;
			}
		}
	}

	> .post {
		position: fixed;
		z-index: 1000;
		bottom: 32px;
		right: 32px;
		width: 64px;
		height: 64px;
		border-radius: 100%;
		box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
		font-size: 22px;
	}
}

.iwnjqeul {
}
</style>
