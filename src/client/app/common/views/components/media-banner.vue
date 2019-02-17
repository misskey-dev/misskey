<template>
<div class="mk-media-banner">
	<div class="sensitive" v-if="media.isSensitive && hide" @click="hide = false">
		<span class="icon"><fa icon="exclamation-triangle"/></span>
		<b>{{ $t('sensitive') }}</b>
		<span>{{ $t('click-to-show') }}</span>
	</div>
	<div class="audio" v-else-if="media.type.startsWith('audio') && media.type !== 'audio/midi'">
		<audio class="audio"
			:src="media.url"
			:title="media.name"
			controls
			ref="audio"
			@volumechange="volumechange"
			preload="metadata" />
	</div>
	<a class="download" v-else
		:href="media.url"
		:title="media.name"
		:download="media.name"
	>
		<span class="icon"><fa icon="download"/></span>
		<b>{{ media.name }}</b>
	</a>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/components/media-banner.vue'),
	props: {
		media: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			hide: true
		};
	},
	mounted() {
		const audioTag = this.$refs.audio as HTMLAudioElement;
		audioTag.volume = this.$store.state.device.mediaVolume;
	},
	methods: {
		volumechange() {
			const audioTag = this.$refs.audio as HTMLAudioElement;
			this.$store.commit('device/set', { key: 'mediaVolume', value: audioTag.volume });
		},
	},
})
</script>

<style lang="stylus" scoped>
.mk-media-banner
	width 100%
	border-radius 4px
	margin-top 4px
	overflow hidden

	> .download,
	> .sensitive
		display flex
		align-items center
		font-size 12px
		padding 8px 12px
		white-space nowrap

		> *
			display block

		> b
			overflow hidden
			text-overflow ellipsis

		> *:not(:last-child)
			margin-right .2em

		> .icon
			font-size 1.6em

	> .download
		background var(--noteAttachedFile)

	> .sensitive
		background #111
		color #fff

	> .audio
		.audio
			display block
			width 100%

</style>
