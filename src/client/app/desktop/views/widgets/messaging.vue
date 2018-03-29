<template>
<div class="mkw-messaging">
	<p class="title" v-if="props.design == 0">%fa:comments%%i18n:desktop.tags.mk-messaging-home-widget.title%</p>
	<mk-messaging ref="index" compact @navigate="navigate"/>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import MkMessagingRoomWindow from '../components/messaging-room-window.vue';

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
		func() {
			if (this.props.design == 1) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-messaging
	overflow hidden
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	> .title
		z-index 2
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(0, 0, 0, 0.07)

		> [data-fa]
			margin-right 4px

	> .mk-messaging
		max-height 250px
		overflow auto

</style>
