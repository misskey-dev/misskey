<template>
<div v-if="channel">
	<portal to="icon"><fa :icon="faSatelliteDish"/></portal>
	<portal to="title">{{ channel.name }}</portal>

	<div class="wpgynlbz _panel _vMargin">
		<x-channel-follow-button :channel="channel" :full="true" class="subscribe"/>
		<div :style="{ backgroundImage: channel.bannerUrl ? `url(${channel.bannerUrl})` : null }" class="banner">
			<div class="status">
				<div><fa :icon="faUsers" fixed-width/> {{ $t('_channel.usersCount', { n: channel.usersCount }) }}</div>
				<div><fa :icon="faPencilAlt" fixed-width/> {{ $t('_channel.notesCount', { n: channel.notesCount }) }}</div>
			</div>
			<div class="fade"></div>
		</div>
		<div class="description" v-if="channel.description">
			<mfm :text="channel.description" :is-note="false" :i="$store.state.i"/>
		</div>
	</div>

	<x-post-form :channel="channel" class="post-form _panel _vMargin" fixed/>

	<x-timeline class="_vMargin" src="channel" :channel="channelId" @before="before" @after="after"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSatelliteDish, faUsers, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import {  } from '@fortawesome/free-regular-svg-icons';
import MkContainer from '../components/ui/container.vue';
import XPostForm from '../components/post-form.vue';
import XTimeline from '../components/timeline.vue';
import XChannelFollowButton from '../components/channel-follow-button.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('channel') as string
		};
	},

	components: {
		MkContainer,
		XPostForm,
		XTimeline,
		XChannelFollowButton
	},

	props: {
		channelId: {
			type: String,
			required: true
		}
	},

	provide: {
		inChannel: true
	},

	data() {
		return {
			channel: null,
			pagination: {
				endpoint: 'channels/timeline',
				limit: 10,
				params: () => ({
					channelId: this.channelId,
				})
			},
			faSatelliteDish, faUsers, faPencilAlt,
		};
	},

	watch: {
		channelId: {
			async handler() {
				this.channel = await this.$root.api('channels/show', {
					channelId: this.channelId,
				});
			},
			immediate: true
		}
	},

	created() {

	},
});
</script>

<style lang="scss" scoped>
.wpgynlbz {
	> .subscribe {
		position: absolute;
		z-index: 1;
		top: 16px;
		left: 16px;
	}
	
	> .banner {
		position: relative;
		height: 200px;
		background-position: center;
		background-size: cover;

		> .fade {
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			background: linear-gradient(0deg, var(--panel), var(--X15));
		}

		> .status {
			position: absolute;
			z-index: 1;
			bottom: 16px;
			right: 16px;
			padding: 8px 12px;
			font-size: 80%;
			background: rgba(0, 0, 0, 0.7);
			border-radius: 6px;
			color: #fff;
		}
	}

	> .description {
		padding: 16px;
	}
}
</style>
