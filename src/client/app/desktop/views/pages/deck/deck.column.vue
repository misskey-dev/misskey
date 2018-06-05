<template>
<div class="dnpfarvgbnfmyzbdquhhzyxcmstpdqzs">
	<header :class="{ indicate }">
		<slot name="header"></slot>
	</header>
	<div ref="body">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			indicate: false
		};
	},

	provide() {
		return {
			column: this,
			isScrollTop: this.isScrollTop,
			indicate: v => this.indicate = v
		};
	},

	mounted() {
		this.$refs.body.addEventListener('scroll', this.onScroll);
	},
	beforeDestroy() {
		this.$refs.body.removeEventListener('scroll', this.onScroll);
	},

	methods: {
		isScrollTop() {
			return this.$refs.body.scrollTop == 0;
		},

		onScroll() {
			if (this.isScrollTop()) {
				this.$emit('top');
			}

			if (this.$store.state.settings.fetchOnScroll !== false) {
				const current = this.$refs.body.scrollTop + this.$refs.body.clientHeight;
				if (current > this.$refs.body.scrollHeight - 1) this.$emit('bottom');
			}
		}
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

		&.indicate
			box-shadow 0 3px 0 0 $theme-color

	> div
		height calc(100% - 42px)
		overflow auto
		overflow-x hidden

.dnpfarvgbnfmyzbdquhhzyxcmstpdqzs[data-darkmode]
	root(true)

.dnpfarvgbnfmyzbdquhhzyxcmstpdqzs:not([data-darkmode])
	root(false)

</style>
