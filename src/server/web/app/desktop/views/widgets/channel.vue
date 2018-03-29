<template>
<div class="mkw-channel">
	<template v-if="!props.compact">
		<p class="title">%fa:tv%{{ channel ? channel.title : '%i18n:desktop.tags.mk-channel-home-widget.title%' }}</p>
		<button @click="settings" title="%i18n:desktop.tags.mk-channel-home-widget.settings%">%fa:cog%</button>
	</template>
	<p class="get-started" v-if="props.channel == null">%i18n:desktop.tags.mk-channel-home-widget.get-started%</p>
	<x-channel class="channel" :channel="channel" v-if="channel != null"/>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import XChannel from './channel.channel.vue';

export default define({
	name: 'server',
	props: () => ({
		channel: null,
		compact: false
	})
}).extend({
	components: {
		XChannel
	},
	data() {
		return {
			fetching: true,
			channel: null
		};
	},
	mounted() {
		if (this.props.channel) {
				this.zap();
			}
	},
	methods: {
		func() {
			this.props.compact = !this.props.compact;
		},
		settings() {
			const id = window.prompt('チャンネルID');
			if (!id) return;
			this.props.channel = id;
			this.zap();
		},
		zap() {
			this.fetching = true;

			(this as any).api('channels/show', {
				channelId: this.props.channel
			}).then(channel => {
				this.channel = channel;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-channel
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px
	overflow hidden

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

	> button
		position absolute
		z-index 2
		top 0
		right 0
		padding 0
		width 42px
		font-size 0.9em
		line-height 42px
		color #ccc

		&:hover
			color #aaa

		&:active
			color #999

	> .get-started
		margin 0
		padding 16px
		text-align center
		color #aaa

	> .channel
		height 200px

</style>
