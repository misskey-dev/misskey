<template>
<div class="mk-window" :data-flexible="isFlexible" @dragover="onDragover">
	<div class="bg" ref="bg" v-show="isModal" @click="onBgClick"></div>
	<div class="main" ref="main" tabindex="-1" :data-is-modal="isModal" @mousedown="onBodyMousedown" @keydown="onKeydown" :style="{ width, height }">
		<div class="body">
			<header ref="header"
				@contextmenu.prevent="() => {}" @mousedown.prevent="onHeaderMousedown"
			>
				<h1><slot name="header"></slot></h1>
				<div>
					<button class="popout" v-if="popoutUrl" @mousedown.stop="() => {}" @click="popout" :title="$t('popout')">
						<i><fa :icon="['far', 'window-restore']"/></i>
					</button>
					<button class="close" v-if="canClose" @mousedown.stop="() => {}" @click="close" :title="$t('close')">
						<i><fa icon="times"/></i>
					</button>
				</div>
			</header>
			<div class="content">
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
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import anime from 'animejs';
import contains from '../../../common/scripts/contains';

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

export default Vue.extend({
	i18n: i18n('desktop/views/components/window.vue'),
	props: {
		isModal: {
			type: Boolean,
			default: false
		},
		canClose: {
			type: Boolean,
			default: true
		},
		width: {
			type: String,
			default: '530px'
		},
		height: {
			type: String,
			default: 'auto'
		},
		popoutUrl: {
			type: [String, Function],
			default: null
		},
		name: {
			type: String,
			default: null
		},
		animation: {
			type: Boolean,
			required: false,
			default: true
		}
	},

	computed: {
		isFlexible(): boolean {
			return this.height == 'auto';
		},
		canResize(): boolean {
			return !this.isFlexible;
		}
	},

	created() {
		// ウィンドウをウィンドウシステムに登録
		this.$root.os.windows.add(this);
	},

	mounted() {
		this.$nextTick(() => {
			const main = this.$refs.main as any;
			main.style.top = '15%';
			main.style.left = (window.innerWidth / 2) - (main.offsetWidth / 2) + 'px';

			window.addEventListener('resize', this.onBrowserResize);

			this.open();
		});
	},

	destroyed() {
		// ウィンドウをウィンドウシステムから削除
		this.$root.os.windows.remove(this);

		window.removeEventListener('resize', this.onBrowserResize);
	},

	methods: {
		open() {
			this.$emit('opening');

			this.top();

			const bg = this.$refs.bg as any;
			const main = this.$refs.main as any;

			if (this.isModal) {
				bg.style.pointerEvents = 'auto';
				anime({
					targets: bg,
					opacity: 1,
					duration: this.animation ? 100 : 0,
					easing: 'linear'
				});
			}

			main.style.pointerEvents = 'auto';
			anime({
				targets: main,
				opacity: 1,
				scale: [1.1, 1],
				duration: this.animation ? 200 : 0,
				easing: 'easeOutQuad'
			});

			if (focus) main.focus();

			setTimeout(() => {
				this.$emit('opened');
			}, this.animation ? 300 : 0);
		},

		close() {
			this.$emit('before-close');

			const bg = this.$refs.bg as any;
			const main = this.$refs.main as any;

			if (this.isModal) {
				bg.style.pointerEvents = 'none';
				anime({
					targets: bg,
					opacity: 0,
					duration: this.animation ? 300 : 0,
					easing: 'linear'
				});
			}

			main.style.pointerEvents = 'none';

			anime({
				targets: main,
				opacity: 0,
				scale: 0.8,
				duration: this.animation ? 300 : 0,
				easing: 'cubicBezier(0.5, -0.5, 1, 0.5)'
			});

			setTimeout(() => {
				this.$emit('closed');
				this.destroyDom();
			}, this.animation ? 300 : 0);
		},

		popout() {
			const url = typeof this.popoutUrl == 'function' ? this.popoutUrl() : this.popoutUrl;

			const main = this.$refs.main as any;

			if (main) {
				const position = main.getBoundingClientRect();

				const width = parseInt(getComputedStyle(main, '').width, 10);
				const height = parseInt(getComputedStyle(main, '').height, 10);
				const x = window.screenX + position.left;
				const y = window.screenY + position.top;

				window.open(url, url,
					`width=${width}, height=${height}, top=${y}, left=${x}`);

				this.close();
			} else {
				const x = window.top.outerHeight / 2 + window.top.screenY - (parseInt(this.height, 10) / 2);
				const y = window.top.outerWidth / 2 + window.top.screenX - (parseInt(this.width, 10) / 2);
				window.open(url, url,
					`width=${this.width}, height=${this.height}, top=${x}, left=${y}`);
			}
		},

		// 最前面へ移動
		top() {
			let z = 0;

			const ws = Array.from(this.$root.os.windows.getAll()).filter(w => w != this);
			for (const w of ws) {
				const m = w.$refs.main;
				const mz = Number(document.defaultView.getComputedStyle(m, null).zIndex);
				if (mz > z) z = mz;
			}

			if (z > 0) {
				(this.$refs.main as any).style.zIndex = z + 1;
				if (this.isModal) (this.$refs.bg as any).style.zIndex = z + 1;
			}
		},

		onBgClick() {
			if (this.canClose) this.close();
		},

		onBodyMousedown() {
			this.top();
		},

		onHeaderMousedown(e) {
			const main = this.$refs.main as any;

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

				main.style.left = moveLeft + 'px';
				main.style.top = moveTop + 'px';
			});
		},

		// 上ハンドル掴み時
		onTopHandleMousedown(e) {
			const main = this.$refs.main as any;

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
			const main = this.$refs.main as any;

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
			const main = this.$refs.main as any;

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
			const main = this.$refs.main as any;

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
			(this.$refs.main as any).style.height = height + 'px';
		},

		// 幅を適用
		applyTransformWidth(width) {
			(this.$refs.main as any).style.width = width + 'px';
		},

		// Y座標を適用
		applyTransformTop(top) {
			(this.$refs.main as any).style.top = top + 'px';
		},

		// X座標を適用
		applyTransformLeft(left) {
			(this.$refs.main as any).style.left = left + 'px';
		},

		onDragover(e) {
			e.dataTransfer.dropEffect = 'none';
		},

		onKeydown(e) {
			if (e.which == 27) { // Esc
				if (this.canClose) {
					e.preventDefault();
					e.stopPropagation();
					this.close();
				}
			}
		},

		onBrowserResize() {
			const main = this.$refs.main as any;
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

<style lang="stylus" scoped>
.mk-window
	display block

	> .bg
		display block
		position fixed
		z-index 2000
		top 0
		left 0
		width 100%
		height 100%
		background rgba(#000, 0.7)
		opacity 0
		pointer-events none

	> .main
		display block
		position fixed
		z-index 2000
		top 15%
		left 0
		margin 0
		opacity 0
		pointer-events none

		&:focus
			&:not([data-is-modal])
				> .body
						box-shadow 0 0 0 1px var(--primaryAlpha05), 0 2px 12px 0 var(--desktopWindowShadow)

		> .handle
			$size = 8px

			position absolute

			&.top
				top -($size)
				left 0
				width 100%
				height $size
				cursor ns-resize

			&.right
				top 0
				right -($size)
				width $size
				height 100%
				cursor ew-resize

			&.bottom
				bottom -($size)
				left 0
				width 100%
				height $size
				cursor ns-resize

			&.left
				top 0
				left -($size)
				width $size
				height 100%
				cursor ew-resize

			&.top-left
				top -($size)
				left -($size)
				width $size * 2
				height $size * 2
				cursor nwse-resize

			&.top-right
				top -($size)
				right -($size)
				width $size * 2
				height $size * 2
				cursor nesw-resize

			&.bottom-right
				bottom -($size)
				right -($size)
				width $size * 2
				height $size * 2
				cursor nwse-resize

			&.bottom-left
				bottom -($size)
				left -($size)
				width $size * 2
				height $size * 2
				cursor nesw-resize

		> .body
			height 100%
			overflow hidden
			background var(--face)
			border-radius 6px
			box-shadow 0 2px 12px 0 rgba(#000, 0.5)

			> header
				$header-height = 40px

				z-index 1001
				height $header-height
				overflow hidden
				white-space nowrap
				cursor move
				background var(--faceHeader)
				border-radius 6px 6px 0 0
				box-shadow 0 1px 0 rgba(#000, 0.1)

				&, *
					user-select none

				> h1
					pointer-events none
					display block
					margin 0 auto
					overflow hidden
					height $header-height
					text-overflow ellipsis
					text-align center
					font-size 1em
					line-height $header-height
					font-weight normal
					color var(--desktopWindowTitle)

				> div:last-child
					position absolute
					top 0
					right 0
					display block
					z-index 1

					> *
						display inline-block
						margin 0
						padding 0
						cursor pointer
						font-size 1em
						color var(--faceTextButton)
						border none
						outline none
						background transparent

						&:hover
							color var(--faceTextButtonHover)

						&:active
							color var(--faceTextButtonActive)

						> i
							display inline-block
							padding 0
							width $header-height
							line-height $header-height
							text-align center

			> .content
				height 100%
				overflow auto

	&:not([flexible])
		> .main > .body > .content
			height calc(100% - 40px)

</style>
