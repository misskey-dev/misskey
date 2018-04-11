<template>
<div class="mk-stream-indicator">
	<p v-if=" stream.state == 'initializing' ">
		%fa:spinner .pulse%
		<span>%i18n:common.tags.mk-stream-indicator.connecting%<mk-ellipsis/></span>
	</p>
	<p v-if=" stream.state == 'reconnecting' ">
		%fa:spinner .pulse%
		<span>%i18n:common.tags.mk-stream-indicator.reconnecting%<mk-ellipsis/></span>
	</p>
	<p v-if=" stream.state == 'connected' ">
		%fa:check%
		<span>%i18n:common.tags.mk-stream-indicator.connected%</span>
	</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';

export default Vue.extend({
	computed: {
		stream() {
			return (this as any).os.stream;
		}
	},
	created() {
		(this as any).os.stream.on('_connected_', this.onConnected);
		(this as any).os.stream.on('_disconnected_', this.onDisconnected);

		this.$nextTick(() => {
			if (this.stream.state == 'connected') {
				this.$el.style.opacity = '0';
			}
		});
	},
	beforeDestroy() {
		(this as any).os.stream.off('_connected_', this.onConnected);
		(this as any).os.stream.off('_disconnected_', this.onDisconnected);
	},
	methods: {
		onConnected() {
			setTimeout(() => {
				anime({
					targets: this.$el,
					opacity: 0,
					easing: 'linear',
					duration: 200
				});
			}, 1000);
		},
		onDisconnected() {
			anime({
				targets: this.$el,
				opacity: 1,
				easing: 'linear',
				duration: 100
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-stream-indicator
	pointer-events none
	position fixed
	z-index 16384
	bottom 8px
	right 8px
	margin 0
	padding 6px 12px
	font-size 0.9em
	color #fff
	background rgba(0, 0, 0, 0.8)
	border-radius 4px

	> p
		display block
		margin 0

		> [data-fa]
			margin-right 0.25em

</style>
