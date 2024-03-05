<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-if="childPageMetadata == null"/></template>
	<template #default>
		<div ref="rootEl" :class="[$style.root, { [$style.wide]: isWide }]">
			<div v-if="showNav" :class="$style.navRoot">
				<MkSpacer :contentMax="700" :marginMin="16">
					<div>
						<MkInfo v-if="emailNotConfigured" warn :class="$style.navInfo">{{ i18n.ts.emailNotConfiguredWarning }} <MkA to="/settings/email" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
						<MkSuperMenu :def="menuDef" :grid="!isWide"></MkSuperMenu>
					</div>
				</MkSpacer>
			</div>
			<div v-if="showMain" :class="$style.mainRoot">
				<div style="container-type: inline-size;">
					<RouterView/>
				</div>
			</div>
		</div>
		<MkFooterSpacer v-if="!isWide"/>
	</template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onActivated, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { signinRequired, signout } from '@/account.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import * as os from '@/os.js';
import { clearCache } from '@/scripts/clear-cache.js';
import { PageMetadata, definePageMetadata, provideMetadataReceiver, provideReactiveMetadata } from '@/scripts/page-metadata.js';
import { useRouter } from '@/router/supplier.js';
import MkInfo from '@/components/MkInfo.vue';
import MkSuperMenu from '@/components/MkSuperMenu.vue';

const ROOT_PAGE_PATH = '/settings' as const;
const INITIAL_PAGE_PATH = '/settings/profile' as const;

const $i = signinRequired();

const rootEl = shallowRef<HTMLElement | null>(null);

const showNav = computed(() => {
	if (isWide.value) return true; // wideなら常に表示
	return isRoot.value; // rootなら表示
});
const showMain = computed(() => {
	if (!isRoot.value) return true; // 非rootなら常に表示
	return isWide.value; // wideなら表示
});

const emailNotConfigured = computed(() => instance.enableEmail && ($i.email == null || !$i.emailVerified));

const router = useRouter();
const currentPage = computed(() => router.currentRef.value.child);
const isRoot = computed(() => currentPage.value?.route.name == null);

watch(router.currentRef, (to) => {
	if (to.route.path === ROOT_PAGE_PATH && to.child?.route.name == null) {
		if (isWide.value) {
			router.replace(INITIAL_PAGE_PATH);
		} else {
			childPageMetadata.value = null;
		}
	}
});

const isWide = ref(false);
const WIDE_THRESHOLD = 600 as const;

watch(isWide, () => {
	if (isRoot.value) {
		if (isWide.value) {
			router.replace(INITIAL_PAGE_PATH);
		} else {
			childPageMetadata.value = null;
		}
	}
});

const ro = new ResizeObserver((entries) => {
	const inlineSize = entries.at(0)?.borderBoxSize.at(0)?.inlineSize;
	if (inlineSize == null) return;
	isWide.value = inlineSize >= WIDE_THRESHOLD;
});

onMounted(() => {
	if (rootEl.value != null) {
		isWide.value = rootEl.value.offsetWidth >= WIDE_THRESHOLD;
		ro.observe(rootEl.value);
	}
	if (isRoot.value) {
		if (isWide.value) {
			router.replace(INITIAL_PAGE_PATH);
		} else {
			childPageMetadata.value = null;
		}
	}
});

onActivated(() => {
	if (rootEl.value != null) {
		isWide.value = rootEl.value.offsetWidth >= WIDE_THRESHOLD;
	}
	if (isRoot.value) {
		if (isWide.value) {
			router.replace(INITIAL_PAGE_PATH);
		} else {
			childPageMetadata.value = null;
		}
	}
});

onUnmounted(() => {
	ro.disconnect();
});

const childPageMetadata = ref<null | PageMetadata>(null);
const pageMetadata = computed<PageMetadata>(() => {
	if (childPageMetadata.value != null) {
		return childPageMetadata.value;
	}
	return {
		title: i18n.ts.settings,
		icon: 'ti ti-settings',
	};
});

provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	childPageMetadata.value = info;
});
provideReactiveMetadata(pageMetadata);

definePageMetadata(() => pageMetadata.value);

//#region menuDef
const menuDef = computed(() => [{
	title: i18n.ts.basicSettings,
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
		icon: 'ti ti-mood-happy',
		text: i18n.ts.emojiPicker,
		to: '/settings/emoji-picker',
		active: currentPage.value?.route.name === 'emojiPicker',
	}, {
		icon: 'ti ti-cloud',
		text: i18n.ts.drive,
		to: '/settings/drive',
		active: currentPage.value?.route.name === 'drive',
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
	title: i18n.ts.clientSettings,
	items: [{
		icon: 'ti ti-adjustments',
		text: i18n.ts.general,
		to: '/settings/general',
		active: currentPage.value?.route.name === 'general',
	}, {
		icon: 'ti ti-palette',
		text: i18n.ts.theme,
		to: '/settings/theme',
		active: currentPage.value?.route.name === 'theme',
	}, {
		icon: 'ti ti-menu-2',
		text: i18n.ts.navbar,
		to: '/settings/navbar',
		active: currentPage.value?.route.name === 'navbar',
	}, {
		icon: 'ti ti-equal-double',
		text: i18n.ts.statusbar,
		to: '/settings/statusbar',
		active: currentPage.value?.route.name === 'statusbar',
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
	title: i18n.ts.otherSettings,
	items: [{
		icon: 'ti ti-badges',
		text: i18n.ts.roles,
		to: '/settings/roles',
		active: currentPage.value?.route.name === 'roles',
	}, {
		icon: 'ti ti-ban',
		text: i18n.ts.muteAndBlock,
		to: '/settings/mute-block',
		active: currentPage.value?.route.name === 'mute-block',
	}, {
		icon: 'ti ti-api',
		text: 'API',
		to: '/settings/api',
		active: currentPage.value?.route.name === 'api',
	}, {
		icon: 'ti ti-webhook',
		text: 'Webhook',
		to: '/settings/webhook',
		active: currentPage.value?.route.name === 'webhook',
	}, {
		icon: 'ti ti-package',
		text: i18n.ts.importAndExport,
		to: '/settings/import-export',
		active: currentPage.value?.route.name === 'import-export',
	}, {
		icon: 'ti ti-plane',
		text: `${i18n.ts.accountMigration}`,
		to: '/settings/migration',
		active: currentPage.value?.route.name === 'migration',
	}, {
		icon: 'ti ti-dots',
		text: i18n.ts.other,
		to: '/settings/other',
		active: currentPage.value?.route.name === 'other',
	}],
}, {
	items: [{
		icon: 'ti ti-device-floppy',
		text: i18n.ts.preferencesBackups,
		to: '/settings/preferences-backups',
		active: currentPage.value?.route.name === 'preferences-backups',
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
				text: i18n.ts.logoutConfirm,
			});
			if (canceled) return;
			signout();
		},
		danger: true,
	}],
}]);
//#endregion
</script>

<style lang="scss" module>
.root {
	&.wide {
		height: 100%;
		margin: 0 auto;
		display: flex;
		box-sizing: border-box;

		@supports (height: 100cqh) {
			height: 100cqh;
			overflow: hidden; // fallback (overflow: clip)
			overflow: clip;
			contain: strict;
		}

		> .navRoot {
			width: 32%;
			height: 100%;
			max-width: 280px;
			overflow: auto;
			border-right: solid 0.5px var(--divider);
			box-sizing: border-box;

			@supports (height: 100cqh) {
				overflow-y: scroll;
				overscroll-behavior: contain;
			}
		}

		> .mainRoot {
			flex: 1;
			min-width: 0;
			height: 100%;
			overflow: auto;
			box-sizing: border-box;

			@supports (height: 100cqh) {
				overflow-y: scroll;
				overscroll-behavior: contain;
			}
		}
	}
}

.navInfo {
	margin: 16px 0;
}
</style>
