<template>
<div class="mkw-analog-clock">
	<mk-widget-container :naked="!(props.design % 2)" :show-header="false">
		<div class="mkw-analog-clock--body">
			<mk-analog-clock :dark="$store.state.device.darkmode" :smooth="!(props.design && ~props.design)"/>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'analog-clock',
	props: () => ({
		design: -1
	})
}).extend({
	methods: {
		func() {
			if (++this.props.design > 2)
				this.props.design = -1;
			this.save();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	.mkw-analog-clock--body
		padding 8px

.mkw-analog-clock[data-darkmode]
	root(true)

.mkw-analog-clock:not([data-darkmode])
	root(false)

</style>
