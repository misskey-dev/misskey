<template>
<div class="dnpfarvgbnfmyzbdquhhzyxcmstpdqzs">
	<header :class="{ indicate }">
		<slot name="header"></slot>
		<button ref="menu" @click="menu">%fa:caret-down%</button>
	</header>
	<div ref="body">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Menu from '../../../../common/views/components/menu.vue';

export default Vue.extend({
	props: {
		id: {
			type: String,
			required: false
		}
	},

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
		},

		menu() {
			this.os.new(Menu, {
				source: this.$refs.menu,
				compact: false,
				items: [{
					content: '%fa:arrow-left% %i18n:@swap-left%',
					onClick: () => {
						this.$store.dispatch('settings/swapLeftDeckColumn', this.id);
					}
				}, {
					content: '%fa:arrow-right% %i18n:@swap-right%',
					onClick: () => {
						this.$store.dispatch('settings/swapRightDeckColumn', this.id);
					}
				}, {
					content: '%fa:trash-alt R% %i18n:@remove%',
					onClick: () => {
						this.$store.dispatch('settings/removeDeckColumn', this.id);
					}
				}]
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	$header-height = 42px

	flex 1
	min-width 330px
	max-width 330px
	height 100%
	background isDark ? #282C37 : #fff
	border-radius 6px
	box-shadow 0 2px 16px rgba(#000, 0.1)
	overflow hidden

	> header
		z-index 1
		line-height $header-height
		padding 0 16px
		color isDark ? #e3e5e8 : #888
		background isDark ? #313543 : #fff
		box-shadow 0 1px rgba(#000, 0.15)

		&.indicate
			box-shadow 0 3px 0 0 $theme-color

		> span
			[data-fa]
				margin-right 8px

		> button
			position absolute
			top 0
			right 0
			width $header-height
			line-height $header-height
			color isDark ? #9baec8 : #ccc

			&:hover
				color isDark ? #b2c1d5 : #aaa

			&:active
				color isDark ? #b2c1d5 : #999

	> div
		height calc(100% - $header-height)
		overflow auto
		overflow-x hidden

.dnpfarvgbnfmyzbdquhhzyxcmstpdqzs[data-darkmode]
	root(true)

.dnpfarvgbnfmyzbdquhhzyxcmstpdqzs:not([data-darkmode])
	root(false)

</style>
