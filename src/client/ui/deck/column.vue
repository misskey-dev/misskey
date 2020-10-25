<template>
<!-- sectionを利用しているのは、deck.vue側でcolumnに対してfirst-of-typeを効かせるため -->
<section class="dnpfarvg _panel _narrow_" :class="{ paged: isMainColumn, naked, _close_: !isMainColumn, active, isStacked, draghover, dragging, dropready }"
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
			<template v-if="active"><Fa :icon="faAngleUp"/></template>
			<template v-else><Fa :icon="faAngleDown"/></template>
		</button>
		<div class="action">
			<slot name="action"></slot>
		</div>
		<span class="header"><slot name="header"></slot></span>
		<button v-if="!isMainColumn" class="menu _button" ref="menu" @click.stop="showMenu"><Fa :icon="faCaretDown"/></button>
	</header>
	<div ref="body" v-show="active">
		<slot></slot>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faArrowUp, faArrowDown, faAngleUp, faAngleDown, faCaretDown, faArrowRight, faArrowLeft, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faWindowMaximize, faTrashAlt, faWindowRestore } from '@fortawesome/free-regular-svg-icons';
import * as os from '@/os';

export default defineComponent({
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
			faArrowUp, faArrowDown, faAngleUp, faAngleDown, faCaretDown,
		};
	},

	computed: {
		isMainColumn(): boolean {
			return this.column == null;
		},

		width(): number {
			return this.isMainColumn ? 350 : this.column.width;
		},

		keymap(): any {
			return {
				'shift+up': () => this.$parent.$emit('parent-focus', 'up'),
				'shift+down': () => this.$parent.$emit('parent-focus', 'down'),
				'shift+left': () => this.$parent.$emit('parent-focus', 'left'),
				'shift+right': () => this.$parent.$emit('parent-focus', 'right'),
			};
		}
	},

	watch: {
		active(v) {
			this.$emit('change-active-state', v);
		},

		dragging(v) {
			os.deckGlobalEvents.emit(v ? 'column.dragStart' : 'column.dragEnd');
		}
	},

	mounted() {
		if (!this.isMainColumn) {
			os.deckGlobalEvents.on('column.dragStart', this.onOtherDragStart);
			os.deckGlobalEvents.on('column.dragEnd', this.onOtherDragEnd);
		}
	},

	beforeUnmount() {
		if (!this.isMainColumn) {
			os.deckGlobalEvents.off('column.dragStart', this.onOtherDragStart);
			os.deckGlobalEvents.off('column.dragEnd', this.onOtherDragEnd);
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
			this.active = !this.active;
		},

		getMenu() {
			const items = [{
				icon: faPencilAlt,
				text: this.$t('rename'),
				action: () => {
					os.dialog({
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
				text: this.$t('_deck.swapLeft'),
				action: () => {
					this.$store.commit('deviceUser/swapLeftDeckColumn', this.column.id);
				}
			}, {
				icon: faArrowRight,
				text: this.$t('_deck.swapRight'),
				action: () => {
					this.$store.commit('deviceUser/swapRightDeckColumn', this.column.id);
				}
			}, this.isStacked ? {
				icon: faArrowUp,
				text: this.$t('_deck.swapUp'),
				action: () => {
					this.$store.commit('deviceUser/swapUpDeckColumn', this.column.id);
				}
			} : undefined, this.isStacked ? {
				icon: faArrowDown,
				text: this.$t('_deck.swapDown'),
				action: () => {
					this.$store.commit('deviceUser/swapDownDeckColumn', this.column.id);
				}
			} : undefined, null, {
				icon: faWindowRestore,
				text: this.$t('_deck.stackLeft'),
				action: () => {
					this.$store.commit('deviceUser/stackLeftDeckColumn', this.column.id);
				}
			}, this.isStacked ? {
				icon: faWindowMaximize,
				text: this.$t('_deck.popRight'),
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
				for (const i of this.menu.reverse()) {
					items.unshift(i);
				}
			}

			return items;
		},

		onContextmenu(e) {
			if (this.isMainColumn) return;
			this.showMenu();
		},

		showMenu() {
			os.modalMenu(this.getMenu(), this.$refs.menu);
		},

		goTop() {
			this.$refs.body.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		},

		onDragstart(e) {
			// メインカラムはドラッグさせない
			if (this.isMainColumn) {
				e.preventDefault();
				return;
			}

			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData(_DATA_TRANSFER_DECK_COLUMN_, this.column.id);
			this.dragging = true;
		},

		onDragend(e) {
			this.dragging = false;
		},

		onDragover(e) {
			// メインカラムにはドロップさせない
			if (this.isMainColumn) {
				e.dataTransfer.dropEffect = 'none';
				return;
			}

			// 自分自身がドラッグされている場合
			if (this.dragging) {
				// 自分自身にはドロップさせない
				e.dataTransfer.dropEffect = 'none';
				return;
			}

			const isDeckColumn = e.dataTransfer.types[0] == _DATA_TRANSFER_DECK_COLUMN_;

			e.dataTransfer.dropEffect = isDeckColumn ? 'move' : 'none';

			if (!this.dragging && isDeckColumn) this.draghover = true;
		},

		onDragleave() {
			this.draghover = false;
		},

		onDrop(e) {
			this.draghover = false;
			os.deckGlobalEvents.emit('column.dragEnd');

			const id = e.dataTransfer.getData(_DATA_TRANSFER_DECK_COLUMN_);
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

	--section-padding: 10px;

	height: 100%;
	overflow: hidden;
	contain: content;

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

		> header.indicated {
			box-shadow: 4px 0px var(--accent) inset;
		}
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
		}
	}

	> header {
		position: relative;
		display: flex;
		z-index: 2;
		line-height: $header-height;
		height: $header-height;
		padding: 0 16px;
		font-size: 0.9em;
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
		> .menu {
			z-index: 1;
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

		> .action {
			z-index: 1;
		}

		> .action:empty {
			display: none;
		}

		> .menu {
			margin-left: auto;
			margin-right: -16px;
		}
	}

	> div {
		height: calc(100% - #{$header-height});
		overflow: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		box-sizing: border-box;
	}
}
</style>
