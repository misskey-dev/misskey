<template>
<div class="dnpfarvg _panel _narrow_" :class="{ naked, paged, _close_: !paged, active, isStacked, draghover, dragging, dropready }"
	@dragover.prevent.stop="onDragover"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
	v-hotkey="keymap"
	:style="{ width: `${width}px` }"
>
	<header :class="{ indicated }"
		draggable="true"
		@click="goTop"
		@dragstart="onDragstart"
		@dragend="onDragend"
		@contextmenu.prevent.stop="onContextmenu"
	>
		<button class="toggleActive _button" @click="toggleActive" v-if="isStacked">
			<template v-if="active"><fa :icon="faAngleUp"/></template>
			<template v-else><fa :icon="faAngleDown"/></template>
		</button>
		<div class="action">
			<slot name="action"></slot>
		</div>
		<span class="header"><slot name="header"></slot></span>
		<button v-if="!isTemporaryColumn" class="menu _button" ref="menu" @click.stop="showMenu"><fa :icon="faCaretDown"/></button>
		<button v-else class="close _button" @click.stop="close"><fa :icon="faTimes"/></button>
	</header>
	<div ref="body" v-show="active">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faArrowUp, faArrowDown, faAngleUp, faAngleDown, faCaretDown, faTimes, faArrowRight, faArrowLeft, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faWindowMaximize, faTrashAlt, faWindowRestore } from '@fortawesome/free-regular-svg-icons';
import { countIf } from '../../../prelude/array';

export default Vue.extend({
	props: {
		column: {
			type: Object,
			required: false,
			default: null
		},
		isStacked: {
			type: Boolean,
			required: false,
			default: false
		},
		menu: {
			type: Array,
			required: false,
			default: null
		},
		naked: {
			type: Boolean,
			required: false,
			default: false
		},
		paged: {
			type: Boolean,
			required: false,
			default: false
		},
		indicated: {
			type: Boolean,
			required: false,
			default: false
		},
	},

	data() {
		return {
			active: true,
			dragging: false,
			draghover: false,
			dropready: false,
			faArrowUp, faArrowDown, faAngleUp, faAngleDown, faCaretDown, faTimes,
		};
	},

	computed: {
		isTemporaryColumn(): boolean {
			return this.column == null;
		},

		width(): number {
			return this.column == null ? 350 : this.column.width;
		},

		keymap(): any {
			return {
				'shift+up': () => this.$parent.$emit('parentFocus', 'up'),
				'shift+down': () => this.$parent.$emit('parentFocus', 'down'),
				'shift+left': () => this.$parent.$emit('parentFocus', 'left'),
				'shift+right': () => this.$parent.$emit('parentFocus', 'right'),
			};
		}
	},

	inject: {
		getColumnVm: { from: 'getColumnVm' }
	},

	watch: {
		dragging(v) {
			this.$root.$emit(v ? 'deck.column.dragStart' : 'deck.column.dragEnd');
		}
	},

	mounted() {
		if (!this.isTemporaryColumn) {
			this.$root.$on('deck.column.dragStart', this.onOtherDragStart);
			this.$root.$on('deck.column.dragEnd', this.onOtherDragEnd);
		}
	},

	beforeDestroy() {
		if (!this.isTemporaryColumn) {
			this.$root.$off('deck.column.dragStart', this.onOtherDragStart);
			this.$root.$off('deck.column.dragEnd', this.onOtherDragEnd);
		}
	},

	methods: {
		onOtherDragStart() {
			this.dropready = true;
		},

		onOtherDragEnd() {
			this.dropready = false;
		},

		toggleActive() {
			if (!this.isStacked) return;
			const deck = this.$store.state.deviceUser.deck;
			const vms = deck.layout.find(ids => ids.indexOf(this.column.id) != -1).map(id => this.getColumnVm(id));
			if (this.active && countIf(vm => vm.$el.classList.contains('active'), vms) == 1) return;
			this.active = !this.active;
		},

		getMenu() {
			const items = [{
				icon: faPencilAlt,
				text: this.$t('rename'),
				action: () => {
					this.$root.dialog({
						title: this.$t('rename'),
						input: {
							default: this.column.name,
							allowEmpty: false
						}
					}).then(({ canceled, result: name }) => {
						if (canceled) return;
						this.$store.commit('deviceUser/renameDeckColumn', { id: this.column.id, name });
					});
				}
			}, null, {
				icon: faArrowLeft,
				text: this.$t('swap-left'),
				action: () => {
					this.$store.commit('deviceUser/swapLeftDeckColumn', this.column.id);
				}
			}, {
				icon: faArrowRight,
				text: this.$t('swap-right'),
				action: () => {
					this.$store.commit('deviceUser/swapRightDeckColumn', this.column.id);
				}
			}, this.isStacked ? {
				icon: faArrowUp,
				text: this.$t('swap-up'),
				action: () => {
					this.$store.commit('deviceUser/swapUpDeckColumn', this.column.id);
				}
			} : undefined, this.isStacked ? {
				icon: faArrowDown,
				text: this.$t('swap-down'),
				action: () => {
					this.$store.commit('deviceUser/swapDownDeckColumn', this.column.id);
				}
			} : undefined, null, {
				icon: faWindowRestore,
				text: this.$t('stack-left'),
				action: () => {
					this.$store.commit('deviceUser/stackLeftDeckColumn', this.column.id);
				}
			}, this.isStacked ? {
				icon: faWindowMaximize,
				text: this.$t('pop-right'),
				action: () => {
					this.$store.commit('deviceUser/popRightDeckColumn', this.column.id);
				}
			} : undefined, null, {
				icon: faTrashAlt,
				text: this.$t('remove'),
				action: () => {
					this.$store.commit('deviceUser/removeDeckColumn', this.column.id);
				}
			}];

			if (this.menu) {
				items.unshift(null);
				for (const i of this.menu.reverse()) {
					items.unshift(i);
				}
			}

			return items;
		},

		onContextmenu(e) {
			if (this.isTemporaryColumn) return;
			this.showMenu();
		},

		showMenu() {
			this.$root.menu({
				items: this.getMenu(),
				source: this.$refs.menu,
			});
		},

		close() {
			this.$router.push('/');
		},

		goTop() {
			this.$refs.body.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		},

		onDragstart(e) {
			// テンポラリカラムはドラッグさせない
			if (this.isTemporaryColumn) {
				e.preventDefault();
				return;
			}

			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('mk-deck-column', this.column.id);
			this.dragging = true;
		},

		onDragend(e) {
			this.dragging = false;
		},

		onDragover(e) {
			// テンポラリカラムにはドロップさせない
			if (this.isTemporaryColumn) {
				e.dataTransfer.dropEffect = 'none';
				return;
			}

			// 自分自身がドラッグされている場合
			if (this.dragging) {
				// 自分自身にはドロップさせない
				e.dataTransfer.dropEffect = 'none';
				return;
			}

			const isDeckColumn = e.dataTransfer.types[0] == 'mk-deck-column';

			e.dataTransfer.dropEffect = isDeckColumn ? 'move' : 'none';

			if (!this.dragging && isDeckColumn) this.draghover = true;
		},

		onDragleave() {
			this.draghover = false;
		},

		onDrop(e) {
			this.draghover = false;
			this.$root.$emit('deck.column.dragEnd');

			const id = e.dataTransfer.getData('mk-deck-column');
			if (id != null && id != '') {
				this.$store.commit('deviceUser/swapDeckColumn', {
					a: this.column.id,
					b: id
				});
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.dnpfarvg {
	$header-height: 42px;

	height: 100%;
	overflow: hidden;
	box-shadow: 0 0 0 1px var(--deckColumnBorder);

	&.draghover {
		box-shadow: 0 0 0 2px var(--focus);

		&:after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--focus);
		}
	}

	&.dragging {
		box-shadow: 0 0 0 2px var(--focus);
	}

	&.dropready {
		* {
			pointer-events: none;
		}
	}

	&:not(.active) {
		flex-basis: $header-height;
		min-height: $header-height;
	}

	&.naked {
		//background: var(--deckAcrylicColumnBg);
		background: transparent !important;

		> header {
			background: transparent;
			box-shadow: none;

			> button {
				color: var(--fg);
			}
		}
	}

	&.paged {
		> div {
			background: var(--bg);
			padding: var(--margin);
		}
	}

	> header {
		position: relative;
		display: flex;
		z-index: 2;
		line-height: $header-height;
		padding: 0 16px;
		font-size: 14px;
		color: var(--panelHeaderFg);
		background: var(--panelHeaderBg);
		box-shadow: 0 1px 0 0 var(--panelHeaderDivider);
		cursor: pointer;

		&, * {
			user-select: none;
		}

		&.indicated {
			box-shadow: 0 3px 0 0 var(--accent);
		}

		> .header {
			display: inline-block;
			align-items: center;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		> span:only-of-type {
			width: 100%;
		}

		> .toggleActive,
		> .action > *,
		> .menu,
		> .close {
			padding: 0;
			width: $header-height;
			line-height: $header-height;
			font-size: 16px;
			color: var(--faceTextButton);

			&:hover {
				color: var(--faceTextButtonHover);
			}

			&:active {
				color: var(--faceTextButtonActive);
			}
		}

		> .toggleActive, > .action {
			margin-left: -16px;
		}

		> .action:empty {
			display: none;
		}

		> .menu,
		> .close {
			margin-left: auto;
			margin-right: -16px;
		}
	}

	> div {
		height: calc(100% - #{$header-height});
		overflow: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}
}
</style>
