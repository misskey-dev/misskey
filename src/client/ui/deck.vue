<template>
<div class="mk-deck" :class="`${deckStore.state.columnAlign}`" v-hotkey.global="keymap">
	<XSidebar ref="nav"/>

	<!-- TODO: deckMainColumnPlace を見て位置変える -->
	<DeckColumn class="column" v-if="deckStore.state.alwaysShowMainColumn || $route.name !== 'index'">
		<template #header>
			<XHeader :info="pageInfo"/>
		</template>

		<router-view v-slot="{ Component }">
			<transition>
				<keep-alive :include="['timeline']">
					<component :is="Component" :ref="changePage"/>
				</keep-alive>
			</transition>
		</router-view>
	</DeckColumn>

	<template v-for="ids in layout">
		<div v-if="ids.length > 1" class="folder column">
			<DeckColumnCore v-for="id in ids" :ref="id" :key="id" :column="columns.find(c => c.id === id)" :is-stacked="true" @parent-focus="moveFocus(id, $event)"/>
		</div>
		<DeckColumnCore v-else class="column" :ref="ids[0]" :key="ids[0]" :column="columns.find(c => c.id === ids[0])" @parent-focus="moveFocus(ids[0], $event)"/>
	</template>

	<button @click="addColumn" class="_button add"><Fa :icon="faPlus"/></button>

	<button v-if="$i" class="nav _button" @click="showNav()"><Fa :icon="faBars"/><i v-if="navIndicated"><Fa :icon="faCircle"/></i></button>
	<button v-if="$i" class="post _buttonPrimary" @click="post()"><Fa :icon="faPencilAlt"/></button>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faPencilAlt, faChevronLeft, faBars, faCircle } from '@fortawesome/free-solid-svg-icons';
import {  } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuid } from 'uuid';
import { host } from '@/config';
import { search } from '@/scripts/search';
import DeckColumnCore from '@/ui/deck/column-core.vue';
import DeckColumn from '@/ui/deck/column.vue';
import XSidebar from '@/components/sidebar.vue';
import XHeader from './_common_/header.vue';
import { getScrollContainer } from '@/scripts/scroll';
import * as os from '@/os';
import { sidebarDef } from '@/sidebar';
import XCommon from './_common_/common.vue';
import { deckStore, addColumn } from './deck/deck-store';

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		XHeader,
		DeckColumn,
		DeckColumnCore,
	},

	data() {
		return {
			deckStore,
			host: host,
			pageInfo: null,
			pageKey: 0,
			menuDef: sidebarDef,
			wallpaper: localStorage.getItem('wallpaper') != null,
			faPlus, faPencilAlt, faChevronLeft, faBars, faCircle
		};
	},

	computed: {
		columns() {
			return deckStore.reactiveState.columns.value;
		},
		layout() {
			return deckStore.reactiveState.layout.value;
		},
		navIndicated(): boolean {
			if (!this.$i) return false;
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
		},
	},

	created() {
		document.documentElement.style.overflowY = 'hidden';
		document.documentElement.style.scrollBehavior = 'auto';
		window.addEventListener('wheel', this.onWheel);
	},

	mounted() {
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page.INFO) {
				this.pageInfo = page.INFO;
			}
		},

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

		post() {
			os.post();
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

			const { canceled, result: column } = await os.dialog({
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

			addColumn({
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
</style>
