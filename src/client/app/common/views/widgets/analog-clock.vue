<template>
<div class="mkw-analog-clock">
	<mk-widget-container :naked="props.style % 2 === 0" :show-header="false">
		<div class="mkw-analog-clock--body">
			<mk-analog-clock :dark="$store.state.device.darkmode" :smooth="props.style < 2"/>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'analog-clock',
	props: () => ({
		style: 0
	})
}).extend({
	methods: {
		func() {
			this.props.style = (this.props.style + 1) % 4;
			this.save();
		}
	}
});
</script>

<style lang="stylus" scoped>


root(isDark)
	.mkw-analog-clock--body
		padding 8px

.mkw-analog-clock[data-darkmode]
	root(true)

.mkw-analog-clock:not([data-darkmode])
	root(false)

</style>
