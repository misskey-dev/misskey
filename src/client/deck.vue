<template>
<div class="mk-deck" :class="`${$store.state.device.deckColumnAlign}`" v-hotkey.global="keymap" @wheel="onWheel">
	<x-sidebar ref="nav"/>

	<!-- TODO: deckMainColumnPlace を見て位置変える -->
	<deck-column class="column" v-if="$store.state.device.deckAlwaysShowMainColumn || $route.name !== 'index'">
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

	<button @click="addColumn" class="_button add"><fa :icon="faPlus"/></button>

	<button v-if="$store.getters.isSignedIn" class="nav _button" @click="showNav()"><fa :icon="faBars"/><i v-if="navIndicated"><fa :icon="faCircle"/></i></button>
	<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>

	<stream-indicator v-if="$store.getters.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlus, faPencilAlt, faChevronLeft, faBars, faCircle } from '@fortawesome/free-solid-svg-icons';
import {  } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuid } from 'uuid';
import { host } from './config';
import { search } from './scripts/search';
import DeckColumnCore from './components/deck/column-core.vue';
import DeckColumn from './components/deck/column.vue';
import XSidebar from './components/sidebar.vue';
import { getScrollContainer } from './scripts/scroll';

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
			searching: false,
			connection: null,
			searchQuery: '',
			searchWait: false,
			canBack: false,
			menuDef: this.$store.getters.nav({}),
			wallpaper: localStorage.getItem('wallpaper') != null,
			faPlus, faPencilAlt, faChevronLeft, faBars, faCircle
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
		navIndicated(): boolean {
			if (!this.$store.getters.isSignedIn) return false;
			for (const def in this.menuDef) {
				if (this.menuDef[def].indicated) return true;
			}
			return false;
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

	watch: {
		$route(to, from) {
			this.pageKey++;
			this.canBack = (window.history.length > 0 && !['index'].includes(to.name));
		},
	},

	created() {
		document.documentElement.style.overflowY = 'hidden';
		document.documentElement.style.scrollBehavior = 'auto';

		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream.useSharedConnection('main');
			this.connection.on('notification', this.onNotification);
		}
	},

	mounted() {
	},

	methods: {
		onWheel(e) {
			if (getScrollContainer(e.target) == null) {
				document.documentElement.scrollLeft += e.deltaY > 0 ? 96 : -96;
			}
		},

		showNav() {
			this.$refs.nav.show();
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

		async addColumn(ev) {
			const columns = [
				'widgets',
				'notifications',
				'tl',
				'antenna',
				'list',
				'mentions',
				'direct',
			];

			const { canceled, result: column } = await this.$root.dialog({
				title: this.$t('_deck.addColumn'),
				type: null,
				select: {
					items: columns.map(column => ({
						value: column, text: this.$t('_deck._columns.' + column)
					}))
				},
				showCancelButton: true
			});
			if (canceled) return;

			this.$store.commit('deviceUser/addDeckColumn', {
				type: column,
				id: uuid(),
				name: this.$t('_deck._columns.' + column),
				width: 330,
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.mk-deck {
	$nav-hide-threshold: 650px; // TODO: どこかに集約したい

	// TODO: この値を設定で変えられるようにする？
	$columnMargin: 12px;

	$deckMargin: 12px;

	--margin: var(--marginHalf);

	display: flex;
	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;
	flex: 1;
	padding: $deckMargin 0 $deckMargin $deckMargin;

	&.center {
		> .column:first-of-type {
			margin-left: auto;
		}

		> .add {
			margin-right: auto;
		}
	}

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

	> .post,
	> .nav {
		position: fixed;
		z-index: 1000;
		bottom: 32px;
		width: 64px;
		height: 64px;
		border-radius: 100%;
		box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
		font-size: 22px;
	}

	> .post {
		right: 32px;
	}

	> .nav {
		left: 32px;
		background: var(--panel);
		color: var(--fg);

		@media (min-width: ($nav-hide-threshold + 1px)) {
			display: none;
		}

		&:hover {
			background: var(--X2);
		}

		> i {
			position: absolute;
			top: 0;
			left: 0;
			color: var(--indicator);
			font-size: 16px;
			animation: blink 1s infinite;
		}
	}
}

.iwnjqeul {
	$header-height: 42px; // TODO: column.vueのそれを参照するようにしたい(出来るのか？)

	> .default {
		> .avatar {
			$size: 28px;
			display: inline-block;
			width: $size;
			height: $size;
			vertical-align: bottom;
			margin: (($header-height - $size) / 2) 8px (($header-height - $size) / 2) 0;
		}

		> .title {
			display: inline-block;
			margin: 0;
			line-height: $header-height;

			> [data-icon] {
				margin-right: 8px;
			}
		}
	}

	> .custom {
		position: absolute;
		top: 0;
	}
}
</style>
