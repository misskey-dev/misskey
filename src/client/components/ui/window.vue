<template>
<div class="ebkgocck">
	<div class="body _popup _shadow _narrow_" @mousedown="onBodyMousedown" @keydown="onKeydown">
		<div class="header" @mousedown.prevent="onHeaderMousedown" @touchmove.prevent="onHeaderMousedown">
			<button class="_button" @click="close()"><Fa :icon="faTimes"/></button>
			<span class="title">
				<slot name="header"></slot>
			</span>
			<button class="_button" v-if="!withOkButton" @mousedown.stop="() => {}" @click="close()"><Fa :icon="faTimes"/></button>
			<button class="_button" v-if="withOkButton" @mousedown.stop="() => {}" @click="$emit('ok')" :disabled="okButtonDisabled"><Fa :icon="faCheck"/></button>
		</div>
		<div class="body" v-if="padding">
			<div class="_section">
				<slot></slot>
			</div>
		</div>
		<div class="body" v-else>
			<slot></slot>
		</div>
	</div>
	<template v-if="canResize">
		<div class="handle top" @mousedown.prevent="onTopHandleMousedown"></div>
		<div class="handle right" @mousedown.prevent="onRightHandleMousedown"></div>
		<div class="handle bottom" @mousedown.prevent="onBottomHandleMousedown"></div>
		<div class="handle left" @mousedown.prevent="onLeftHandleMousedown"></div>
		<div class="handle top-left" @mousedown.prevent="onTopLeftHandleMousedown"></div>
		<div class="handle top-right" @mousedown.prevent="onTopRightHandleMousedown"></div>
		<div class="handle bottom-right" @mousedown.prevent="onBottomRightHandleMousedown"></div>
		<div class="handle bottom-left" @mousedown.prevent="onBottomLeftHandleMousedown"></div>
	</template>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import contains from '@/scripts/contains';
import * as os from '@/os';

const minHeight = 40;
const minWidth = 200;

function dragListen(fn) {
	window.addEventListener('mousemove',  fn);
	window.addEventListener('mouseleave', dragClear.bind(null, fn));
	window.addEventListener('mouseup',    dragClear.bind(null, fn));
}

function dragClear(fn) {
	window.removeEventListener('mousemove',  fn);
	window.removeEventListener('mouseleave', dragClear);
	window.removeEventListener('mouseup',    dragClear);
}

export default defineComponent({
	props: {
		padding: {
			type: Boolean,
			required: false,
			default: false
		},
		initialWidth: {
			type: Number,
			required: false,
			default: 400
		},
		initialHeight: {
			type: Number,
			required: false,
			default: null
		},
		canResize: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	emits: ['close'],

	data() {
		return {
			faTimes
		};
	},

	mounted() {
		if (this.initialWidth) this.applyTransformWidth(this.initialWidth);
		if (this.initialHeight) this.applyTransformHeight(this.initialHeight);
		// TODO: リファクタの余地がある。thisまるごと共有したくない
		os.windows.add(this);
	},

	unmounted() {
		os.windows.remove(this);
	},

	methods: {
		close() {
			this.$emit('close');
		},

		onKeydown(e) {
			if (e.which === 27) { // Esc
				e.preventDefault();
				e.stopPropagation();
				this.close();
			}
		},

		// 最前面へ移動
		top() {
			let z = 0;
			const ws = Array.from(os.windows.values()).filter(w => w !== this);
			for (const w of ws) {
				const m = w.$el;
				const mz = Number(document.defaultView.getComputedStyle(m, null).zIndex);
				if (mz > z) z = mz;
			}
			if (z > 0) {
				(this.$el as any).style.zIndex = z + 1;
			}
		},

		onBodyMousedown() {
			this.top();
		},

		onHeaderMousedown(e) {
			const main = this.$el as any;

			if (!contains(main, document.activeElement)) main.focus();

			const position = main.getBoundingClientRect();

			const clickX = e.clientX;
			const clickY = e.clientY;
			const moveBaseX = clickX - position.left;
			const moveBaseY = clickY - position.top;
			const browserWidth = window.innerWidth;
			const browserHeight = window.innerHeight;
			const windowWidth = main.offsetWidth;
			const windowHeight = main.offsetHeight;

			// 動かした時
			dragListen(me => {
				let moveLeft = me.clientX - moveBaseX;
				let moveTop = me.clientY - moveBaseY;

				// 下はみ出し
				if (moveTop + windowHeight > browserHeight) moveTop = browserHeight - windowHeight;

				// 左はみ出し
				if (moveLeft < 0) moveLeft = 0;

				// 上はみ出し
				if (moveTop < 0) moveTop = 0;

				// 右はみ出し
				if (moveLeft + windowWidth > browserWidth) moveLeft = browserWidth - windowWidth;

				this.$el.style.left = moveLeft + 'px';
				this.$el.style.top = moveTop + 'px';
			});
		},

		// 上ハンドル掴み時
		onTopHandleMousedown(e) {
			const main = this.$el as any;

			const base = e.clientY;
			const height = parseInt(getComputedStyle(main, '').height, 10);
			const top = parseInt(getComputedStyle(main, '').top, 10);

			// 動かした時
			dragListen(me => {
				const move = me.clientY - base;
				if (top + move > 0) {
					if (height + -move > minHeight) {
						this.applyTransformHeight(height + -move);
						this.applyTransformTop(top + move);
					} else { // 最小の高さより小さくなろうとした時
						this.applyTransformHeight(minHeight);
						this.applyTransformTop(top + (height - minHeight));
					}
				} else { // 上のはみ出し時
					this.applyTransformHeight(top + height);
					this.applyTransformTop(0);
				}
			});
		},

		// 右ハンドル掴み時
		onRightHandleMousedown(e) {
			const main = this.$el as any;

			const base = e.clientX;
			const width = parseInt(getComputedStyle(main, '').width, 10);
			const left = parseInt(getComputedStyle(main, '').left, 10);
			const browserWidth = window.innerWidth;

			// 動かした時
			dragListen(me => {
				const move = me.clientX - base;
				if (left + width + move < browserWidth) {
					if (width + move > minWidth) {
						this.applyTransformWidth(width + move);
					} else { // 最小の幅より小さくなろうとした時
						this.applyTransformWidth(minWidth);
					}
				} else { // 右のはみ出し時
					this.applyTransformWidth(browserWidth - left);
				}
			});
		},

		// 下ハンドル掴み時
		onBottomHandleMousedown(e) {
			const main = this.$el as any;

			const base = e.clientY;
			const height = parseInt(getComputedStyle(main, '').height, 10);
			const top = parseInt(getComputedStyle(main, '').top, 10);
			const browserHeight = window.innerHeight;

			// 動かした時
			dragListen(me => {
				const move = me.clientY - base;
				if (top + height + move < browserHeight) {
					if (height + move > minHeight) {
						this.applyTransformHeight(height + move);
					} else { // 最小の高さより小さくなろうとした時
						this.applyTransformHeight(minHeight);
					}
				} else { // 下のはみ出し時
					this.applyTransformHeight(browserHeight - top);
				}
			});
		},

		// 左ハンドル掴み時
		onLeftHandleMousedown(e) {
			const main = this.$el as any;

			const base = e.clientX;
			const width = parseInt(getComputedStyle(main, '').width, 10);
			const left = parseInt(getComputedStyle(main, '').left, 10);

			// 動かした時
			dragListen(me => {
				const move = me.clientX - base;
				if (left + move > 0) {
					if (width + -move > minWidth) {
						this.applyTransformWidth(width + -move);
						this.applyTransformLeft(left + move);
					} else { // 最小の幅より小さくなろうとした時
						this.applyTransformWidth(minWidth);
						this.applyTransformLeft(left + (width - minWidth));
					}
				} else { // 左のはみ出し時
					this.applyTransformWidth(left + width);
					this.applyTransformLeft(0);
				}
			});
		},

		// 左上ハンドル掴み時
		onTopLeftHandleMousedown(e) {
			this.onTopHandleMousedown(e);
			this.onLeftHandleMousedown(e);
		},

		// 右上ハンドル掴み時
		onTopRightHandleMousedown(e) {
			this.onTopHandleMousedown(e);
			this.onRightHandleMousedown(e);
		},

		// 右下ハンドル掴み時
		onBottomRightHandleMousedown(e) {
			this.onBottomHandleMousedown(e);
			this.onRightHandleMousedown(e);
		},

		// 左下ハンドル掴み時
		onBottomLeftHandleMousedown(e) {
			this.onBottomHandleMousedown(e);
			this.onLeftHandleMousedown(e);
		},

		// 高さを適用
		applyTransformHeight(height) {
			(this.$el as any).style.height = height + 'px';
		},

		// 幅を適用
		applyTransformWidth(width) {
			(this.$el as any).style.width = width + 'px';
		},

		// Y座標を適用
		applyTransformTop(top) {
			(this.$el as any).style.top = top + 'px';
		},

		// X座標を適用
		applyTransformLeft(left) {
			(this.$el as any).style.left = left + 'px';
		},
	}
});
</script>

<style lang="scss" scoped>
.ebkgocck {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 5000;

	> .body {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		contain: content;
		width: 100%;
    height: 100%;

		--section-padding: 24px;

		@media (max-width: 500px) {
			--section-padding: 16px;
		}

		> .header {
			$height: 50px;
			display: flex;
			flex-shrink: 0;
			box-shadow: 0px 1px var(--divider);
			cursor: move;

			> button {
				height: $height;
				width: $height;
			}

			> .title {
				flex: 1;
				line-height: $height;
				padding-left: 32px;
				font-weight: bold;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				pointer-events: none;
			}

			> button + .title {
				padding-left: 0;
			}
		}

		> .body {
			flex: 1;
			overflow: auto;
		}
	}

	> .handle {
		$size: 8px;

		position: absolute;

		&.top {
			top: -($size);
			left: 0;
			width: 100%;
			height: $size;
			cursor: ns-resize;
		}

		&.right {
			top: 0;
			right: -($size);
			width: $size;
			height: 100%;
			cursor: ew-resize;
		}

		&.bottom {
			bottom: -($size);
			left: 0;
			width: 100%;
			height: $size;
			cursor: ns-resize;
		}

		&.left {
			top: 0;
			left: -($size);
			width: $size;
			height: 100%;
			cursor: ew-resize;
		}

		&.top-left {
			top: -($size);
			left: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nwse-resize;
		}

		&.top-right {
			top: -($size);
			right: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nesw-resize;
		}

		&.bottom-right {
			bottom: -($size);
			right: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nwse-resize;
		}

		&.bottom-left {
			bottom: -($size);
			left: -($size);
			width: $size * 2;
			height: $size * 2;
			cursor: nesw-resize;
		}
	}
}
</style>
