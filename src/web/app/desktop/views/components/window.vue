<template>
<div class="mk-window" :data-flexible="isFlexible" @dragover="onDragover">
	<div class="bg" ref="bg" v-show="isModal" @click="onBgClick"></div>
	<div class="main" ref="main" tabindex="-1" :data-is-modal="isModal" @mousedown="onBodyMousedown" @keydown="onKeydown" :style="{ width, height }">
		<div class="body">
			<header ref="header" @mousedown="onHeaderMousedown">
				<h1 data-yield="header"><yield from="header"/></h1>
				<div>
					<button class="popout" v-if="popoutUrl" @mousedown="repelMove" @click="popout" title="ポップアウト">%fa:R window-restore%</button>
					<button class="close" v-if="canClose" @mousedown="repelMove" @click="close" title="閉じる">%fa:times%</button>
				</div>
			</header>
			<div class="content" data-yield="content"><yield from="content"/></div>
		</div>
		<div class="handle top" v-if="canResize" @mousedown="onTopHandleMousedown"></div>
		<div class="handle right" v-if="canResize" @mousedown="onRightHandleMousedown"></div>
		<div class="handle bottom" v-if="canResize" @mousedown="onBottomHandleMousedown"></div>
		<div class="handle left" v-if="canResize" @mousedown="onLeftHandleMousedown"></div>
		<div class="handle top-left" v-if="canResize" @mousedown="onTopLeftHandleMousedown"></div>
		<div class="handle top-right" v-if="canResize" @mousedown="onTopRightHandleMousedown"></div>
		<div class="handle bottom-right" v-if="canResize" @mousedown="onBottomRightHandleMousedown"></div>
		<div class="handle bottom-left" v-if="canResize" @mousedown="onBottomLeftHandleMousedown"></div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';
import contains from '../../common/scripts/contains';

const minHeight = 40;
const minWidth = 200;

export default Vue.extend({
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
			type: String
		}
	},
	computed: {
		isFlexible(): boolean {
			return this.height == null;
		},
		canResize(): boolean {
			return !this.isFlexible;
		}
	},
	mounted() {

	}
});
</script>


<script lang="typescript">

this.on('mount', () => {

	this.$refs.main.style.top = '15%';
	this.$refs.main.style.left = (window.innerWidth / 2) - (this.$refs.main.offsetWidth / 2) + 'px';

	this.$refs.header.addEventListener('contextmenu', e => {
		e.preventDefault();
	});

	window.addEventListener('resize', this.onBrowserResize);

	this.open();
});

this.on('unmount', () => {
	window.removeEventListener('resize', this.onBrowserResize);
});

this.onBrowserResize = () => {
	const position = this.$refs.main.getBoundingClientRect();
	const browserWidth = window.innerWidth;
	const browserHeight = window.innerHeight;
	const windowWidth = this.$refs.main.offsetWidth;
	const windowHeight = this.$refs.main.offsetHeight;
	if (position.left < 0) this.$refs.main.style.left = 0;
	if (position.top < 0) this.$refs.main.style.top = 0;
	if (position.left + windowWidth > browserWidth) this.$refs.main.style.left = browserWidth - windowWidth + 'px';
	if (position.top + windowHeight > browserHeight) this.$refs.main.style.top = browserHeight - windowHeight + 'px';
};

this.open = () => {
	this.$emit('opening');

	this.top();

	if (this.isModal) {
		this.$refs.bg.style.pointerEvents = 'auto';
		anime({
			targets: this.$refs.bg,
			opacity: 1,
			duration: 100,
			easing: 'linear'
		});
	}

	this.$refs.main.style.pointerEvents = 'auto';
	anime({
		targets: this.$refs.main,
		opacity: 1,
		scale: [1.1, 1],
		duration: 200,
		easing: 'easeOutQuad'
	});

	//this.$refs.main.focus();

	setTimeout(() => {
		this.$emit('opened');
	}, 300);
};

this.popout = () => {
	const position = this.$refs.main.getBoundingClientRect();

	const width = parseInt(getComputedStyle(this.$refs.main, '').width, 10);
	const height = parseInt(getComputedStyle(this.$refs.main, '').height, 10);
	const x = window.screenX + position.left;
	const y = window.screenY + position.top;

	const url = typeof this.popoutUrl == 'function' ? this.popoutUrl() : this.popoutUrl;

	window.open(url, url,
		`height=${height},width=${width},left=${x},top=${y}`);

	this.close();
};

this.close = () => {
	this.$emit('closing');

	if (this.isModal) {
		this.$refs.bg.style.pointerEvents = 'none';
		anime({
			targets: this.$refs.bg,
			opacity: 0,
			duration: 300,
			easing: 'linear'
		});
	}

	this.$refs.main.style.pointerEvents = 'none';

	anime({
		targets: this.$refs.main,
		opacity: 0,
		scale: 0.8,
		duration: 300,
		easing: [0.5, -0.5, 1, 0.5]
	});

	setTimeout(() => {
		this.$emit('closed');
	}, 300);
};

// 最前面へ移動します
this.top = () => {
	let z = 0;

	const ws = document.querySelectorAll('mk-window');
	ws.forEach(w => {
		if (w == this.root) return;
		const m = w.querySelector(':scope > .main');
		const mz = Number(document.defaultView.getComputedStyle(m, null).zIndex);
		if (mz > z) z = mz;
	});

	if (z > 0) {
		this.$refs.main.style.zIndex = z + 1;
		if (this.isModal) this.$refs.bg.style.zIndex = z + 1;
	}
};

this.repelMove = e => {
	e.stopPropagation();
	return true;
};

this.bgClick = () => {
	if (this.canClose) this.close();
};

this.onBodyMousedown = () => {
	this.top();
};

// ヘッダー掴み時
this.onHeaderMousedown = e => {
	e.preventDefault();

	if (!contains(this.$refs.main, document.activeElement)) this.$refs.main.focus();

	const position = this.$refs.main.getBoundingClientRect();

	const clickX = e.clientX;
	const clickY = e.clientY;
	const moveBaseX = clickX - position.left;
	const moveBaseY = clickY - position.top;
	const browserWidth = window.innerWidth;
	const browserHeight = window.innerHeight;
	const windowWidth = this.$refs.main.offsetWidth;
	const windowHeight = this.$refs.main.offsetHeight;

	// 動かした時
	dragListen(me => {
		let moveLeft = me.clientX - moveBaseX;
		let moveTop = me.clientY - moveBaseY;

		// 上はみ出し
		if (moveTop < 0) moveTop = 0;

		// 左はみ出し
		if (moveLeft < 0) moveLeft = 0;

		// 下はみ出し
		if (moveTop + windowHeight > browserHeight) moveTop = browserHeight - windowHeight;

		// 右はみ出し
		if (moveLeft + windowWidth > browserWidth) moveLeft = browserWidth - windowWidth;

		this.$refs.main.style.left = moveLeft + 'px';
		this.$refs.main.style.top = moveTop + 'px';
	});
};

// 上ハンドル掴み時
this.onTopHandleMousedown = e => {
	e.preventDefault();

	const base = e.clientY;
	const height = parseInt(getComputedStyle(this.$refs.main, '').height, 10);
	const top = parseInt(getComputedStyle(this.$refs.main, '').top, 10);

	// 動かした時
	dragListen(me => {
		const move = me.clientY - base;
		if (top + move > 0) {
			if (height + -move > this.minHeight) {
				this.applyTransformHeight(height + -move);
				this.applyTransformTop(top + move);
			} else { // 最小の高さより小さくなろうとした時
				this.applyTransformHeight(this.minHeight);
				this.applyTransformTop(top + (height - this.minHeight));
			}
		} else { // 上のはみ出し時
			this.applyTransformHeight(top + height);
			this.applyTransformTop(0);
		}
	});
};

// 右ハンドル掴み時
this.onRightHandleMousedown = e => {
	e.preventDefault();

	const base = e.clientX;
	const width = parseInt(getComputedStyle(this.$refs.main, '').width, 10);
	const left = parseInt(getComputedStyle(this.$refs.main, '').left, 10);
	const browserWidth = window.innerWidth;

	// 動かした時
	dragListen(me => {
		const move = me.clientX - base;
		if (left + width + move < browserWidth) {
			if (width + move > this.minWidth) {
				this.applyTransformWidth(width + move);
			} else { // 最小の幅より小さくなろうとした時
				this.applyTransformWidth(this.minWidth);
			}
		} else { // 右のはみ出し時
			this.applyTransformWidth(browserWidth - left);
		}
	});
};

// 下ハンドル掴み時
this.onBottomHandleMousedown = e => {
	e.preventDefault();

	const base = e.clientY;
	const height = parseInt(getComputedStyle(this.$refs.main, '').height, 10);
	const top = parseInt(getComputedStyle(this.$refs.main, '').top, 10);
	const browserHeight = window.innerHeight;

	// 動かした時
	dragListen(me => {
		const move = me.clientY - base;
		if (top + height + move < browserHeight) {
			if (height + move > this.minHeight) {
				this.applyTransformHeight(height + move);
			} else { // 最小の高さより小さくなろうとした時
				this.applyTransformHeight(this.minHeight);
			}
		} else { // 下のはみ出し時
			this.applyTransformHeight(browserHeight - top);
		}
	});
};

// 左ハンドル掴み時
this.onLeftHandleMousedown = e => {
	e.preventDefault();

	const base = e.clientX;
	const width = parseInt(getComputedStyle(this.$refs.main, '').width, 10);
	const left = parseInt(getComputedStyle(this.$refs.main, '').left, 10);

	// 動かした時
	dragListen(me => {
		const move = me.clientX - base;
		if (left + move > 0) {
			if (width + -move > this.minWidth) {
				this.applyTransformWidth(width + -move);
				this.applyTransformLeft(left + move);
			} else { // 最小の幅より小さくなろうとした時
				this.applyTransformWidth(this.minWidth);
				this.applyTransformLeft(left + (width - this.minWidth));
			}
		} else { // 左のはみ出し時
			this.applyTransformWidth(left + width);
			this.applyTransformLeft(0);
		}
	});
};

// 左上ハンドル掴み時
this.onTopLeftHandleMousedown = e => {
	this.onTopHandleMousedown(e);
	this.onLeftHandleMousedown(e);
};

// 右上ハンドル掴み時
this.onTopRightHandleMousedown = e => {
	this.onTopHandleMousedown(e);
	this.onRightHandleMousedown(e);
};

// 右下ハンドル掴み時
this.onBottomRightHandleMousedown = e => {
	this.onBottomHandleMousedown(e);
	this.onRightHandleMousedown(e);
};

// 左下ハンドル掴み時
this.onBottomLeftHandleMousedown = e => {
	this.onBottomHandleMousedown(e);
	this.onLeftHandleMousedown(e);
};

// 高さを適用
this.applyTransformHeight = height => {
	this.$refs.main.style.height = height + 'px';
};

// 幅を適用
this.applyTransformWidth = width => {
	this.$refs.main.style.width = width + 'px';
};

// Y座標を適用
this.applyTransformTop = top => {
	this.$refs.main.style.top = top + 'px';
};

// X座標を適用
this.applyTransformLeft = left => {
	this.$refs.main.style.left = left + 'px';
};

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

this.ondragover = e => {
	e.dataTransfer.dropEffect = 'none';
};

this.onKeydown = e => {
	if (e.which == 27) { // Esc
		if (this.canClose) {
			e.preventDefault();
			e.stopPropagation();
			this.close();
		}
	}
};

</script>


<style lang="stylus" scoped>
.mk-window
	display block

	> .bg
		display block
		position fixed
		z-index 2048
		top 0
		left 0
		width 100%
		height 100%
		background rgba(0, 0, 0, 0.7)
		opacity 0
		pointer-events none

	> .main
		display block
		position fixed
		z-index 2048
		top 15%
		left 0
		margin 0
		opacity 0
		pointer-events none

		&:focus
			&:not([data-is-modal])
				> .body
					box-shadow 0 0 0px 1px rgba($theme-color, 0.5), 0 2px 6px 0 rgba(0, 0, 0, 0.2)

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
			background #fff
			border-radius 6px
			box-shadow 0 2px 6px 0 rgba(0, 0, 0, 0.2)

			> header
				$header-height = 40px

				z-index 128
				height $header-height
				overflow hidden
				white-space nowrap
				cursor move
				background #fff
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
					color #666

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
						font-size 1.2em
						color rgba(#000, 0.4)
						border none
						outline none
						background transparent

						&:hover
							color rgba(#000, 0.6)

						&:active
							color darken(#000, 30%)

						> [data-fa]
							padding 0
							width $header-height
							line-height $header-height
							text-align center

			> .content
				height 100%

	&:not([flexible])
		> .main > .body > .content
			height calc(100% - 40px)

</style>

