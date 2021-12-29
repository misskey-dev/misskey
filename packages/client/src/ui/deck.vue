<template>
<div class="mk-deck" :class="[{ isMobile }, `${deckStore.reactiveState.columnAlign.value}`]" :style="{ '--deckMargin': deckStore.reactiveState.columnMargin.value + 'px' }"
	@contextmenu.self.prevent="onContextmenu"
>
	<XSidebar v-if="!isMobile"/>

	<template v-for="ids in layout">
		<!-- sectionを利用しているのは、deck.vue側でcolumnに対してfirst-of-typeを効かせるため -->
		<section v-if="ids.length > 1"
			class="folder column"
			:style="columns.filter(c => ids.includes(c.id)).some(c => c.flexible) ? { flex: 1, minWidth: '350px' } : { width: Math.max(...columns.filter(c => ids.includes(c.id)).map(c => c.width)) + 'px' }"
		>
			<DeckColumnCore v-for="id in ids" :ref="id" :key="id" :column="columns.find(c => c.id === id)" :is-stacked="true" @parent-focus="moveFocus(id, $event)"/>
		</section>
		<DeckColumnCore v-else
			:ref="ids[0]"
			:key="ids[0]"
			class="column"
			:column="columns.find(c => c.id === ids[0])"
			:style="columns.find(c => c.id === ids[0]).flexible ? { flex: 1, minWidth: '350px' } : { width: columns.find(c => c.id === ids[0]).width + 'px' }"
			@parent-focus="moveFocus(ids[0], $event)"
		/>
	</template>

	<div v-if="isMobile" class="buttons">
		<button class="button nav _button" @click="drawerMenuShowing = true"><i class="fas fa-bars"></i><span v-if="menuIndicated" class="indicator"><i class="fas fa-circle"></i></span></button>
		<button class="button home _button" @click="$router.push('/')"><i class="fas fa-home"></i></button>
		<button class="button notifications _button" @click="$router.push('/my/notifications')"><i class="fas fa-bell"></i><span v-if="$i.hasUnreadNotification" class="indicator"><i class="fas fa-circle"></i></span></button>
		<button class="button post _button" @click="post()"><i class="fas fa-pencil-alt"></i></button>
	</div>

	<transition name="menu-back">
		<div v-if="drawerMenuShowing"
			class="menu-back _modalBg"
			@click="drawerMenuShowing = false"
			@touchstart.passive="drawerMenuShowing = false"
		></div>
	</transition>

	<transition name="menu">
		<XDrawerMenu v-if="drawerMenuShowing" class="menu"/>
	</transition>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, provide, ref, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import DeckColumnCore from '@/ui/deck/column-core.vue';
import XSidebar from '@/ui/_common_/sidebar.vue';
import XDrawerMenu from '@/ui/_common_/sidebar-for-mobile.vue';
import { getScrollContainer } from '@/scripts/scroll';
import * as os from '@/os';
import { menuDef } from '@/menu';
import XCommon from './_common_/common.vue';
import { deckStore, addColumn as addColumnToStore, loadDeck } from './deck/deck-store';
import { useRoute } from 'vue-router';
import { $i } from '@/account';
import { i18n } from '@/i18n';

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		XDrawerMenu,
		DeckColumnCore,
	},

	setup() {
		const isMobile = ref(window.innerWidth <= 500);
		window.addEventListener('resize', () => {
			isMobile.value = window.innerWidth <= 500;
		});

		const drawerMenuShowing = ref(false);

		const route = useRoute();
		watch(route, () => {
			drawerMenuShowing.value = false;
		});

		const columns = deckStore.reactiveState.columns;
		const layout = deckStore.reactiveState.layout;
		const menuIndicated = computed(() => {
			if ($i == null) return false;
			for (const def in menuDef) {
				if (menuDef[def].indicated) return true;
			}
			return false;
		});

		const addColumn = async (ev) => {
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

			const { canceled, result: column } = await os.select({
				title: i18n.locale._deck.addColumn,
				items: columns.map(column => ({
					value: column, text: i18n.t('_deck._columns.' + column)
				}))
			});
			if (canceled) return;

			addColumnToStore({
				type: column,
				id: uuid(),
				name: i18n.t('_deck._columns.' + column),
				width: 330,
			});
		};

		const onContextmenu = (ev) => {
			os.contextMenu([{
				text: i18n.locale._deck.addColumn,
				icon: null,
				action: addColumn
			}], ev);
		};

		provide('shouldSpacerMin', true);
		if (deckStore.state.navWindow) {
			provide('navHook', (url) => {
				os.pageWindow(url);
			});
		}

		document.documentElement.style.overflowY = 'hidden';
		document.documentElement.style.scrollBehavior = 'auto';
		window.addEventListener('wheel', (ev) => {
			if (getScrollContainer(ev.target) == null) {
				document.documentElement.scrollLeft += ev.deltaY > 0 ? 96 : -96;
			}
		});
		loadDeck();

		return {
			isMobile,
			deckStore,
			drawerMenuShowing,
			columns,
			layout,
			menuIndicated,
			onContextmenu,
			wallpaper: localStorage.getItem('wallpaper') != null,
			post: os.post,
		};
	},
});
</script>

<style lang="scss" scoped>
.menu-enter-active,
.menu-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.menu-enter-from,
.menu-leave-active {
	opacity: 0;
	transform: translateX(-240px);
}

.menu-back-enter-active,
.menu-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.menu-back-enter-from,
.menu-back-leave-active {
	opacity: 0;
}

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

	&.isMobile {
		padding-bottom: 100px;
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

	> .buttons {
		position: fixed;
		z-index: 1000;
		bottom: 0;
		left: 0;
		padding: 16px;
		display: flex;
		width: 100%;
		box-sizing: border-box;

		> .button {
			position: relative;
			flex: 1;
			padding: 0;
			margin: auto;
			height: 64px;
			border-radius: 8px;
			background: var(--panel);
			color: var(--fg);

			&:not(:last-child) {
				margin-right: 12px;
			}

			@media (max-width: 400px) {
				height: 60px;

				&:not(:last-child) {
					margin-right: 8px;
				}
			}

			&:hover {
				background: var(--X2);
			}

			> .indicator {
				position: absolute;
				top: 0;
				left: 0;
				color: var(--indicator);
				font-size: 16px;
				animation: blink 1s infinite;
			}

			&:first-child {
				margin-left: 0;
			}

			&:last-child {
				margin-right: 0;
			}

			> * {
				font-size: 22px;
			}

			&:disabled {
				cursor: default;

				> * {
					opacity: 0.5;
				}
			}
		}
	}

	> .menu-back {
		z-index: 1001;
	}

	> .menu {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 1001;
		// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
		height: calc(var(--vh, 1vh) * 100);
		width: 240px;
		box-sizing: border-box;
		overflow: auto;
		overscroll-behavior: contain;
		background: var(--bg);
	}
}
</style>
