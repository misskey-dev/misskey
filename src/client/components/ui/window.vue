<template>
<transition :name="$store.state.device.animation ? 'window' : ''" appear @after-leave="$emit('closed')">
	<div class="ebkgocck" v-if="showing">
		<div class="body _popup _shadow _narrow_" @mousedown="onBodyMousedown" @keydown="onKeydown">
			<div class="header">
				<button class="_button" @click="close()"><Fa :icon="faTimes"/></button>
				<span class="title" @mousedown.prevent="onHeaderMousedown" @touchstart.prevent="onHeaderMousedown">
					<slot name="header"></slot>
				</span>
				<slot name="buttons"></slot>
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
</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import contains from '@/scripts/contains';
import * as os from '@/os';

const minHeight = 50;
const minWidth = 250;

function dragListen(fn) {
	window.addEventListener('mousemove',  fn);
	window.addEventListener('touchmove',  fn);
	window.addEventListener('mouseleave', dragClear.bind(null, fn));
	window.addEventListener('mouseup',    dragClear.bind(null, fn));
	window.addEventListener('touchend',   dragClear.bind(null, fn));
}

function dragClear(fn) {
	window.removeEventListener('mousemove',  fn);
	window.removeEventListener('touchmove',  fn);
	window.removeEventListener('mouseleave', dragClear);
	window.removeEventListener('mouseup',    dragClear);
	window.removeEventListener('touchend',   dragClear);
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

	emits: ['closed'],

	data() {
		return {
			showing: true,
			id: Math.random().toString(), // TODO: UUIDとかにする
			faTimes
		};
	},

	mounted() {
		if (this.initialWidth) this.applyTransformWidth(this.initialWidth);
		if (this.initialHeight) this.applyTransformHeight(this.initialHeight);

		this.applyTransformTop((window.innerHeight / 2) - (this.$el.offsetHeight / 2));
		this.applyTransformLeft((window.innerWidth / 2) - (this.$el.offsetWidth / 2));

		os.windows.set(this.id, {
			z: Number(document.defaultView.getComputedStyle(this.$el, null).zIndex)
		});

		window.addEventListener('resize', this.onBrowserResize);
	},

	unmounted() {
		os.windows.delete(this.id);
		window.removeEventListener('resize', this.onBrowserResize);
	},

	methods: {
		close() {
			this.showing = false;
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
			const ws = Array.from(os.windows.entries()).filter(([k, v]) => k !== this.id).map(([k, v]) => v);
			for (const w of ws) {
				if (w.z > z) z = w.z;
			}
			if (z > 0) {
				(this.$el as any).style.zIndex = z + 1;
				os.windows.set(this.id, {
					z: z + 1
				});
			}
		},

		onBodyMousedown() {
			this.top();
		},

		onHeaderMousedown(e) {
			const main = this.$el as any;

			if (!contains(main, document.activeElement)) main.focus();

			const position = main.getBoundingClientRect();

			const clickX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
			const clickY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
			const moveBaseX = clickX - position.left;
			const moveBaseY = clickY - position.top;
			const browserWidth = window.innerWidth;
			const browserHeight = window.innerHeight;
			const windowWidth = main.offsetWidth;
			const windowHeight = main.offsetHeight;

			// 動かした時
			dragListen(me => {
				const x = me.touches && me.touches.length > 0 ? me.touches[0].clientX : me.clientX;
				const y = me.touches && me.touches.length > 0 ? me.touches[0].clientY : me.clientY;

				let moveLeft = x - moveBaseX;
				let moveTop = y - moveBaseY;

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

		onBrowserResize() {
			const main = this.$el as any;
			const position = main.getBoundingClientRect();
			const browserWidth = window.innerWidth;
			const browserHeight = window.innerHeight;
			const windowWidth = main.offsetWidth;
			const windowHeight = main.offsetHeight;
			if (position.left < 0) main.style.left = 0;     // 左はみ出し
			if (position.top + windowHeight > browserHeight) main.style.top = browserHeight - windowHeight + 'px';  // 下はみ出し
			if (position.left + windowWidth > browserWidth) main.style.left = browserWidth - windowWidth + 'px';    // 右はみ出し
			if (position.top < 0) main.style.top = 0;       // 上はみ出し
		}
	}
});
</script>

<style lang="scss" scoped>
.window-enter-active, .window-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.window-enter-from, .window-leave-to {
	pointer-events: none;
	opacity: 0;
	transform: scale(0.9);
}

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

		--section-padding: 16px;

		> .header {
			$height: 50px;
			display: flex;
			flex-shrink: 0;
			box-shadow: 0px 1px var(--divider);
			cursor: move;
			user-select: none;

			> ::v-deep(button) {
				height: $height;
				width: $height;
			}

			> .title {
				flex: 1;
				line-height: $height;
				font-weight: bold;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
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
