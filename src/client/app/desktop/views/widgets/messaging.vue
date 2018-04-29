<template>
<div class="mkw-messaging">
	<mk-widget-container :show-header="props.design == 0">
		<template slot="header">%fa:comments%%i18n:@title%</template>
		<button slot="func" @click="add">%fa:plus%</button>

		<mk-messaging ref="index" compact @navigate="navigate"/>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import MkMessagingRoomWindow from '../components/messaging-room-window.vue';
import MkMessagingWindow from '../components/messaging-window.vue';

export default define({
	name: 'messaging',
	props: () => ({
		design: 0
	})
}).extend({
	methods: {
		navigate(user) {
			(this as any).os.new(MkMessagingRoomWindow, {
				user: user
			});
		},
		add() {
			(this as any).os.new(MkMessagingWindow);
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
