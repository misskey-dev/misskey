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
						<div :class="$style.serverBanner">
							<img :src="instance.iconUrl || '/favicon.ico'" alt="" :class="$style.serverIcon"/>
						</div>
						<MkInfo v-if="thereIsUnresolvedAbuseReport" warn :class="$style.navInfo">{{ i18n.ts.thereIsUnresolvedAbuseReportWarning }} <MkA to="/admin/abuses" class="_link">{{ i18n.ts.check }}</MkA></MkInfo>
						<MkInfo v-if="noMaintainerInformation" warn :class="$style.navInfo">{{ i18n.ts.noMaintainerInformationWarning }} <MkA to="/admin/settings" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
						<MkInfo v-if="noBotProtection" warn :class="$style.navInfo">{{ i18n.ts.noBotProtectionWarning }} <MkA to="/admin/security" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
						<MkInfo v-if="noEmailServer" warn :class="$style.navInfo">{{ i18n.ts.noEmailServerWarning }} <MkA to="/admin/email-settings" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
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
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import * as os from '@/os.js';
import { lookupUser, lookupUserByEmail } from '@/scripts/lookup-user.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { PageMetadata, definePageMetadata, provideMetadataReceiver, provideReactiveMetadata } from '@/scripts/page-metadata.js';
import { useRouter } from '@/router/supplier.js';
import MkInfo from '@/components/MkInfo.vue';
import MkSuperMenu from '@/components/MkSuperMenu.vue';

const ROOT_PAGE_PATH = '/admin' as const;
const INITIAL_PAGE_PATH = '/admin/overview' as const;

const rootEl = shallowRef<HTMLElement | null>(null);

const showNav = computed(() => {
	if (isWide.value) return true; // wideなら常に表示
	return isRoot.value; // rootなら表示
});
const showMain = computed(() => {
	if (!isRoot.value) return true; // 非rootなら常に表示
	return isWide.value; // wideなら表示
});

const thereIsUnresolvedAbuseReport = ref(false);
misskeyApi('admin/abuse-user-reports', {
	state: 'unresolved',
	limit: 1,
}).then(reports => {
	if (reports.length > 0) thereIsUnresolvedAbuseReport.value = true;
});
const noMaintainerInformation = computed(() => {
	const isEmpty = (x: unknown): boolean => x == null || x === '';
	return isEmpty(instance.maintainerName) || isEmpty(instance.maintainerEmail);
});
const noBotProtection = computed(() => !instance.disableRegistration && !instance.enableHcaptcha && !instance.enableRecaptcha && !instance.enableTurnstile);
const noEmailServer = computed(() => !instance.enableEmail);

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
		title: i18n.ts.controlPanel,
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
	title: i18n.ts.quickAction,
	items: [{
		type: 'button',
		icon: 'ti ti-search',
		text: i18n.ts.lookup,
		action: lookup,
	}, ...(instance.disableRegistration ? [{
		type: 'button',
		icon: 'ti ti-user-plus',
		text: i18n.ts.createInviteCode,
		action: invite,
	}] : [])],
}, {
	title: i18n.ts.administration,
	items: [{
		icon: 'ti ti-dashboard',
		text: i18n.ts.dashboard,
		to: '/admin/overview',
		active: currentPage.value?.route.name === 'overview',
	}, {
		icon: 'ti ti-users',
		text: i18n.ts.users,
		to: '/admin/users',
		active: currentPage.value?.route.name === 'users',
	}, {
		icon: 'ti ti-user-plus',
		text: i18n.ts.invite,
		to: '/admin/invites',
		active: currentPage.value?.route.name === 'invites',
	}, {
		icon: 'ti ti-badges',
		text: i18n.ts.roles,
		to: '/admin/roles',
		active: currentPage.value?.route.name === 'roles',
	}, {
		icon: 'ti ti-icons',
		text: i18n.ts.customEmojis,
		to: '/admin/emojis',
		active: currentPage.value?.route.name === 'emojis',
	}, {
		icon: 'ti ti-sparkles',
		text: i18n.ts.avatarDecorations,
		to: '/admin/avatar-decorations',
		active: currentPage.value?.route.name === 'avatarDecorations',
	}, {
		icon: 'ti ti-whirl',
		text: i18n.ts.federation,
		to: '/admin/federation',
		active: currentPage.value?.route.name === 'federation',
	}, {
		icon: 'ti ti-clock-play',
		text: i18n.ts.jobQueue,
		to: '/admin/queue',
		active: currentPage.value?.route.name === 'queue',
	}, {
		icon: 'ti ti-cloud',
		text: i18n.ts.files,
		to: '/admin/files',
		active: currentPage.value?.route.name === 'files',
	}, {
		icon: 'ti ti-speakerphone',
		text: i18n.ts.announcements,
		to: '/admin/announcements',
		active: currentPage.value?.route.name === 'announcements',
	}, {
		icon: 'ti ti-ad',
		text: i18n.ts.ads,
		to: '/admin/ads',
		active: currentPage.value?.route.name === 'ads',
	}, {
		icon: 'ti ti-exclamation-circle',
		text: i18n.ts.abuseReports,
		to: '/admin/abuses',
		active: currentPage.value?.route.name === 'abuses',
	}, {
		icon: 'ti ti-list-search',
		text: i18n.ts.moderationLogs,
		to: '/admin/modlog',
		active: currentPage.value?.route.name === 'modlog',
	}],
}, {
	title: i18n.ts.settings,
	items: [{
		icon: 'ti ti-settings',
		text: i18n.ts.general,
		to: '/admin/settings',
		active: currentPage.value?.route.name === 'settings',
	}, {
		icon: 'ti ti-paint',
		text: i18n.ts.branding,
		to: '/admin/branding',
		active: currentPage.value?.route.name === 'branding',
	}, {
		icon: 'ti ti-shield',
		text: i18n.ts.moderation,
		to: '/admin/moderation',
		active: currentPage.value?.route.name === 'moderation',
	}, {
		icon: 'ti ti-mail',
		text: i18n.ts.emailServer,
		to: '/admin/email-settings',
		active: currentPage.value?.route.name === 'email-settings',
	}, {
		icon: 'ti ti-cloud',
		text: i18n.ts.objectStorage,
		to: '/admin/object-storage',
		active: currentPage.value?.route.name === 'object-storage',
	}, {
		icon: 'ti ti-lock',
		text: i18n.ts.security,
		to: '/admin/security',
		active: currentPage.value?.route.name === 'security',
	}, {
		icon: 'ti ti-planet',
		text: i18n.ts.relays,
		to: '/admin/relays',
		active: currentPage.value?.route.name === 'relays',
	}, {
		icon: 'ti ti-ban',
		text: i18n.ts.instanceBlocking,
		to: '/admin/instance-block',
		active: currentPage.value?.route.name === 'instance-block',
	}, {
		icon: 'ti ti-ghost',
		text: i18n.ts.proxyAccount,
		to: '/admin/proxy-account',
		active: currentPage.value?.route.name === 'proxy-account',
	}, {
		icon: 'ti ti-link',
		text: i18n.ts.externalServices,
		to: '/admin/external-services',
		active: currentPage.value?.route.name === 'external-services',
	}, {
		icon: 'ti ti-adjustments',
		text: i18n.ts.other,
		to: '/admin/other-settings',
		active: currentPage.value?.route.name === 'other-settings',
	}],
}, {
	title: i18n.ts.info,
	items: [{
		icon: 'ti ti-database',
		text: i18n.ts.database,
		to: '/admin/database',
		active: currentPage.value?.route.name === 'database',
	}],
}]);

function invite() {
	misskeyApi('admin/invite/create').then(x => {
		os.alert({
			type: 'info',
			text: x[0].code,
		});
	}).catch(err => {
		os.alert({
			type: 'error',
			text: err,
		});
	});
}

function lookup(ev: MouseEvent) {
	os.popupMenu([{
		text: i18n.ts.user,
		icon: 'ti ti-user',
		action: () => {
			lookupUser();
		},
	}, {
		text: `${i18n.ts.user} (${i18n.ts.email})`,
		icon: 'ti ti-user',
		action: () => {
			lookupUserByEmail();
		},
	}, {
		text: i18n.ts.note,
		icon: 'ti ti-pencil',
		action: () => {
			alert('TODO');
		},
	}, {
		text: i18n.ts.file,
		icon: 'ti ti-cloud',
		action: () => {
			alert('TODO');
		},
	}, {
		text: i18n.ts.instance,
		icon: 'ti ti-planet',
		action: () => {
			alert('TODO');
		},
	}], ev.currentTarget ?? ev.target);
}
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

.serverBanner {
	margin: 16px;
}

.serverIcon {
	display: block;
	margin: auto;
	height: 42px;
	border-radius: 8px;
}
</style>
