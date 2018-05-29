<template>
<div class="mkw-analog-clock">
	<mk-widget-container :naked="props.naked" :show-header="false">
		<div class="mkw-analog-clock--body">
			<mk-analog-clock :dark="$store.state.device.darkmode"/>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'analog-clock',
	props: () => ({
		naked: false
	})
}).extend({
	methods: {
		func() {
			this.props.naked = !this.props.naked;
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
