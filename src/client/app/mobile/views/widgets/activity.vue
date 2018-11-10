<template>
<div class="mkw-activity">
	<mk-widget-container :show-header="!props.compact">
		<template slot="header"><fa icon="chart-bar"/>{{ $t('activity') }}</template>
		<div :class="$style.body">
			<mk-activity :user="$store.state.i"/>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'activity',
	props: () => ({
		compact: false
	})
}).extend({
	i18n: i18n(),
	methods: {
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		}
	}
});
</script>

<style lang="stylus" module>
.body
	padding 8px
</style>
