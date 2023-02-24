<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700">
		<div v-if="channel">
			<div class="wpgynlbz _panel _margin" :class="{ hide: !showBanner }">
				<XChannelFollowButton :channel="channel" :full="true" class="subscribe"/>
				<button class="_button toggle" @click="() => showBanner = !showBanner">
					<template v-if="showBanner"><i class="ti ti-chevron-up"></i></template>
					<template v-else><i class="ti ti-chevron-down"></i></template>
				</button>
				<div v-if="!showBanner" class="hideOverlay">
				</div>
				<div :style="{ backgroundImage: channel.bannerUrl ? `url(${channel.bannerUrl})` : null }" class="banner">
					<div class="status">
						<div><i class="ti ti-users ti-fw"></i><I18n :src="i18n.ts._channel.usersCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.usersCount }}</b></template></I18n></div>
						<div><i class="ti ti-pencil ti-fw"></i><I18n :src="i18n.ts._channel.notesCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.notesCount }}</b></template></I18n></div>
					</div>
					<div class="fade"></div>
				</div>
				<div v-if="channel.description" class="description">
					<Mfm :text="channel.description" :is-note="false" :i="$i"/>
				</div>
			</div>

			<!-- スマホ・タブレットの場合、キーボードが表示されると投稿が見づらくなるので、デスクトップ場合のみ自動でフォーカスを当てる -->
			<MkPostForm v-if="$i" :channel="channel" class="post-form _panel _margin" fixed :autofocus="deviceKind === 'desktop'"/>

			<MkTimeline :key="channelId" class="_margin" src="channel" :channel="channelId" @before="before" @after="after"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import MkPostForm from '@/components/MkPostForm.vue';
import MkTimeline from '@/components/MkTimeline.vue';
import XChannelFollowButton from '@/components/MkChannelFollowButton.vue';
import * as os from '@/os';
import { useRouter } from '@/router';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { deviceKind } from '@/scripts/device-kind';

const router = useRouter();

const props = defineProps<{
	channelId: string;
}>();

let channel = $ref(null);
let showBanner = $ref(true);
const pagination = {
	endpoint: 'channels/timeline' as const,
	limit: 10,
	params: computed(() => ({
		channelId: props.channelId,
	})),
};

watch(() => props.channelId, async () => {
	channel = await os.api('channels/show', {
		channelId: props.channelId,
	});
}, { immediate: true });

function edit() {
	router.push(`/channels/${channel.id}/edit`);
}

const headerActions = $computed(() => channel && channel.userId ? [{
	icon: 'ti ti-settings',
	text: i18n.ts.edit,
	handler: edit,
}] : null);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => channel ? {
	title: channel.name,
	icon: 'ti ti-device-tv',
} : null));
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
