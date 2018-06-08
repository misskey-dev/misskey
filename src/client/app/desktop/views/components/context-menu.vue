<template>
<div class="context-menu" @contextmenu.prevent="() => {}">
	<x-menu :menu="menu" @x="click"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';
import contains from '../../../common/scripts/contains';
import XMenu from './context-menu.menu.vue';

export default Vue.extend({
	components: {
		XMenu
	},
	props: ['x', 'y', 'menu'],
	mounted() {
		this.$nextTick(() => {
			const width = this.$el.offsetWidth;
			const height = this.$el.offsetHeight;

			let x = this.x;
			let y = this.y;

			if (x + width > window.innerWidth) {
				x = window.innerWidth - width;
			}

			if (y + height > window.innerHeight) {
				y = window.innerHeight - height;
			}

			this.$el.style.left = x + 'px';
			this.$el.style.top = y + 'px';

			Array.from(document.querySelectorAll('body *')).forEach(el => {
				el.addEventListener('mousedown', this.onMousedown);
			});

			this.$el.style.display = 'block';

			anime({
				targets: this.$el,
				opacity: [0, 1],
				duration: 100,
				easing: 'linear'
			});
		});
	},
	methods: {
		onMousedown(e) {
			e.preventDefault();
			if (!contains(this.$el, e.target) && (this.$el != e.target)) this.close();
			return false;
		},
		click(item) {
			if (item.action) item.action();
			this.close();
		},
		close() {
			Array.from(document.querySelectorAll('body *')).forEach(el => {
				el.removeEventListener('mousedown', this.onMousedown);
			});

			this.$emit('closed');
			this.$destroy();
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	$width = 240px
	$item-height = 38px
	$padding = 10px

	position fixed
	top 0
	left 0
	z-index 4096
	width $width
	font-size 0.8em
	background isDark ? #282c37 : #fff
	border-radius 0 4px 4px 4px
	box-shadow 2px 2px 8px rgba(#000, 0.2)
	opacity 0

.context-menu[data-darkmode]
	root(true)

.context-menu:not([data-darkmode])
	root(false)

</style>
