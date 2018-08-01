<template>
<div class="mkw-tips">
	<p ref="tip">%fa:R lightbulb%<span v-html="tip"></span></p>
</div>
</template>

<script lang="ts">
import * as anime from 'animejs';
import define from '../../../common/define-widget';

const tips = [
	'%i18n:@tips-line1%',
	'%i18n:@tips-line2%',
	'%i18n:@tips-line3%',
	'%i18n:@tips-line4%',
	'%i18n:@tips-line5%',
	'%i18n:@tips-line6%',
	'%i18n:@tips-line7%',
	'%i18n:@tips-line8%',
	'%i18n:@tips-line9%',
	'%i18n:@tips-line10%',
	'%i18n:@tips-line11%',
	'%i18n:@tips-line12%',
	'%i18n:@tips-line13%',
	'%i18n:@tips-line14%',
	'%i18n:@tips-line15%',
	'%i18n:@tips-line16%',
	'%i18n:@tips-line17%',
	'%i18n:@tips-line18%',
	'%i18n:@tips-line19%',
	'%i18n:@tips-line20%',
	'%i18n:@tips-line21%',
	'%i18n:@tips-line22%',
	'%i18n:@tips-line23%',
	'%i18n:@tips-line24%',
	'%i18n:@tips-line25%'
]

export default define({
	name: 'tips'
}).extend({
	data() {
		return {
			tip: null,
			clock: null
		};
	},
	mounted() {
		this.$nextTick(() => {
			this.set();
		});

		this.clock = setInterval(this.change, 20000);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		set() {
			this.tip = tips[Math.floor(Math.random() * tips.length)];
		},
		change() {
			anime({
				targets: this.$refs.tip,
				opacity: 0,
				duration: 500,
				easing: 'linear',
				complete: this.set
			});

			setTimeout(() => {
				anime({
					targets: this.$refs.tip,
					opacity: 1,
					duration: 500,
					easing: 'linear'
				});
			}, 500);
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-tips
	overflow visible !important

	> p
		display block
		margin 0
		padding 0 12px
		text-align center
		font-size 0.7em
		color #999

		> [data-fa]
			margin-right 4px

		kbd
			display inline
			padding 0 6px
			margin 0 2px
			font-size 1em
			font-family inherit
			border solid 1px #999
			border-radius 2px

</style>
