<template>
<div class="mkw-tips">
	<p ref="tip"><fa :icon="['far', 'lightbulb']"/><span v-html="tip"></span></p>
</div>
</template>

<script lang="ts">
import anime from 'animejs';
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'tips'
}).extend({
	i18n: i18n('common/views/widgets/tips.vue'),

	data() {
		return {
			tips: [],
			tip: null,
			clock: null
		};
	},
	created() {
		this.tips =  [
			this.$t('tips-line1'),
			this.$t('tips-line2'),
			this.$t('tips-line3'),
			this.$t('tips-line4'),
			this.$t('tips-line5'),
			this.$t('tips-line6'),
			this.$t('tips-line7'),
			this.$t('tips-line8'),
			this.$t('tips-line9'),
			this.$t('tips-line10'),
			this.$t('tips-line11'),
			this.$t('tips-line13'),
			this.$t('tips-line14'),
			this.$t('tips-line17'),
			this.$t('tips-line19'),
			this.$t('tips-line20'),
			this.$t('tips-line21'),
			this.$t('tips-line23'),
			this.$t('tips-line24'),
			this.$t('tips-line25')
		];
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
			this.tip = this.tips[Math.floor(Math.random() * this.tips.length)];
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
	opacity 0.8

	> p
		display block
		margin 0
		padding 0 12px
		text-align center
		font-size 0.7em
		color var(--text)

		> [data-icon]
			margin-right 4px

		kbd
			display inline
			padding 0 6px
			margin 0 2px
			font-size 1em
			font-family inherit
			border solid 1px var(--text)
			border-radius 2px

</style>
