<template>
<div v-if="channel" class="_section">
	<div class="wpgynlbz _content _panel _vMargin" :class="{ hide: !showBanner }">
		<XChannelFollowButton :channel="channel" :full="true" class="subscribe"/>
		<button class="_button toggle" @click="() => showBanner = !showBanner">
			<template v-if="showBanner"><Fa :icon="faAngleUp"/></template>
			<template v-else><Fa :icon="faAngleDown"/></template>
		</button>
		<div class="hideOverlay" v-if="!showBanner">
		</div>
		<div :style="{ backgroundImage: channel.bannerUrl ? `url(${channel.bannerUrl})` : null }" class="banner">
			<div class="status">
				<div><Fa :icon="faUsers" fixed-width/><I18n :src="$ts._channel.usersCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.usersCount }}</b></template></I18n></div>
				<div><Fa :icon="faPencilAlt" fixed-width/><I18n :src="$ts._channel.notesCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.notesCount }}</b></template></I18n></div>
			</div>
			<div class="fade"></div>
		</div>
		<div class="description" v-if="channel.description">
			<Mfm :text="channel.description" :is-note="false" :i="$i"/>
		</div>
	</div>

	<XPostForm :channel="channel" class="post-form _content _panel _vMargin" fixed v-if="$i"/>

	<XTimeline class="_content _vMargin _noGap_" src="channel" :key="channelId" :channel="channelId" @before="before" @after="after"/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faSatelliteDish, faUsers, faPencilAlt, faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import {  } from '@fortawesome/free-regular-svg-icons';
import MkContainer from '@client/components/ui/container.vue';
import XPostForm from '@client/components/post-form.vue';
import XTimeline from '@client/components/timeline.vue';
import XChannelFollowButton from '@client/components/channel-follow-button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
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

	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => this.channel ? {
				title: this.channel.name,
				icon: faSatelliteDish,
			} : null),
			channel: null,
			showBanner: true,
			pagination: {
				endpoint: 'channels/timeline',
				limit: 10,
				params: () => ({
					channelId: this.channelId,
				})
			},
			faSatelliteDish, faUsers, faPencilAlt, faAngleUp, faAngleDown,
		};
	},

	watch: {
		channelId: {
			async handler() {
				this.channel = await os.api('channels/show', {
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
	position: relative;

	> .subscribe {
		position: absolute;
		z-index: 1;
		top: 16px;
		left: 16px;
	}

	> .toggle {
		position: absolute;
		z-index: 2;
    top: 8px;
		right: 8px;
		font-size: 1.2em;
		width: 48px;
		height: 48px;
		color: #fff;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 100%;
		
		> [data-icon] {
			vertical-align: middle;
		}
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

	> .hideOverlay {
		position: absolute;
		z-index: 1;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		-webkit-backdrop-filter: blur(16px);
		backdrop-filter: blur(16px);
		background: rgba(0, 0, 0, 0.3);
	}

	&.hide {
		> .subscribe {
			display: none;
		}

		> .toggle {
			top: 0;
			right: 0;
			height: 100%;
			background: transparent;
		}

		> .banner {
			height: 42px;
			filter: blur(8px);

			> * {
				display: none;
			}
		}

		> .description {
			display: none;
		}
	}
}
</style>
