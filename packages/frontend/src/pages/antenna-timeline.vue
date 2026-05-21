<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div v-if="antenna && !isOwned" :class="$style.ownerBar">
			<MkAvatar :user="antenna.user" :class="$style.avatar" indicator link preview/>
			<MkUserName :user="antenna.user" :nowrap="false"/>
		</div>
		<div :class="$style.tl">
			<MkStreamingNotesTimeline
				ref="tlEl" :key="antennaId"
				src="antenna"
				:antenna="antennaId"
				:sound="true"
			/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { url } from '@@/js/config.js';
import type { MenuItem } from '@/types/menu.js';
import type { PageHeaderItem } from '@/types/page-header.js';
import MkStreamingNotesTimeline from '@/components/MkStreamingNotesTimeline.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';
import { $i } from '@/i.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { isSupportShare } from '@/utility/navigator.js';
import { favoritedAntennasCache } from '@/cache.js';

const router = useRouter();

const props = defineProps<{
	antennaId: string;
}>();

const antenna = ref<Misskey.entities.Antenna | null>(null);
const tlEl = useTemplateRef('tlEl');

const isOwned = computed<boolean>(() => !!$i && !!antenna.value && $i.id === antenna.value.userId);

function settings() {
	router.push('/my/antennas/:antennaId', {
		params: {
			antennaId: props.antennaId,
		},
	});
}

async function favorite() {
	if (!antenna.value) return;
	await os.apiWithDialog('antennas/favorite', { antennaId: antenna.value.id });
	antenna.value = { ...antenna.value, isFavorited: true, favoritedCount: antenna.value.favoritedCount + 1 };
	favoritedAntennasCache.delete();
}

async function unfavorite() {
	if (!antenna.value) return;
	const { canceled } = await os.confirm({ type: 'warning', text: i18n.ts.unfavoriteConfirm });
	if (canceled) return;
	await os.apiWithDialog('antennas/unfavorite', { antennaId: antenna.value.id });
	antenna.value = { ...antenna.value, isFavorited: false, favoritedCount: Math.max(antenna.value.favoritedCount - 1, 0) };
	favoritedAntennasCache.delete();
}

function shareMenu(ev: MouseEvent) {
	if (!antenna.value || !antenna.value.isPublic) return;
	const target = ev.currentTarget ?? ev.target;
	const menuItems: MenuItem[] = [{
		icon: 'ti ti-link',
		text: i18n.ts.copyUrl,
		action: () => copyToClipboard(`${url}/timeline/antenna/${antenna.value!.id}`),
	}];
	if (isSupportShare()) {
		menuItems.push({
			icon: 'ti ti-share',
			text: i18n.ts.share,
			action: () => navigator.share({
				title: antenna.value!.name,
				url: `${url}/timeline/antenna/${antenna.value!.id}`,
			}),
		});
	}
	os.popupMenu(menuItems, target as HTMLElement);
}

watch(() => props.antennaId, async () => {
	antenna.value = await misskeyApi('antennas/show', {
		antennaId: props.antennaId,
	});
}, { immediate: true });

const headerActions = computed<PageHeaderItem[]>(() => {
	if (!antenna.value) return [];
	const actions: PageHeaderItem[] = [];
	if (isOwned.value) {
		actions.push({
			icon: 'ti ti-settings',
			text: i18n.ts.settings,
			handler: settings,
		});
	}
	if (antenna.value.isPublic) {
		actions.push({
			icon: 'ti ti-share',
			text: i18n.ts.share,
			handler: shareMenu,
		});
		if ($i) {
			if (antenna.value.isFavorited) {
				actions.push({
					icon: 'ti ti-heart-filled',
					text: i18n.ts.unfavorite,
					handler: unfavorite,
				});
			} else {
				actions.push({
					icon: 'ti ti-heart',
					text: i18n.ts.favorite,
					handler: favorite,
				});
			}
		}
	}
	return actions;
});

const headerTabs = computed(() => []);

definePage(() => ({
	title: antenna.value ? antenna.value.name : i18n.ts.antennas,
	icon: 'ti ti-antenna',
}));
</script>

<style lang="scss" module>
.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}

.ownerBar {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	margin-bottom: 12px;
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}

.avatar {
	width: 32px;
	height: 32px;
}
</style>
