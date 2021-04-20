<template>
<div class="mk-deck" :class="`${deckStore.reactiveState.columnAlign.value}`" @contextmenu.self.prevent="onContextmenu"
	:style="{ '--deckMargin': deckStore.reactiveState.columnMargin.value + 'px' }"
>
	<XSidebar ref="nav"/>

	<template v-for="ids in layout">
		<!-- sectionを利用しているのは、deck.vue側でcolumnに対してfirst-of-typeを効かせるため -->
		<section v-if="ids.length > 1"
			class="folder column"
			:style="columns.filter(c => ids.includes(c.id)).some(c => c.flexible) ? { flex: 1, minWidth: '350px' } : { width: Math.max(...columns.filter(c => ids.includes(c.id)).map(c => c.width)) + 'px' }"
		>
			<DeckColumnCore v-for="id in ids" :ref="id" :key="id" :column="columns.find(c => c.id === id)" :is-stacked="true" @parent-focus="moveFocus(id, $event)"/>
		</section>
		<DeckColumnCore v-else
			class="column"
			:ref="ids[0]"
			:key="ids[0]"
			:column="columns.find(c => c.id === ids[0])"
			@parent-focus="moveFocus(ids[0], $event)"
			:style="columns.find(c => c.id === ids[0]).flexible ? { flex: 1, minWidth: '350px' } : { width: columns.find(c => c.id === ids[0]).width + 'px' }"
		/>
	</template>

	<button v-if="$i" class="nav _button" @click="showNav()"><Fa :icon="faBars"/><i v-if="navIndicated"><Fa :icon="faCircle"/></i></button>
	<button v-if="$i" class="post _buttonPrimary" @click="post()"><i class="fas fa-pencil-alt"></i></button>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faPencilAlt, faChevronLeft, faBars, faCircle } from '@fortawesome/free-solid-svg-icons';
import {  } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuid } from 'uuid';
import { host } from '@client/config';
import DeckColumnCore from '@client/ui/deck/column-core.vue';
import XSidebar from '@client/ui/_common_/sidebar.vue';
import { getScrollContainer } from '@client/scripts/scroll';
import * as os from '@client/os';
import { sidebarDef } from '@client/sidebar';
import XCommon from './_common_/common.vue';
import { deckStore, addColumn, loadDeck } from './deck/deck-store';

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		DeckColumnCore,
	},

	provide() {
		return deckStore.state.navWindow ? {
			navHook: (url) => {
				os.pageWindow(url);
			}
		} : {};
	},

	data() {
		return {
			deckStore,
			host: host,
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
	},

	created() {
		document.documentElement.style.overflowY = 'hidden';
		document.documentElement.style.scrollBehavior = 'auto';
		window.addEventListener('wheel', this.onWheel);
		loadDeck();
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

		post() {
			os.post();
		},

		async addColumn(ev) {
			const columns = [
				'main',
				'widgets',
				'notifications',
				'tl',
				'antenna',
				'list',
				'mentions',
				'direct',
			];

			const { canceled, result: column } = await os.dialog({
				title: this.$ts._deck.addColumn,
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

		onContextmenu(e) {
			os.contextMenu([{
				text: this.$ts._deck.addColumn,
				icon: null,
				action: this.addColumn
			}], e);
		},
	}
});
</script>

<style lang="scss" scoped>
.mk-deck {
	$nav-hide-threshold: 650px; // TODO: どこかに集約したい

	// TODO: ここではなくて、各カラムで自身の幅に応じて上書きするようにしたい
	--margin: var(--marginHalf);

	display: flex;
	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;
	flex: 1;
	padding: var(--deckMargin);

	&.center {
		> .column:first-of-type {
			margin-left: auto;
		}

		> .column:last-of-type {
			margin-right: auto;
		}
	}

	> .column {
		flex-shrink: 0;
		margin-right: var(--deckMargin);

		&.folder {
			display: flex;
			flex-direction: column;

			> *:not(:last-child) {
				margin-bottom: var(--deckMargin);
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

		@media (min-width: ($nav-hide-threshold + 1px)) {
			display: none;
		}
	}

	> .post {
		right: 32px;
	}

	> .nav {
		left: 32px;
		background: var(--panel);
		color: var(--fg);

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
