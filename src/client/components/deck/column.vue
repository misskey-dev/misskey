<template>
<div class="dnpfarvg _panel" :class="{ naked, narrow, active, isStacked, draghover, dragging, dropready }"
	@dragover.prevent.stop="onDragover"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
	v-hotkey="keymap"
>
	<header :class="{ indicate: count > 0 }"
		draggable="true"
		@click="goTop"
		@dragstart="onDragstart"
		@dragend="onDragend"
		@contextmenu.prevent.stop="onContextmenu"
	>
		<button class="toggleActive" @click="toggleActive" v-if="isStacked">
			<template v-if="active"><fa :icon="faAngleUp"/></template>
			<template v-else><fa :icon="faAngleDown"/></template>
		</button>
		<span class="header"><slot name="header"></slot></span>
		<span class="count" v-if="count > 0">({{ count }})</span>
		<button v-if="!isTemporaryColumn" class="menu" ref="menu" @click.stop="showMenu"><fa icon="caret-down"/></button>
		<button v-else class="close" @click.stop="close"><fa icon="times"/></button>
	</header>
	<div ref="body" v-show="active">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Menu from '../../../common/views/components/menu.vue';
import { countIf } from '../../../prelude/array';
import { faArrowUp, faArrowDown, faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faWindowMaximize } from '@fortawesome/free-regular-svg-icons';

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
		name: {
			type: String,
			required: false
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
		narrow: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	data() {
		return {
			count: 0,
			active: true,
			dragging: false,
			draghover: false,
			dropready: false,
			faArrowUp, faArrowDown, faAngleUp, faAngleDown
		};
	},

	computed: {
		isTemporaryColumn(): boolean {
			return this.column == null;
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
		active(v) {
			if (v && this.isScrollTop()) {
				this.$emit('top');
			}
		},
		dragging(v) {
			this.$root.$emit(v ? 'deck.column.dragStart' : 'deck.column.dragEnd');
		}
	},

	provide() {
		return {
			column: this,
			isScrollTop: this.isScrollTop,
			count: v => this.count = v,
			inNakedDeckColumn: !this.naked
		};
	},

	mounted() {
		this.$refs.body.addEventListener('scroll', this.onScroll, { passive: true });

		if (!this.isTemporaryColumn) {
			this.$root.$on('deck.column.dragStart', this.onOtherDragStart);
			this.$root.$on('deck.column.dragEnd', this.onOtherDragEnd);
		}
	},

	beforeDestroy() {
		this.$refs.body.removeEventListener('scroll', this.onScroll);

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

		isScrollTop() {
			return this.active && this.$refs.body.scrollTop == 0;
		},

		onScroll() {
			if (this.isScrollTop()) {
				this.$emit('top');
			}

			if (this.$store.state.device.enableInfiniteScroll) {
				const current = this.$refs.body.scrollTop + this.$refs.body.clientHeight;
				if (current > this.$refs.body.scrollHeight - 1) this.$emit('bottom');
			}
		},

		getMenu() {
			const items = [{
				icon: 'pencil-alt',
				text: this.$t('rename'),
				action: () => {
					this.$root.dialog({
						title: this.$t('rename'),
						input: {
							default: this.name,
							allowEmpty: false
						}
					}).then(({ canceled, result: name }) => {
						if (canceled) return;
						this.$store.commit('renameDeckColumn', { id: this.column.id, name });
					});
				}
			}, null, {
				icon: 'arrow-left',
				text: this.$t('swap-left'),
				action: () => {
					this.$store.commit('swapLeftDeckColumn', this.column.id);
				}
			}, {
				icon: 'arrow-right',
				text: this.$t('swap-right'),
				action: () => {
					this.$store.commit('swapRightDeckColumn', this.column.id);
				}
			}, this.isStacked ? {
				icon: faArrowUp,
				text: this.$t('swap-up'),
				action: () => {
					this.$store.commit('swapUpDeckColumn', this.column.id);
				}
			} : undefined, this.isStacked ? {
				icon: faArrowDown,
				text: this.$t('swap-down'),
				action: () => {
					this.$store.commit('swapDownDeckColumn', this.column.id);
				}
			} : undefined, null, {
				icon: ['far', 'window-restore'],
				text: this.$t('stack-left'),
				action: () => {
					this.$store.commit('stackLeftDeckColumn', this.column.id);
				}
			}, this.isStacked ? {
				icon: faWindowMaximize,
				text: this.$t('pop-right'),
				action: () => {
					this.$store.commit('popRightDeckColumn', this.column.id);
				}
			} : undefined, null, {
				icon: ['far', 'trash-alt'],
				text: this.$t('remove'),
				action: () => {
					this.$store.commit('removeDeckColumn', this.column.id);
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
			this.$contextmenu(e, this.getMenu());
		},

		showMenu() {
			this.$root.new(Menu, {
				source: this.$refs.menu,
				items: this.getMenu()
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
				this.$store.commit('swapDeckColumn', {
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

	&:not(.isStacked).narrow {
		width: 285px;
		min-width: 285px;
		flex-grow: 0 !important;
	}

	&.naked {
		background: var(--deckAcrylicColumnBg);

		> header {
			background: transparent;
			box-shadow: none;

			> button {
				color: var(--fg);
			}
		}
	}

	> header {
		display: flex;
		z-index: 2;
		line-height: $header-height;
		padding: 0 16px;
		font-size: 14px;
		color: var(--faceHeaderText);
		background: var(--faceHeader);
		box-shadow: 0 var(--lineWidth) rgba(#000, 0.15);
		cursor: pointer;

		&, * {
			user-select: none;
		}

		*:not(button) {
			pointer-events: none;
		}

		&.indicate {
			box-shadow: 0 3px 0 0 var(--accent);
		}

		> .header {
			display: inline-block;
			align-items: center;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;

			[data-icon] {
				margin-right: 8px;
			}
		}

		> .count {
			margin-left: 4px;
			opacity: 0.5;
		}
		
		> span:only-of-type {
			width: 100%;
		}

		> .toggleActive,
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

		> .toggleActive {
			margin-left: -16px;
		}

		> .menu,
		> .close {
			margin-left: auto;
			margin-right: -16px;
		}
	}

	> div {
		height: "calc(100% - %s)" % $header-height;
		overflow: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}
}
</style>
