<template>
<div class="dnpfarvgbnfmyzbdquhhzyxcmstpdqzs">
	<header>
		<slot name="header"></slot>
	</header>
	<div ref="body">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XTl from './deck.tl.vue';

export default Vue.extend({
	components: {
		XTl
	},
	provide() {
		return {
			getColumn() {
				return this;
			},
			getScrollContainer() {
				return this.$refs.body;
			}
		};
	},
	mounted() {
		this.$nextTick(() => {
			this.$emit('mounted');

			setInterval(() => {
				this.$emit('mounted');
			}, 100);
		});
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	flex 1
	min-width 330px
	max-width 330px
	height 100%
	margin-right 16px
	background isDark ? #282C37 : #fff
	border-radius 6px
	box-shadow 0 2px 16px rgba(#000, 0.1)
	overflow hidden

	> header
		z-index 1
		line-height 42px
		padding 0 16px
		color isDark ? #e3e5e8 : #888
		background isDark ? #313543 : #fff
		box-shadow 0 1px rgba(#000, 0.15)

	> div
		height calc(100% - 42px)
		overflow auto
		overflow-x hidden

.dnpfarvgbnfmyzbdquhhzyxcmstpdqzs[data-darkmode]
	root(true)

.dnpfarvgbnfmyzbdquhhzyxcmstpdqzs:not([data-darkmode])
	root(false)

</style>
