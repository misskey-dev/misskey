<template>
<div class="mkw-balance nxqgvwhnuthzathxvfmmkcjcxheqldsg">
	<mk-widget-container :show-header="false">
		<div class="nxqgvwhnuthzathxvfmmkcjcxheqldsg-body">
			<button class="toggle" @click="toggle" title="%i18n:@toggle%">%fa:sort%</button>
			<div v-show="props.view == 0" class="a">
				<svg viewBox="0 0 1 1" preserveAspectRatio="none">
					<circle
						r="0.25"
						cx="50%" cy="50%"
						fill="none"
						stroke-width="0.025"
						stroke="#0ff"/>
				</svg>
				<div>
					<b>{{ $store.state.i.balance | number }}</b>
					<div>TOTAL</div>
				</div>
				<span class="credits">CREDITS</span>
				<span class="x"><b>■</b><i>TEXT</i></span>
			</div>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';

export default define({
	name: 'balance',
	props: () => ({
		view: 0
	})
}).extend({
	methods: {
		toggle() {
			if (this.props.view == 3) {
				this.props.view = 0;
			} else {
				this.props.view++;
			}
			this.save();
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	.nxqgvwhnuthzathxvfmmkcjcxheqldsg-body
		text-align center
		padding 16px
		color isDark ? #fff : #222

		> .toggle
			position absolute
			top 0
			right 0
			padding 16px
			color isDark ? #9baec8 : #ccc

			&:hover
				color isDark ? #b2c1d5 : #aaa

			&:active
				color isDark ? #b2c1d5 : #999

		> div.a
			> svg
				position absolute
				top 0
				left 0
				right 0
				bottom 0
				margin auto

			> div
				padding 48px
				font-size 20px

				> div
					font-size 50%
					opacity 0.5

			> .credits
				position absolute
				bottom 0
				left 0
				font-size 12px
				opacity 0.5

			> .x
				position absolute
				bottom 0
				right 0
				font-size 12px

				> b
					color #0ff

				> i
					opacity 0.5

.nxqgvwhnuthzathxvfmmkcjcxheqldsg[data-darkmode]
	root(true)

.nxqgvwhnuthzathxvfmmkcjcxheqldsg:not([data-darkmode])
	root(false)

</style>
