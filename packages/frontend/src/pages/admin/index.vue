<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="el" class="hiyeyicy" :class="{ wide: !narrow }">
	<div v-if="!narrow || currentPage?.route.name == null" class="nav">
		<MkSpacer :contentMax="700" :marginMin="16">
			<div class="lxpfedzu">
				<div class="banner">
					<img :src="instance.iconUrl || '/favicon.ico'" alt="" class="icon"/>
				</div>

				<MkInfo v-if="thereIsUnresolvedAbuseReport" warn class="info">{{ i18n.ts.thereIsUnresolvedAbuseReportWarning }} <MkA to="/admin/abuses" class="_link">{{ i18n.ts.check }}</MkA></MkInfo>
				<MkInfo v-if="noMaintainerInformation" warn class="info">{{ i18n.ts.noMaintainerInformationWarning }} <MkA to="/admin/settings" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
				<MkInfo v-if="noBotProtection" warn class="info">{{ i18n.ts.noBotProtectionWarning }} <MkA to="/admin/security" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
				<MkInfo v-if="noEmailServer" warn class="info">{{ i18n.ts.noEmailServerWarning }} <MkA to="/admin/email-settings" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>

				<MkSuperMenu :def="menuDef" :grid="narrow"></MkSuperMenu>
			</div>
		</MkSpacer>
	</div>
	<div v-if="!(narrow && currentPage?.route.name == null)" class="main">
		<RouterView/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ComputedRef, Ref, onActivated, onMounted, onUnmounted, provide, watch, ref, computed } from 'vue';
import { i18n } from '@/i18n.js';
import MkSuperMenu from '@/components/MkSuperMenu.vue';
import MkInfo from '@/components/MkInfo.vue';
import { instance } from '@/instance.js';
import * as os from '@/os.js';
import { lookupUser, lookupUserByEmail } from '@/scripts/lookup-user.js';
import { useRouter } from '@/router.js';
import { PageMetadata, definePageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata.js';

const isEmpty = (x: string | null) => x == null || x === '';

const router = useRouter();

const indexInfo = {
	title: i18n.ts.controlPanel,
	icon: 'ti ti-settings',
	hideHeader: true,
};

provide('shouldOmitHeaderTitle', false);

const INFO = ref(indexInfo);
const childInfo: Ref<ComputedRef<PageMetadata> | null> = ref(null);
const narrow = ref(false);
const view = ref(null);
const el = ref<HTMLDivElement | null>(null);
const pageProps = ref({});
let noMaintainerInformation = isEmpty(instance.maintainerName) || isEmpty(instance.maintainerEmail);
let noBotProtection = !instance.disableRegistration && !instance.enableHcaptcha && !instance.enableRecaptcha && !instance.enableTurnstile;
let noEmailServer = !instance.enableEmail;
const thereIsUnresolvedAbuseReport = ref(false);
const currentPage = computed(() => router.currentRef.value.child);

os.api('admin/abuse-user-reports', {
	state: 'unresolved',
	limit: 1,
}).then(reports => {
	if (reports.length > 0) thereIsUnresolvedAbuseReport.value = true;
});

const NARROW_THRESHOLD = 600;
const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow.value = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

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

watch(narrow.value, () => {
	if (currentPage.value?.route.name == null && !narrow.value) {
		router.push('/admin/overview');
	}
});

onMounted(() => {
	ro.observe(el.value);

	narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;
	if (currentPage.value?.route.name == null && !narrow.value) {
		router.push('/admin/overview');
	}
});

onActivated(() => {
	narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;
	if (currentPage.value?.route.name == null && !narrow.value) {
		router.push('/admin/overview');
	}
});

onUnmounted(() => {
	ro.disconnect();
});

watch(router.currentRef, (to) => {
	if (to.route.path === '/admin' && to.child?.route.name == null && !narrow.value) {
		router.replace('/admin/overview');
	}
});

provideMetadataReceiver((info) => {
	if (info == null) {
		childInfo.value = null;
	} else {
		childInfo.value = info;
		INFO.value.needWideArea = info.value.needWideArea ?? undefined;
	}
});

function invite() {
	os.api('admin/invite/create').then(x => {
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

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(INFO.value);

defineExpose({
	header: {
		title: i18n.ts.controlPanel,
	},
});
</script>

<style lang="scss" scoped>
.hiyeyicy {
	&.wide {
		display: flex;
		margin: 0 auto;
		height: 100%;

		> .nav {
			width: 32%;
			max-width: 280px;
			box-sizing: border-box;
			border-right: solid 0.5px var(--divider);
			overflow: auto;
			height: 100%;
		}

		> .main {
			flex: 1;
			min-width: 0;
		}
	}

	> .nav {
		.lxpfedzu {
			> .info {
				margin: 16px 0;
			}

			> .banner {
				margin: 16px;

				> .icon {
					display: block;
					margin: auto;
					height: 42px;
					border-radius: 8px;
				}
			}
		}
	}
}
</style>
