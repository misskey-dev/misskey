<template>
<div class="mkw-notifications">
	<mk-widget-container :show-header="!props.compact">
		<template slot="header">%fa:R bell%%i18n:@title%</template>
		<button slot="func" title="%i18n:@settings%" @click="settings">%fa:cog%</button>

		<mk-notifications :class="$style.notifications"/>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'notifications',
	props: () => ({
		compact: false
	})
}).extend({
	methods: {
		settings() {
			alert('not implemented yet');
		},
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		}
	}
});
</script>

<style lang="stylus" module>
.notifications
	max-height 300px
	overflow auto

</style>
