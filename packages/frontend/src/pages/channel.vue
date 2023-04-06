<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700" :class="$style.main">
		<div v-if="channel && tab === 'overview'" class="_gaps">
			<div class="_panel" :class="$style.bannerContainer">
				<XChannelFollowButton :channel="channel" :full="true" :class="$style.subscribe"/>
				<div :style="{ backgroundImage: channel.bannerUrl ? `url(${channel.bannerUrl})` : null }" :class="$style.banner">
					<div :class="$style.bannerStatus">
						<div><i class="ti ti-users ti-fw"></i><I18n :src="i18n.ts._channel.usersCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.usersCount }}</b></template></I18n></div>
						<div><i class="ti ti-pencil ti-fw"></i><I18n :src="i18n.ts._channel.notesCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.notesCount }}</b></template></I18n></div>
					</div>
					<div :class="$style.bannerFade"></div>
				</div>
				<div v-if="channel.description" :class="$style.description">
					<Mfm :text="channel.description" :is-note="false" :i="$i"/>
				</div>
			</div>

			<MkButton v-if="favorited" v-tooltip="i18n.ts.unfavorite" as-like class="button" rounded primary @click="unfavorite()"><i class="ti ti-star"></i></MkButton>
			<MkButton v-else v-tooltip="i18n.ts.favorite" as-like class="button" rounded @click="favorite()"><i class="ti ti-star"></i></MkButton>

			<MkFoldableSection>
				<template #header><i class="ti ti-pin ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.pinnedNotes }}</template>
				<div v-if="channel.pinnedNotes.length > 0" class="_gaps">
					<MkNote v-for="note in channel.pinnedNotes" :key="note.id" class="_panel" :note="note"/>
				</div>
			</MkFoldableSection>
		</div>
		<div v-if="channel && tab === 'timeline'" class="_gaps">
			<!-- スマホ・タブレットの場合、キーボードが表示されると投稿が見づらくなるので、デスクトップ場合のみ自動でフォーカスを当てる -->
			<MkPostForm v-if="$i && defaultStore.reactiveState.showFixedPostFormInChannel.value" :channel="channel" class="post-form _panel" fixed :autofocus="deviceKind === 'desktop'"/>

			<MkTimeline :key="channelId" src="channel" :channel="channelId" @before="before" @after="after"/>
		</div>
		<div v-else-if="tab === 'featured'">
			<MkNotes :pagination="featuredPagination"/>
		</div>
	</MkSpacer>
	<template #footer>
		<div :class="$style.footer">
			<MkSpacer :content-max="700" :margin-min="16" :margin-max="16">
				<div class="_buttonsCenter">
					<MkButton inline rounded primary gradate @click="openPostForm()"><i class="ti ti-pencil"></i> {{ i18n.ts.postToTheChannel }}</MkButton>
				</div>
			</MkSpacer>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import MkPostForm from '@/components/MkPostForm.vue';
import MkTimeline from '@/components/MkTimeline.vue';
import XChannelFollowButton from '@/components/MkChannelFollowButton.vue';
import * as os from '@/os';
import { useRouter } from '@/router';
import { $i, iAmModerator } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { deviceKind } from '@/scripts/device-kind';
import MkNotes from '@/components/MkNotes.vue';
import { url } from '@/config';
import MkButton from '@/components/MkButton.vue';
import { defaultStore } from '@/store';
import MkNote from '@/components/MkNote.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';

const router = useRouter();

const props = defineProps<{
	channelId: string;
}>();

let tab = $ref('timeline');
let channel = $ref(null);
let favorited = $ref(false);
const featuredPagination = $computed(() => ({
	endpoint: 'notes/featured' as const,
	limit: 10,
	offsetMode: true,
	params: {
		channelId: props.channelId,
	},
}));

watch(() => props.channelId, async () => {
	channel = await os.api('channels/show', {
		channelId: props.channelId,
	});
	favorited = channel.isFavorited;
}, { immediate: true });

function edit() {
	router.push(`/channels/${channel.id}/edit`);
}

function openPostForm() {
	os.post({
		channel,
	});
}

function favorite() {
	os.apiWithDialog('channels/favorite', {
		channelId: channel.id,
	}).then(() => {
		favorited = true;
	});
}

async function unfavorite() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unfavoriteConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('channels/unfavorite', {
		channelId: channel.id,
	}).then(() => {
		favorited = false;
	});
}

const headerActions = $computed(() => {
	if (channel && channel.userId) {
		const share = {
			icon: 'ti ti-share',
			text: i18n.ts.share,
			handler: async (): Promise<void> => {
				navigator.share({
					title: channel.name,
					text: channel.description,
					url: `${url}/channels/${channel.id}`,
				});
			},
		};

		const canEdit = ($i && $i.id === channel.userId) || iAmModerator;
		return canEdit ? [share, {
			icon: 'ti ti-settings',
			text: i18n.ts.edit,
			handler: edit,
		}] : [share];
	} else {
		return null;
	}
});

const headerTabs = $computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
	icon: 'ti ti-info-circle',
}, {
	key: 'timeline',
	title: i18n.ts.timeline,
	icon: 'ti ti-home',
}, {
	key: 'featured',
	title: i18n.ts.featured,
	icon: 'ti ti-bolt',
}]);

definePageMetadata(computed(() => channel ? {
	title: channel.name,
	icon: 'ti ti-device-tv',
} : null));
</script>

<style lang="scss" module>
.main {
	min-height: calc(var(--containerHeight) - (var(--stickyTop, 0px) + var(--stickyBottom, 0px)));
}

.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-top: solid 0.5px var(--divider);
}

.bannerContainer {
	position: relative;
}

.subscribe {
	position: absolute;
	z-index: 1;
	top: 16px;
	left: 16px;
}

.banner {
	position: relative;
	height: 200px;
	background-position: center;
	background-size: cover;
}

.bannerFade {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 64px;
	background: linear-gradient(0deg, var(--panel), var(--X15));
}

.bannerStatus {
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

.description {
	padding: 16px;
}
</style>
