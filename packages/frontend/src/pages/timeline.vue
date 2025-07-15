<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="src" :actions="headerActions" :tabs="$i ? headerTabs : headerTabsWhenNotLogin" :swipable="true" :displayMyAvatar="true">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<MkTip v-if="isBasicTimeline(src)" :k="`tl.${src}`" style="margin-bottom: var(--MI-margin);">
			{{ i18n.ts._timelineDescription[src] }}
		</MkTip>
		<MkPostForm v-if="shouldShowFixedPostForm" :channel="currentChannel" :class="$style.postForm" class="_panel" fixed style="margin-bottom: var(--MI-margin);" :isInYamiTimeline="src === 'yami'" :isInNormalTimeline="src !== 'yami'"/>
		<MkStreamingNotesTimeline
			ref="tlComponent"
			:key="src + withRenotes + withReplies + withHashtags + withFiles + localOnly + remoteOnly + withSensitive"
			:class="$style.tl"
			:src="src.split(':')[0]"
			:list="src.startsWith('list:') ? src.split(':')[1] : undefined"
			:channel="src.startsWith('channel:') ? src.split(':')[1] : undefined"
			:withRenotes="withRenotes"
			:withReplies="withReplies"
			:withHashtags="withHashtags"
			:withSensitive="withSensitive"
			:withFiles="withFiles"
			:localOnly="localOnly"
			:remoteOnly="remoteOnly"
			:showYamiNonFollowingPublicNotes="showYamiNonFollowingPublicNotes"
			:showYamiFollowingNotes="showYamiFollowingNotes"
			:sound="true"
		/>
	</div>
	<template v-if="src.startsWith('channel:') && !prefer.r.showFixedPostFormInChannel.value" #footer>
		<div :class="$style.footer">
			<div class="_spacer" style="--MI_SPACER-w: 800px; --MI_SPACER-min: 16px; --MI_SPACER-max: 16px;">
				<div class="_buttonsCenter">
					<MkButton inline rounded primary gradate @click="openPostForm()"><i class="ti ti-pencil"></i> {{ i18n.ts.postToTheChannel }}</MkButton>
				</div>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, provide, useTemplateRef, ref, onMounted, onActivated } from 'vue';
import type { Tab } from '@/components/global/MkPageHeader.tabs.vue';
import type { MenuItem } from '@/types/menu.js';
import type { BasicTimelineType } from '@/timelines.js';
import MkStreamingNotesTimeline from '@/components/MkStreamingNotesTimeline.vue';
import MkPostForm from '@/components/MkPostForm.vue';
import * as os from '@/os.js';
import { store } from '@/store.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import { definePage } from '@/page.js';
import { antennasCache, userListsCache, favoritedChannelsCache } from '@/cache.js';
import { deviceKind } from '@/utility/device-kind.js';
import { deepMerge } from '@/utility/merge.js';
import { miLocalStorage } from '@/local-storage.js';
import { availableBasicTimelines, hasWithReplies, isAvailableBasicTimeline, isBasicTimeline, basicTimelineIconClass } from '@/timelines.js';
import { prefer } from '@/preferences.js';
import MkButton from '@/components/MkButton.vue';

provide('shouldOmitHeaderTitle', true);

const tlComponent = useTemplateRef('tlComponent');

type TimelinePageSrc = BasicTimelineType | `list:${string}` | `channel:${string}`;

const srcWhenNotSignin = ref<'local' | 'global'>(isAvailableBasicTimeline('local') ? 'local' : 'global');
const src = computed<TimelinePageSrc>({
	get: () => ($i ? store.r.tl.value.src : srcWhenNotSignin.value),
	set: (x) => saveSrc(x),
});
const withRenotes = computed<boolean>({
	get: () => store.r.tl.value.filter.withRenotes,
	set: (x) => saveTlFilter('withRenotes', x),
});
const localOnly = computed<boolean>({
	get: () => store.r.tl.value.filter.localOnly,
	set: (x) => saveTlFilter('localOnly', x),
});

const remoteOnly = computed<boolean>({
	get: () => store.r.tl.value.filter.remoteOnly,
	set: (x) => saveTlFilter('remoteOnly', x),
});

// 固定投稿フォームの表示制御
const shouldShowFixedPostForm = computed(() => {
	const isChannelTimeline = src.value.startsWith('channel:');

	if (isChannelTimeline) {
		// チャンネルタイムラインの場合、showFixedPostFormInChannelの設定を使用
		return prefer.r.showFixedPostFormInChannel.value;
	} else {
		// その他のタイムラインの場合、showFixedPostFormの設定を使用
		return prefer.r.showFixedPostForm.value;
	}
});

// チャンネル情報を取得
const currentChannel = computed(() => {
	if (src.value.startsWith('channel:')) {
		const channelId = src.value.substring('channel:'.length);
		// まずピン止めチャンネルから探す
		const pinnedChannel = prefer.r.pinnedChannels.value.find(c => c.id === channelId);
		if (pinnedChannel) {
			return pinnedChannel;
		}
		// ピン止めチャンネルになければstoreから取得
		return store.r.tl.value.channel;
	}
	return null;
});

// computed内での無限ループを防ぐためのフラグ
const localSocialTLFilterSwitchStore = ref<'withReplies' | 'withFiles' | false>(
	store.r.tl.value.filter.withReplies ? 'withReplies' :
	store.r.tl.value.filter.withFiles ? 'withFiles' :
	false,
);

const withReplies = computed<boolean>({
	get: () => {
		if (!$i) return false;
		if (['local', 'social'].includes(src.value) && localSocialTLFilterSwitchStore.value === 'withFiles') {
			return false;
		} else {
			return store.r.tl.value.filter.withReplies;
		}
	},
	set: (x) => saveTlFilter('withReplies', x),
});
const withFiles = computed<boolean>({
	get: () => {
		if (['local', 'social'].includes(src.value) && localSocialTLFilterSwitchStore.value === 'withReplies') {
			return false;
		} else {
			return store.r.tl.value.filter.withFiles;
		}
	},
	set: (x) => saveTlFilter('withFiles', x),
});

const withHashtags = computed<boolean>({
	get: () => store.r.tl.value.filter.withHashtags,
	set: (x) => saveTlFilter('withHashtags', x),
});

watch([withReplies, withFiles], ([withRepliesTo, withFilesTo]) => {
	if (withRepliesTo) {
		localSocialTLFilterSwitchStore.value = 'withReplies';
	} else if (withFilesTo) {
		localSocialTLFilterSwitchStore.value = 'withFiles';
	} else {
		localSocialTLFilterSwitchStore.value = false;
	}
});

const withSensitive = computed<boolean>({
	get: () => store.r.tl.value.filter.withSensitive,
	set: (x) => saveTlFilter('withSensitive', x),
});

// 闇モード関連の設定用の状態変数
const showYamiNonFollowingPublicNotes = computed<boolean>({
	get: () => {
		// 闇モードでなければ常にfalse
		if (!$i?.isInYamiMode) {
			return false;
		}
		return store.r.tl.value.filter.showYamiNonFollowingPublicNotes;
	},
	set: (x) => {
		// 闇モードでなければ設定変更を無視
		if (!$i?.isInYamiMode) return;
		saveTlFilter('showYamiNonFollowingPublicNotes', x);
	},
});

const showYamiFollowingNotes = computed<boolean>({
	get: () => {
		// 闇モードでなければ常にfalse
		if (!$i?.isInYamiMode) {
			return false;
		}
		return store.r.tl.value.filter.showYamiFollowingNotes;
	},
	set: (x) => {
		// 闇モードでなければ設定変更を無視
		if (!$i?.isInYamiMode) return;
		saveTlFilter('showYamiFollowingNotes', x);
	},
});

onMounted(() => {
	// 初期値がない場合は設定
	if (store.r.tl.value.filter.showYamiNonFollowingPublicNotes === undefined) {
		saveTlFilter('showYamiNonFollowingPublicNotes', prefer.s.showYamiNonFollowingPublicNotes ?? true);
	}
	if (store.r.tl.value.filter.showYamiFollowingNotes === undefined) {
		saveTlFilter('showYamiFollowingNotes', prefer.s.showYamiFollowingNotes ?? true);
	}
});

function openPostForm() {
	if (currentChannel.value) {
		os.post({
			channel: currentChannel.value,
		});
	}
}

async function chooseList(ev: MouseEvent): Promise<void> {
	const lists = await userListsCache.fetch();
	const items: MenuItem[] = [
		...lists.map(list => ({
			type: 'link' as const,
			text: list.name,
			to: `/timeline/list/${list.id}`,
		})),
		(lists.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link' as const,
			icon: 'ti ti-plus',
			text: i18n.ts.createNew,
			to: '/my/lists',
		},
	];
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

async function chooseAntenna(ev: MouseEvent): Promise<void> {
	const antennas = await antennasCache.fetch();
	const items: MenuItem[] = [
		...antennas.map(antenna => ({
			type: 'link' as const,
			text: antenna.name,
			indicate: antenna.hasUnreadNote,
			to: `/timeline/antenna/${antenna.id}`,
		})),
		(antennas.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link' as const,
			icon: 'ti ti-plus',
			text: i18n.ts.createNew,
			to: '/my/antennas',
		},
	];
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

async function chooseChannel(ev: MouseEvent): Promise<void> {
	const channels = await favoritedChannelsCache.fetch();
	const items: MenuItem[] = [
		...channels.map(channel => {
			const lastReadedAt = miLocalStorage.getItemAsJson(`channelLastReadedAt:${channel.id}`) ?? null;
			const hasUnreadNote = (lastReadedAt && channel.lastNotedAt) ? Date.parse(channel.lastNotedAt) > lastReadedAt : !!(!lastReadedAt && channel.lastNotedAt);

			return {
				type: 'link' as const,
				text: channel.name,
				indicate: hasUnreadNote,
				to: `/channels/${channel.id}`,
			};
		}),
		(channels.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link',
			icon: 'ti ti-plus',
			text: i18n.ts.createNew,
			to: '/channels',
		},
	];
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

function saveSrc(newSrc: TimelinePageSrc): void {
	const out = deepMerge({ src: newSrc }, store.s.tl);

	if (newSrc.startsWith('userList:')) {
		const id = newSrc.substring('userList:'.length);
		out.userList = prefer.r.pinnedUserLists.value.find(l => l.id === id) ?? null;
	}

	if (newSrc.startsWith('channel:')) {
		const id = newSrc.substring('channel:'.length);
		out.channel = prefer.r.pinnedChannels.value.find(c => c.id === id) ?? null;
	}

	store.set('tl', out);
	if (['local', 'global'].includes(newSrc)) {
		srcWhenNotSignin.value = newSrc as 'local' | 'global';
	}
}

function saveTlFilter(key: keyof typeof store.s.tl.filter, newValue: boolean) {
	if (key !== 'withReplies' || $i) {
		const out = deepMerge({ filter: { [key]: newValue } }, store.s.tl);
		store.set('tl', out);
	}
}

async function timetravel(): Promise<void> {
	const { canceled, result: date } = await os.inputDate({
		title: i18n.ts.date,
	});
	if (canceled) return;

	tlComponent.value.timetravel(date);
}

function focus(): void {
	tlComponent.value.focus();
}

function switchTlIfNeeded() {
	if (isBasicTimeline(src.value) && !isAvailableBasicTimeline(src.value)) {
		src.value = availableBasicTimelines()[0];
	}
}

onMounted(() => {
	switchTlIfNeeded();
});
onActivated(() => {
	switchTlIfNeeded();
});

const headerActions = computed(() => {
	const tmp = [
		{
			icon: 'ti ti-dots',
			text: i18n.ts.options,
			handler: (ev) => {
				const menuItems: MenuItem[] = [];

				// フィルター項目があれば追加
				if (filterItems.value.length > 0) {
					menuItems.push(...filterItems.value);
				}

				// リノートの表示切り替え（アイコン付き）
				menuItems.push({
					type: 'switch',
					icon: 'ti ti-repeat',
					text: i18n.ts.showRenotes,
					ref: withRenotes,
				});

				if (isBasicTimeline(src.value) && hasWithReplies(src.value)) {
					menuItems.push({
						type: 'switch',
						icon: 'ti ti-messages',
						text: i18n.ts.showRepliesToOthersInTimeline,
						ref: withReplies,
						disabled: withFiles,
					});
				}

				menuItems.push({
					type: 'switch',
					icon: 'ti ti-eye-exclamation',
					text: i18n.ts.withSensitive,
					ref: withSensitive,
				}, {
					type: 'switch',
					icon: 'ti ti-photo',
					text: i18n.ts.fileAttachedOnly,
					ref: withFiles,
					disabled: isBasicTimeline(src.value) && hasWithReplies(src.value) ? withReplies : false,
				});

				os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
			},
		},
	];
	if (deviceKind === 'desktop') {
		tmp.unshift({
			icon: 'ti ti-refresh',
			text: i18n.ts.reload,
			handler: (ev: Event) => {
				tlComponent.value?.reloadTimeline();
			},
		});
	}
	return tmp;
});

const filterItems = computed(() => {
	const items: MenuItem[] = [];

	if (src.value === 'social') {
		items.push({
			type: 'switch',
			text: i18n.ts.localOnly,
			ref: localOnly,
		});
	} else if (src.value === 'global') {
		items.push({
			type: 'switch',
			text: i18n.ts.remoteOnly,
			ref: remoteOnly,
		}, {
			type: 'switch',
			text: i18n.ts.withHashtags,
			ref: withHashtags,
		});
	} else if (src.value === 'yami') {
		items.push({
			type: 'switch',
			text: i18n.ts.localOnly,
			ref: localOnly,
		}, {
			type: 'switch',
			text: i18n.ts._yami.showYamiNonFollowingPublicNotes,
			ref: showYamiNonFollowingPublicNotes,
			// 闇モードでない場合は視覚的に無効化
			disabled: !$i?.isInYamiMode,
		}, {
			type: 'switch',
			text: i18n.ts._yami.showYamiFollowingNotes,
			ref: showYamiFollowingNotes,
			// 闇モードでない場合は視覚的に無効化
			disabled: !$i?.isInYamiMode,
		});
	}

	return items;
});

const headerTabs = computed(() => [...(prefer.r.pinnedUserLists.value.map(l => ({
	key: 'list:' + l.id,
	title: l.name,
	icon: 'ti ti-star',
	iconOnly: true,
}))), ...(prefer.r.pinnedChannels.value.map(c => ({
	key: 'channel:' + c.id,
	title: c.name,
	icon: 'ti ti-device-tv',
	iconOnly: true,
}))), ...availableBasicTimelines().map(tl => ({
	key: tl,
	title: i18n.ts._timelines[tl],
	icon: basicTimelineIconClass(tl),
	iconOnly: true,
})), {
	icon: 'ti ti-list',
	title: i18n.ts.lists,
	iconOnly: true,
	onClick: chooseList,
}, {
	icon: 'ti ti-antenna',
	title: i18n.ts.antennas,
	iconOnly: true,
	onClick: chooseAntenna,
}, {
	icon: 'ti ti-device-tv',
	title: i18n.ts.channel,
	iconOnly: true,
	onClick: chooseChannel,
}] as Tab[]);

const headerTabsWhenNotLogin = computed(() => [...availableBasicTimelines().map(tl => ({
	key: tl,
	title: i18n.ts._timelines[tl],
	icon: basicTimelineIconClass(tl),
	iconOnly: true,
}))] as Tab[]);

definePage(() => ({
	title: i18n.ts.timeline,
	icon: isBasicTimeline(src.value) ? basicTimelineIconClass(src.value) : 'ti ti-home',
}));
</script>

<style lang="scss" module>
.new {
	position: sticky;
	top: calc(var(--MI-stickyTop, 0px) + 16px);
	z-index: 1000;
	width: 100%;
	margin: calc(-0.675em - 8px) 0;

	&:first-child {
		margin-top: calc(-0.675em - 8px - var(--MI-margin));
	}
}

.newButton {
	display: block;
	margin: var(--MI-margin) auto 0 auto;
	padding: 8px 16px;
	border-radius: 32px;
}

.postForm {
	border-radius: var(--MI-radius);
}

.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}

.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	border-top: solid 0.5px var(--MI_THEME-divider);
}
</style>
