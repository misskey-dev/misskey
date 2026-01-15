<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs" :actions="headerActions">
	<div class="_spacer" style="--MI_SPACER-w: 900px; --MI_SPACER-min: 20px; --MI_SPACER-max: 32px;">
		<div ref="el" class="vvcocwet" :class="{ wide: !narrow }">
			<div class="body">
				<div v-if="!narrow || currentPage?.route.name == null" class="nav">
					<div class="_gaps_s">
						<MkInfo v-if="emailNotConfigured" warn class="info">{{ i18n.ts.emailNotConfiguredWarning }} <MkA to="/settings/email" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
						<MkInfo v-if="!storagePersisted && store.r.showStoragePersistenceSuggestion.value" class="info">
							<div>{{ i18n.ts._settings.settingsPersistence_description1 }}</div>
							<div>{{ i18n.ts._settings.settingsPersistence_description2 }}</div>
							<div><button class="_textButton" @click="enableStoragePersistence">{{ i18n.ts.enable }}</button> | <button class="_textButton" @click="skipStoragePersistence">{{ i18n.ts.skip }}</button></div>
						</MkInfo>
						<MkInfo v-if="!store.r.enablePreferencesAutoCloudBackup.value && store.r.showPreferencesAutoCloudBackupSuggestion.value" class="info">
							<div>{{ i18n.ts._preferencesBackup.autoPreferencesBackupIsNotEnabledForThisDevice }}</div>
							<div><button class="_textButton" @click="enableAutoBackup">{{ i18n.ts.enable }}</button> | <button class="_textButton" @click="skipAutoBackup">{{ i18n.ts.skip }}</button></div>
						</MkInfo>
						<MkSuperMenu :def="menuDef" :grid="narrow" :searchIndex="searchIndex"></MkSuperMenu>
					</div>
				</div>
				<div v-if="!(narrow && currentPage?.route.name == null)" class="main">
					<div style="container-type: inline-size;">
						<NestedRouterView/>
					</div>
				</div>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import type { PageMetadata } from '@/page.js';
import type { SuperMenuDef } from '@/components/MkSuperMenu.vue';
import { i18n } from '@/i18n.js';
import MkInfo from '@/components/MkInfo.vue';
import MkSuperMenu from '@/components/MkSuperMenu.vue';
import { $i } from '@/i.js';
import { clearCache } from '@/utility/clear-cache.js';
import { instance } from '@/instance.js';
import { definePage, provideMetadataReceiver, provideReactiveMetadata } from '@/page.js';
import * as os from '@/os.js';
import { useRouter } from '@/router.js';
import { enableAutoBackup, getPreferencesProfileMenu } from '@/preferences/utility.js';
import { store } from '@/store.js';
import { signout } from '@/signout.js';
import { genSearchIndexes } from '@/utility/inapp-search.js';
import { enableStoragePersistence, storagePersisted, skipStoragePersistence } from '@/utility/storage.js';

const searchIndex = await import('search-index:settings').then(({ searchIndexes }) => genSearchIndexes(searchIndexes));

const indexInfo = {
	title: i18n.ts.settings,
	icon: 'ti ti-settings',
	hideHeader: true,
};
const INFO = ref<PageMetadata>(indexInfo);
const el = useTemplateRef('el');
const childInfo = ref<null | PageMetadata>(null);

const router = useRouter();

const narrow = ref(false);
const NARROW_THRESHOLD = 600;

const currentPage = computed(() => router.currentRef.value.child);

const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow.value = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

function skipAutoBackup() {
	store.set('showPreferencesAutoCloudBackupSuggestion', false);
}

const menuDef = computed<SuperMenuDef[]>(() => [{
	items: [{
		icon: 'ti ti-user',
		text: i18n.ts.profile,
		to: '/settings/profile',
		active: currentPage.value?.route.name === 'profile',
	}, {
		icon: 'ti ti-lock-open',
		text: i18n.ts.privacy,
		to: '/settings/privacy',
		active: currentPage.value?.route.name === 'privacy',
	}, {
		icon: 'ti ti-bell',
		text: i18n.ts.notifications,
		to: '/settings/notifications',
		active: currentPage.value?.route.name === 'notifications',
	}, {
		icon: 'ti ti-mail',
		text: i18n.ts.email,
		to: '/settings/email',
		active: currentPage.value?.route.name === 'email',
	}, {
		icon: 'ti ti-lock',
		text: i18n.ts.security,
		to: '/settings/security',
		active: currentPage.value?.route.name === 'security',
	}],
}, {
	items: [{
		icon: 'ti ti-adjustments',
		text: i18n.ts.preferences,
		to: '/settings/preferences',
		active: currentPage.value?.route.name === 'preferences',
	}, {
		icon: 'ti ti-palette',
		text: i18n.ts.theme,
		to: '/settings/theme',
		active: currentPage.value?.route.name === 'theme',
	}, {
		icon: 'ti ti-mood-happy',
		text: i18n.ts.emojiPalette,
		to: '/settings/emoji-palette',
		active: currentPage.value?.route.name === 'emoji-palette',
	}, {
		icon: 'ti ti-music',
		text: i18n.ts.sounds,
		to: '/settings/sounds',
		active: currentPage.value?.route.name === 'sounds',
	}, {
		icon: 'ti ti-plug',
		text: i18n.ts.plugins,
		to: '/settings/plugin',
		active: currentPage.value?.route.name === 'plugin',
	}],
}, {
	items: [{
		icon: 'ti ti-cloud',
		text: i18n.ts.drive,
		to: '/settings/drive',
		active: currentPage.value?.route.name === 'drive',
	}, {
		icon: 'ti ti-ban',
		text: i18n.ts.muteAndBlock,
		to: '/settings/mute-block',
		active: currentPage.value?.route.name === 'mute-block',
	}, {
		icon: 'ti ti-link',
		text: i18n.ts._settings.serviceConnection,
		to: '/settings/connect',
		active: currentPage.value?.route.name === 'connect',
	}, {
		icon: 'ti ti-package',
		text: i18n.ts._settings.accountData,
		to: '/settings/account-data',
		active: currentPage.value?.route.name === 'account-data',
	}, {
		icon: 'ti ti-dots',
		text: i18n.ts.other,
		to: '/settings/other',
		active: currentPage.value?.route.name === 'other',
	}],
}, {
	items: [{
		type: 'button',
		icon: 'ti ti-settings-2',
		text: i18n.ts.preferencesProfile,
		action: async (ev) => {
			os.popupMenu(getPreferencesProfileMenu(), ev.currentTarget ?? ev.target);
		},
	}, {
		type: 'button',
		icon: 'ti ti-trash',
		text: i18n.ts.clearCache,
		action: async () => {
			await clearCache();
		},
	}, {
		type: 'button',
		icon: 'ti ti-power',
		text: i18n.ts.logout,
		action: async () => {
			const { canceled } = await os.confirm({
				type: 'warning',
				title: i18n.ts.logoutConfirm,
				text: i18n.ts.logoutWillClearClientData,
			});
			if (canceled) return;
			signout();
		},
		danger: true,
	}],
}]);

onMounted(() => {
	if (el.value == null) return; // TSを黙らすため

	ro.observe(el.value);

	narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow.value && currentPage.value?.route.name == null) {
		router.replace('/settings/profile');
	}
});

onActivated(() => {
	if (el.value == null) return; // TSを黙らすため

	narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow.value && currentPage.value?.route.name == null) {
		router.replace('/settings/profile');
	}
});

onUnmounted(() => {
	ro.disconnect();
});

watch(router.currentRef, (to) => {
	if (to.route.name === 'settings' && to.child?.route.name == null && !narrow.value) {
		router.replace('/settings/profile');
	}
});

const emailNotConfigured = computed(() => $i && instance.enableEmail && ($i.email == null || !$i.emailVerified));

provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	if (info == null) {
		childInfo.value = null;
	} else {
		childInfo.value = info;
		INFO.value.needWideArea = info.needWideArea ?? undefined;
	}
});
provideReactiveMetadata(INFO);

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => INFO.value);
// w 890
// h 700
</script>

<style lang="scss" scoped>
.vvcocwet {
	&.wide {
		> .body {
			display: flex;
			height: 100%;

			> .nav {
				width: 34%;
				padding-right: 32px;
				box-sizing: border-box;
			}

			> .main {
				flex: 1;
				min-width: 0;
			}
		}
	}
}
</style>
