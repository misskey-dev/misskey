<template>
<div ref="el" class="hiyeyicy" :class="{ wide: !narrow }">
	<div v-if="!narrow || page == null" class="nav">
		<MkHeader :info="header"></MkHeader>
	
		<MkSpacer :content-max="700" :margin-min="16">
			<div class="lxpfedzu">
				<div class="banner">
					<img :src="$instance.iconUrl || '/favicon.ico'" alt="" class="icon"/>
				</div>

				<MkInfo v-if="noMaintainerInformation" warn class="info">{{ $ts.noMaintainerInformationWarning }} <MkA to="/admin/settings" class="_link">{{ $ts.configure }}</MkA></MkInfo>
				<MkInfo v-if="noBotProtection" warn class="info">{{ $ts.noBotProtectionWarning }} <MkA to="/admin/security" class="_link">{{ $ts.configure }}</MkA></MkInfo>

				<MkSuperMenu :def="menuDef" :grid="page == null"></MkSuperMenu>
			</div>
		</MkSpacer>
	</div>
	<div class="main">
		<MkStickyContainer>
			<template #header><MkHeader v-if="childInfo && !childInfo.hideHeader" :info="childInfo"/></template>
			<component :is="component" :ref="el => pageChanged(el)" :key="page" v-bind="pageProps"/>
		</MkStickyContainer>
	</div>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, isRef, nextTick, onMounted, provide, watch } from 'vue';
import { i18n } from '@/i18n';
import MkSuperMenu from '@/components/ui/super-menu.vue';
import MkInfo from '@/components/ui/info.vue';
import { scroll } from '@/scripts/scroll';
import { instance } from '@/instance';
import * as symbols from '@/symbols';
import * as os from '@/os';
import { lookupUser } from '@/scripts/lookup-user';

const indexInfo = {
	title: i18n.ts.controlPanel,
	icon: 'fas fa-cog',
	bg: 'var(--bg)',
	hideHeader: true,
};

const props = defineProps({
	initialPage: {
		type: String,
		required: false
	}
});

provide('shouldOmitHeaderTitle', false);

let INFO = $ref(indexInfo);
let childInfo = $ref(null);
let page = $ref(props.initialPage);
let narrow = $ref(false);
let view = $ref(null);
let el = $ref(null);
const pageChanged = (page) => {
	if (page == null) return;
	const viewInfo = page[symbols.PAGE_INFO];
	if (isRef(viewInfo)) {
		watch(viewInfo, () => {
			childInfo = viewInfo.value;
		}, { immediate: true });
	} else {
		childInfo = viewInfo;
	}
};
const pageProps = $ref({});

const isEmpty = (x: any) => x == null || x == '';

let noMaintainerInformation = isEmpty(instance.maintainerName) || isEmpty(instance.maintainerEmail);
let noBotProtection = !instance.enableHcaptcha && !instance.enableRecaptcha;

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
		active: page === 'overview',
	}, {
		icon: 'fas fa-users',
		text: i18n.ts.users,
		to: '/admin/users',
		active: page === 'users',
	}, {
		icon: 'fas fa-laugh',
		text: i18n.ts.customEmojis,
		to: '/admin/emojis',
		active: page === 'emojis',
	}, {
		icon: 'fas fa-globe',
		text: i18n.ts.federation,
		to: '/admin/federation',
		active: page === 'federation',
	}, {
		icon: 'fas fa-clipboard-list',
		text: i18n.ts.jobQueue,
		to: '/admin/queue',
		active: page === 'queue',
	}, {
		icon: 'fas fa-cloud',
		text: i18n.ts.files,
		to: '/admin/files',
		active: page === 'files',
	}, {
		icon: 'fas fa-broadcast-tower',
		text: i18n.ts.announcements,
		to: '/admin/announcements',
		active: page === 'announcements',
	}, {
		icon: 'fas fa-audio-description',
		text: i18n.ts.ads,
		to: '/admin/ads',
		active: page === 'ads',
	}, {
		icon: 'fas fa-exclamation-circle',
		text: i18n.ts.abuseReports,
		to: '/admin/abuses',
		active: page === 'abuses',
	}],
}, {
	title: i18n.ts.settings,
	items: [{
		icon: 'fas fa-cog',
		text: i18n.ts.general,
		to: '/admin/settings',
		active: page === 'settings',
	}, {
		icon: 'fas fa-envelope',
		text: i18n.ts.emailServer,
		to: '/admin/email-settings',
		active: page === 'email-settings',
	}, {
		icon: 'fas fa-cloud',
		text: i18n.ts.objectStorage,
		to: '/admin/object-storage',
		active: page === 'object-storage',
	}, {
		icon: 'fas fa-lock',
		text: i18n.ts.security,
		to: '/admin/security',
		active: page === 'security',
	}, {
		icon: 'fas fa-globe',
		text: i18n.ts.relays,
		to: '/admin/relays',
		active: page === 'relays',
	}, {
		icon: 'fas fa-share-alt',
		text: i18n.ts.integration,
		to: '/admin/integrations',
		active: page === 'integrations',
	}, {
		icon: 'fas fa-ban',
		text: i18n.ts.instanceBlocking,
		to: '/admin/instance-block',
		active: page === 'instance-block',
	}, {
		icon: 'fas fa-ghost',
		text: i18n.ts.proxyAccount,
		to: '/admin/proxy-account',
		active: page === 'proxy-account',
	}, {
		icon: 'fas fa-cogs',
		text: i18n.ts.other,
		to: '/admin/other-settings',
		active: page === 'other-settings',
	}],
}, {
	title: i18n.ts.info,
	items: [{
		icon: 'fas fa-database',
		text: i18n.ts.database,
		to: '/admin/database',
		active: page === 'database',
	}],
}]);
const component = $computed(() => {
	if (page == null) return null;
	switch (page) {
		case 'overview': return defineAsyncComponent(() => import('./overview.vue'));
		case 'users': return defineAsyncComponent(() => import('./users.vue'));
		case 'emojis': return defineAsyncComponent(() => import('./emojis.vue'));
		case 'federation': return defineAsyncComponent(() => import('../federation.vue'));
		case 'queue': return defineAsyncComponent(() => import('./queue.vue'));
		case 'files': return defineAsyncComponent(() => import('./files.vue'));
		case 'announcements': return defineAsyncComponent(() => import('./announcements.vue'));
		case 'ads': return defineAsyncComponent(() => import('./ads.vue'));
		case 'database': return defineAsyncComponent(() => import('./database.vue'));
		case 'abuses': return defineAsyncComponent(() => import('./abuses.vue'));
		case 'settings': return defineAsyncComponent(() => import('./settings.vue'));
		case 'email-settings': return defineAsyncComponent(() => import('./email-settings.vue'));
		case 'object-storage': return defineAsyncComponent(() => import('./object-storage.vue'));
		case 'security': return defineAsyncComponent(() => import('./security.vue'));
		case 'relays': return defineAsyncComponent(() => import('./relays.vue'));
		case 'integrations': return defineAsyncComponent(() => import('./integrations.vue'));
		case 'instance-block': return defineAsyncComponent(() => import('./instance-block.vue'));
		case 'proxy-account': return defineAsyncComponent(() => import('./proxy-account.vue'));
		case 'other-settings': return defineAsyncComponent(() => import('./other-settings.vue'));
	}
});

watch(component, () => {
	pageProps = {};

	nextTick(() => {
		scroll(el, { top: 0 });
	});
}, { immediate: true });

watch(() => props.initialPage, () => {
	if (props.initialPage == null && !narrow) {
		page = 'overview';
	} else {
		page = props.initialPage;
		if (props.initialPage == null) {
			INFO = indexInfo;
		}
	}
});

onMounted(() => {
	narrow = el.offsetWidth < 800;
	if (!narrow) {
		page = 'overview';
	}
});

const invite = () => {
	os.api('admin/invite').then(x => {
		os.alert({
			type: 'info',
			text: x.code
		});
	}).catch(e => {
		os.alert({
			type: 'error',
			text: e
		});
	});
};

const lookup = (ev) => {
	os.popupMenu([{
		text: i18n.ts.user,
		icon: 'fas fa-user',
		action: () => {
			lookupUser();
		}
	}, {
		text: i18n.ts.note,
		icon: 'fas fa-pencil-alt',
		action: () => {
			alert('TODO');
		}
	}, {
		text: i18n.ts.file,
		icon: 'fas fa-cloud',
		action: () => {
			alert('TODO');
		}
	}, {
		text: i18n.ts.instance,
		icon: 'fas fa-globe',
		action: () => {
			alert('TODO');
		}
	}], ev.currentTarget ?? ev.target);
};

defineExpose({
	[symbols.PAGE_INFO]: INFO,
	header: {
		title: i18n.ts.controlPanel,
	}
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
