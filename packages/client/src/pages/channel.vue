<template>
<MkSpacer :content-max="700">
	<div v-if="channel">
		<div class="wpgynlbz _panel _gap" :class="{ hide: !showBanner }">
			<XChannelFollowButton :channel="channel" :full="true" class="subscribe"/>
			<button class="_button toggle" @click="() => showBanner = !showBanner">
				<template v-if="showBanner"><i class="fas fa-angle-up"></i></template>
				<template v-else><i class="fas fa-angle-down"></i></template>
			</button>
			<div v-if="!showBanner" class="hideOverlay">
			</div>
			<div :style="{ backgroundImage: channel.bannerUrl ? `url(${channel.bannerUrl})` : null }" class="banner">
				<div class="status">
					<div><i class="fas fa-users fa-fw"></i><I18n :src="$ts._channel.usersCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.usersCount }}</b></template></I18n></div>
					<div><i class="fas fa-pencil-alt fa-fw"></i><I18n :src="$ts._channel.notesCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.notesCount }}</b></template></I18n></div>
				</div>
				<div class="fade"></div>
			</div>
			<div v-if="channel.description" class="description">
				<Mfm :text="channel.description" :is-note="false" :i="$i"/>
			</div>
		</div>

		<XPostForm v-if="$i" :channel="channel" class="post-form _panel _gap" fixed/>

		<XTimeline :key="channelId" class="_gap" src="channel" :channel="channelId" @before="before" @after="after"/>
	</div>
</MkSpacer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import MkContainer from '@/components/ui/container.vue';
import XPostForm from '@/components/post-form.vue';
import XTimeline from '@/components/timeline.vue';
import XChannelFollowButton from '@/components/channel-follow-button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

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
				icon: 'fas fa-satellite-dish',
				bg: 'var(--bg)',
				actions: [...(this.$i && this.$i.id === this.channel.userId ? [{
					icon: 'fas fa-cog',
					text: this.$ts.edit,
					handler: this.edit,
				}] : [])],
			} : null),
			channel: null,
			showBanner: true,
			pagination: {
				endpoint: 'channels/timeline' as const,
				limit: 10,
				params: computed(() => ({
					channelId: this.channelId,
				}))
			},
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

	methods: {
		edit() {
			this.$router.push(`/channels/${this.channel.id}/edit`);
		}
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
		
		> i {
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
		-webkit-backdrop-filter: var(--blur, blur(16px));
		backdrop-filter: var(--blur, blur(16px));
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
