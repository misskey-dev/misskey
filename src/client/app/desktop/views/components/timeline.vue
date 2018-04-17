<template>
<div class="mk-timeline">
	<header>
		<span :data-is-active="src == 'home'" @click="src = 'home'">%fa:home% ホーム</span>
		<span :data-is-active="src == 'local'" @click="src = 'local'">%fa:R comments% ローカル</span>
		<span :data-is-active="src == 'global'" @click="src = 'global'">%fa:globe% グローバル</span>
	</header>
	<x-core v-if="src == 'home'" ref="tl" key="home" src="home"/>
	<x-core v-if="src == 'local'" ref="tl" key="local" src="local"/>
	<x-core v-if="src == 'global'" ref="tl" key="global" src="global"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XCore from './timeline.core.vue';

export default Vue.extend({
	components: {
		XCore
	},

	data() {
		return {
			src: 'home'
		};
	},

	mounted() {
		document.addEventListener('keydown', this.onKeydown);
		window.addEventListener('scroll', this.onScroll);

		console.log(this.$refs.tl);

		(this.$refs.tl as any).$once('loaded', () => {
			this.$emit('loaded');
		});
	},

	beforeDestroy() {
		document.removeEventListener('keydown', this.onKeydown);
		window.removeEventListener('scroll', this.onScroll);
	},

	methods: {
		onScroll() {
			if ((this as any).os.i.clientSettings.fetchOnScroll !== false) {
				const current = window.scrollY + window.innerHeight;
				if (current > document.body.offsetHeight - 8) (this.$refs.tl as any).more();
			}
		},

		onKeydown(e) {
			if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
				if (e.which == 84) { // t
					(this.$refs.tl as any).focus();
				}
			}
		},

		warp(date) {
			(this.$refs.tl as any).warp(date);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-timeline
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	> header
		padding 8px 16px
		border-bottom solid 1px #eee

		> span
			margin-right 16px
			line-height 27px
			font-size 14px
			color #555

			&:not([data-is-active])
				color $theme-color
				cursor pointer

				&:hover
					text-decoration underline

</style>
