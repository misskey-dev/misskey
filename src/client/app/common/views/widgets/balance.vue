<template>
<div class="mkw-balance nxqgvwhnuthzathxvfmmkcjcxheqldsg">
	<mk-widget-container>
		<template slot="header">%fa:address-card R%Stats</template>
		<button slot="func" @click="toggle" title="%i18n:@toggle%">%fa:sort%</button>

		<div class="nxqgvwhnuthzathxvfmmkcjcxheqldsg-body">
			<b>{{ $store.state.i.balance | number }}</b>
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
		padding 32px
		font-size 20px

.nxqgvwhnuthzathxvfmmkcjcxheqldsg[data-darkmode]
	root(true)

.nxqgvwhnuthzathxvfmmkcjcxheqldsg:not([data-darkmode])
	root(false)

</style>
