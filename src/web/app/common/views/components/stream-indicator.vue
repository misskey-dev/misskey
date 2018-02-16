<template>
<div class="mk-stream-indicator" v-if="stream">
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
	data() {
		return {
			stream: null
		};
	},
	created() {
		this.stream = this.$root.$data.os.stream.borrow();

		this.$root.$data.os.stream.on('connected', this.onConnected);
		this.$root.$data.os.stream.on('disconnected', this.onDisconnected);

		this.$nextTick(() => {
			if (this.stream.state == 'connected') {
				this.$el.style.opacity = '0';
			}
		});
	},
	beforeDestroy() {
		this.$root.$data.os.stream.off('connected', this.onConnected);
		this.$root.$data.os.stream.off('disconnected', this.onDisconnected);
	},
	methods: {
		onConnected() {
			this.stream = this.$root.$data.os.stream.borrow();

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
			this.stream = null;

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
