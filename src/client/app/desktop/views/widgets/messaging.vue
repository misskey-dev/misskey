<template>
<div class="mkw-messaging">
	<ui-container :show-header="props.design == 0">
		<template slot="header"><fa icon="comments"/>{{ $t('title') }}</template>
		<button slot="func" @click="add"><fa icon="plus"/></button>

		<x-messaging ref="index" compact @navigate="navigate"/>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';
import MkMessagingRoomWindow from '../components/messaging-room-window.vue';
import MkMessagingWindow from '../components/messaging-window.vue';

export default define({
	name: 'messaging',
	props: () => ({
		design: 0
	})
}).extend({
	i18n: i18n('desktop/views/widgets/messaging.vue'),
	components: {
		XMessaging: () => import('../../../common/views/components/messaging.vue').then(m => m.default)
	},
	methods: {
		navigate(user) {
			this.$root.new(MkMessagingRoomWindow, {
				user: user
			});
		},
		add() {
			this.$root.new(MkMessagingWindow);
		},
		func() {
			if (this.props.design == 1) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
			this.save();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-messaging
	.mk-messaging
		max-height 250px
		overflow auto

</style>
