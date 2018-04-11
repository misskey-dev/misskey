<template>
<div class="context-menu" :style="{ left: `${x}px`, top: `${y}px` }" @contextmenu.prevent="() => {}">
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
			if (item.onClick) item.onClick();
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
.context-menu
	$width = 240px
	$item-height = 38px
	$padding = 10px

	display none
	position fixed
	top 0
	left 0
	z-index 4096
	width $width
	font-size 0.8em
	background #fff
	border-radius 0 4px 4px 4px
	box-shadow 2px 2px 8px rgba(0, 0, 0, 0.2)
	opacity 0

</style>
