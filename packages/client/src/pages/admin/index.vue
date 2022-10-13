<template>
<div ref="el" class="hiyeyicy" :class="{ wide: !narrow }">
	<div v-if="!narrow || currentPage?.route.name == null" class="nav">	
		<MkSpacer :content-max="700" :margin-min="16">
			<div class="lxpfedzu">
				<div class="banner">
					<img :src="$instance.iconUrl || '/favicon.ico'" alt="" class="icon"/>
				</div>

				<MkInfo v-if="thereIsUnresolvedAbuseReport" warn class="info">{{ i18n.ts.thereIsUnresolvedAbuseReportWarning }} <MkA to="/admin/abuses" class="_link">{{ i18n.ts.check }}</MkA></MkInfo>
				<MkInfo v-if="noMaintainerInformation" warn class="info">{{ i18n.ts.noMaintainerInformationWarning }} <MkA to="/admin/settings" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
				<MkInfo v-if="noBotProtection" warn class="info">{{ i18n.ts.noBotProtectionWarning }} <MkA to="/admin/security" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
				<MkInfo v-if="noEmailServer" warn class="info">{{ i18n.ts.noEmailServerWarning }} <MkA to="/admin/email-settings" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>

				<MkSuperMenu :def="menuDef" :grid="currentPage?.route.name == null"></MkSuperMenu>
			</div>
		</MkSpacer>
	</div>
	<div v-if="!(narrow && currentPage?.route.name == null)" class="main">
		<RouterView/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, inject, nextTick, onMounted, onUnmounted, provide, watch } from 'vue';
import { i18n } from '@/i18n';
import MkSuperMenu from '@/components/MkSuperMenu.vue';
import MkInfo from '@/components/MkInfo.vue';
import { scroll } from '@/scripts/scroll';
import { instance } from '@/instance';
import * as os from '@/os';
import { lookupUser } from '@/scripts/lookup-user';
import { useRouter } from '@/router';
import { definePageMetadata, provideMetadataReceiver, setPageMetadata } from '@/scripts/page-metadata';

const isEmpty = (x: string | null) => x == null || x === '';

const router = useRouter();

const indexInfo = {
	title: i18n.ts.controlPanel,
	icon: 'fas fa-cog',
	hideHeader: true,
};

provide('shouldOmitHeaderTitle', false);

let INFO = $ref(indexInfo);
let childInfo = $ref(null);
let narrow = $ref(false);
let view = $ref(null);
let el = $ref(null);
let pageProps = $ref({});
let noMaintainerInformation = isEmpty(instance.maintainerName) || isEmpty(instance.maintainerEmail);
let noBotProtection = !instance.disableRegistration && !instance.enableHcaptcha && !instance.enableRecaptcha && !instance.enableTurnstile;
let noEmailServer = !instance.enableEmail;
let thereIsUnresolvedAbuseReport = $ref(false);
let currentPage = $computed(() => router.currentRef.value.child);

os.api('admin/abuse-user-reports', {
	state: 'unresolved',
	limit: 1,
}).then(reports => {
	if (reports.length > 0) thereIsUnresolvedAbuseReport = true;
});

const NARROW_THRESHOLD = 600;
const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

const menuDef = $computed(() => [{
	title: i18n.ts.quickAction,
	items: [{
		type: 'button',
		icon: 'fas fa-search',
		text: i18n.ts.lookup,
		action: lookup,
	}, ...(instance.disableRegistration ? [{
		type: 'button',
		icon: 'fas fa-user',
		text: i18n.ts.invite,
		action: invite,
	}] : [])],
}, {
	title: i18n.ts.administration,
	items: [{
		icon: 'fas fa-tachometer-alt',
		text: i18n.ts.dashboard,
		to: '/admin/overview',
		active: currentPage?.route.name === 'overview',
	}, {
		icon: 'fas fa-users',
		text: i18n.ts.users,
		to: '/admin/users',
		active: currentPage?.route.name === 'users',
	}, {
		icon: 'fas fa-laugh',
		text: i18n.ts.customEmojis,
		to: '/admin/emojis',
		active: currentPage?.route.name === 'emojis',
	}, {
		icon: 'fas fa-globe',
		text: i18n.ts.federation,
		to: '/about#federation',
		active: currentPage?.route.name === 'federation',
	}, {
		icon: 'fas fa-clipboard-list',
		text: i18n.ts.jobQueue,
		to: '/admin/queue',
		active: currentPage?.route.name === 'queue',
	}, {
		icon: 'fas fa-cloud',
		text: i18n.ts.files,
		to: '/admin/files',
		active: currentPage?.route.name === 'files',
	}, {
		icon: 'fas fa-broadcast-tower',
		text: i18n.ts.announcements,
		to: '/admin/announcements',
		active: currentPage?.route.name === 'announcements',
	}, {
		icon: 'fas fa-audio-description',
		text: i18n.ts.ads,
		to: '/admin/ads',
		active: currentPage?.route.name === 'ads',
	}, {
		icon: 'fas fa-exclamation-circle',
		text: i18n.ts.abuseReports,
		to: '/admin/abuses',
		active: currentPage?.route.name === 'abuses',
	}],
}, {
	title: i18n.ts.settings,
	items: [{
		icon: 'fas fa-cog',
		text: i18n.ts.general,
		to: '/admin/settings',
		active: currentPage?.route.name === 'settings',
	}, {
		icon: 'fas fa-envelope',
		text: i18n.ts.emailServer,
		to: '/admin/email-settings',
		active: currentPage?.route.name === 'email-settings',
	}, {
		icon: 'fas fa-cloud',
		text: i18n.ts.objectStorage,
		to: '/admin/object-storage',
		active: currentPage?.route.name === 'object-storage',
	}, {
		icon: 'fas fa-lock',
		text: i18n.ts.security,
		to: '/admin/security',
		active: currentPage?.route.name === 'security',
	}, {
		icon: 'fas fa-globe',
		text: i18n.ts.relays,
		to: '/admin/relays',
		active: currentPage?.route.name === 'relays',
	}, {
		icon: 'fas fa-share-alt',
		text: i18n.ts.integration,
		to: '/admin/integrations',
		active: currentPage?.route.name === 'integrations',
	}, {
		icon: 'fas fa-ban',
		text: i18n.ts.instanceBlocking,
		to: '/admin/instance-block',
		active: currentPage?.route.name === 'instance-block',
	}, {
		icon: 'fas fa-ghost',
		text: i18n.ts.proxyAccount,
		to: '/admin/proxy-account',
		active: currentPage?.route.name === 'proxy-account',
	}, {
		icon: 'fas fa-cogs',
		text: i18n.ts.other,
		to: '/admin/other-settings',
		active: currentPage?.route.name === 'other-settings',
	}],
}, {
	title: i18n.ts.info,
	items: [{
		icon: 'fas fa-database',
		text: i18n.ts.database,
		to: '/admin/database',
		active: currentPage?.route.name === 'database',
	}],
}]);

watch(narrow, () => {
	if (currentPage?.route.name == null && !narrow) {
		router.push('/admin/overview');
	}
});

onMounted(() => {
	ro.observe(el);

	narrow = el.offsetWidth < NARROW_THRESHOLD;
	if (currentPage?.route.name == null && !narrow) {
		router.push('/admin/overview');
	}
});

onUnmounted(() => {
	ro.disconnect();
});

provideMetadataReceiver((info) => {
	if (info == null) {
		childInfo = null;
	} else {
		childInfo = info;
	}
});

const invite = () => {
	os.api('admin/invite').then(x => {
		os.alert({
			type: 'info',
			text: x.code,
		});
	}).catch(err => {
		os.alert({
			type: 'error',
			text: err,
		});
	});
};

const lookup = (ev) => {
	os.popupMenu([{
		text: i18n.ts.user,
		icon: 'fas fa-user',
		action: () => {
			lookupUser();
		},
	}, {
		text: i18n.ts.note,
		icon: 'fas fa-pencil-alt',
		action: () => {
			alert('TODO');
		},
	}, {
		text: i18n.ts.file,
		icon: 'fas fa-cloud',
		action: () => {
			alert('TODO');
		},
	}, {
		text: i18n.ts.instance,
		icon: 'fas fa-globe',
		action: () => {
			alert('TODO');
		},
	}], ev.currentTarget ?? ev.target);
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(INFO);

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
