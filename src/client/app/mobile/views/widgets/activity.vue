<template>
<div class="mkw-activity">
	<ui-container :show-header="!props.compact">
		<template slot="header"><fa icon="chart-bar"/>{{ $t('activity') }}</template>
		<div :class="$style.body">
			<x-activity :user="$store.state.i"/>
		</div>
	</ui-container>
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
	components: {
		XActivity: () => import('../../../common/views/components/activity.vue').then(m => m.default)
	},
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
