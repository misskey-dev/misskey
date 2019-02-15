<template>
<div class="mkw-notifications">
	<ui-container :show-header="!props.compact">
		<template slot="header"><fa :icon="['far', 'bell']"/>{{ $t('title') }}</template>
		<!-- <button slot="func" :title="$t('title')" @click="settings"><fa icon="cog"/></button> -->

		<mk-notifications :class="$style.notifications"/>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'notifications',
	props: () => ({
		compact: false
	})
}).extend({
	i18n: i18n('desktop/views/widgets/notifications.vue'),
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
