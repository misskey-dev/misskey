<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="900" :margin-min="20" :margin-max="32">
		<div ref="el" class="vvcocwet" :class="{ wide: !narrow }">
			<div class="body">
				<div v-if="!narrow || initialPage == null" class="nav">
					<div class="baaadecd">
						<MkInfo v-if="emailNotConfigured" warn class="info">{{ $ts.emailNotConfiguredWarning }} <MkA to="/settings/email" class="_link">{{ $ts.configure }}</MkA></MkInfo>
						<MkSuperMenu :def="menuDef" :grid="initialPage == null"></MkSuperMenu>
					</div>
				</div>
				<div v-if="!(narrow && initialPage == null)" class="main">
					<div class="bkzroven">
						<component :is="component" :key="initialPage" v-bind="pageProps"/>
					</div>
				</div>
			</div>
		</div>
	</MkSpacer>
</mkstickycontainer>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, inject, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue';
import { i18n } from '@/i18n';
import MkInfo from '@/components/ui/info.vue';
import MkSuperMenu from '@/components/ui/super-menu.vue';
import { scroll } from '@/scripts/scroll';
import { signout , $i } from '@/account';
import { unisonReload } from '@/scripts/unison-reload';
import { instance } from '@/instance';
import { useRouter } from '@/router';
import { definePageMetadata, provideMetadataReceiver, setPageMetadata } from '@/scripts/page-metadata';
import * as os from '@/os';

const props = withDefaults(defineProps<{
  initialPage?: string;
}>(), {
});

const indexInfo = {
	title: i18n.ts.settings,
	icon: 'fas fa-cog',
	hideHeader: true,
};
const INFO = ref(indexInfo);
const el = ref<HTMLElement | null>(null);
const childInfo = ref(null);

const router = useRouter();

const narrow = ref(false);
const NARROW_THRESHOLD = 600;

const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow.value = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

const menuDef = computed(() => [{
	title: i18n.ts.basicSettings,
	items: [{
		icon: 'fas fa-user',
		text: i18n.ts.profile,
		to: '/settings/profile',
		active: props.initialPage === 'profile',
	}, {
		icon: 'fas fa-lock-open',
		text: i18n.ts.privacy,
		to: '/settings/privacy',
		active: props.initialPage === 'privacy',
	}, {
		icon: 'fas fa-laugh',
		text: i18n.ts.reaction,
		to: '/settings/reaction',
		active: props.initialPage === 'reaction',
	}, {
		icon: 'fas fa-cloud',
		text: i18n.ts.drive,
		to: '/settings/drive',
		active: props.initialPage === 'drive',
	}, {
		icon: 'fas fa-bell',
		text: i18n.ts.notifications,
		to: '/settings/notifications',
		active: props.initialPage === 'notifications',
	}, {
		icon: 'fas fa-envelope',
		text: i18n.ts.email,
		to: '/settings/email',
		active: props.initialPage === 'email',
	}, {
		icon: 'fas fa-share-alt',
		text: i18n.ts.integration,
		to: '/settings/integration',
		active: props.initialPage === 'integration',
	}, {
		icon: 'fas fa-lock',
		text: i18n.ts.security,
		to: '/settings/security',
		active: props.initialPage === 'security',
	}],
}, {
	title: i18n.ts.clientSettings,
	items: [{
		icon: 'fas fa-cogs',
		text: i18n.ts.general,
		to: '/settings/general',
		active: props.initialPage === 'general',
	}, {
		icon: 'fas fa-palette',
		text: i18n.ts.theme,
		to: '/settings/theme',
		active: props.initialPage === 'theme',
	}, {
		icon: 'fas fa-bars',
		text: i18n.ts.navbar,
		to: '/settings/navbar',
		active: props.initialPage === 'navbar',
	}, {
		icon: 'fas fa-bars-progress',
		text: i18n.ts.statusbar,
		to: '/settings/statusbars',
		active: props.initialPage === 'statusbars',
	}, {
		icon: 'fas fa-music',
		text: i18n.ts.sounds,
		to: '/settings/sounds',
		active: props.initialPage === 'sounds',
	}, {
		icon: 'fas fa-plug',
		text: i18n.ts.plugins,
		to: '/settings/plugin',
		active: props.initialPage === 'plugin',
	}],
}, {
	title: i18n.ts.otherSettings,
	items: [{
		icon: 'fas fa-boxes',
		text: i18n.ts.importAndExport,
		to: '/settings/import-export',
		active: props.initialPage === 'import-export',
	}, {
		icon: 'fas fa-volume-mute',
		text: i18n.ts.instanceMute,
		to: '/settings/instance-mute',
		active: props.initialPage === 'instance-mute',
	}, {
		icon: 'fas fa-ban',
		text: i18n.ts.muteAndBlock,
		to: '/settings/mute-block',
		active: props.initialPage === 'mute-block',
	}, {
		icon: 'fas fa-comment-slash',
		text: i18n.ts.wordMute,
		to: '/settings/word-mute',
		active: props.initialPage === 'word-mute',
	}, {
		icon: 'fas fa-key',
		text: 'API',
		to: '/settings/api',
		active: props.initialPage === 'api',
	}, {
		icon: 'fas fa-bolt',
		text: 'Webhook',
		to: '/settings/webhook',
		active: props.initialPage === 'webhook',
	}, {
		icon: 'fas fa-ellipsis-h',
		text: i18n.ts.other,
		to: '/settings/other',
		active: props.initialPage === 'other',
	}],
}, {
	items: [{
		type: 'button',
		icon: 'fas fa-trash',
		text: i18n.ts.clearCache,
		action: () => {
			localStorage.removeItem('locale');
			localStorage.removeItem('theme');
			unisonReload();
		},
	}, {
		type: 'button',
		icon: 'fas fa-sign-in-alt fa-flip-horizontal',
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

const pageProps = ref({});
const component = computed(() => {
	if (props.initialPage == null) return null;
	switch (props.initialPage) {
		case 'accounts': return defineAsyncComponent(() => import('./accounts.vue'));
		case 'profile': return defineAsyncComponent(() => import('./profile.vue'));
		case 'privacy': return defineAsyncComponent(() => import('./privacy.vue'));
		case 'reaction': return defineAsyncComponent(() => import('./reaction.vue'));
		case 'drive': return defineAsyncComponent(() => import('./drive.vue'));
		case 'notifications': return defineAsyncComponent(() => import('./notifications.vue'));
		case 'mute-block': return defineAsyncComponent(() => import('./mute-block.vue'));
		case 'word-mute': return defineAsyncComponent(() => import('./word-mute.vue'));
		case 'instance-mute': return defineAsyncComponent(() => import('./instance-mute.vue'));
		case 'integration': return defineAsyncComponent(() => import('./integration.vue'));
		case 'security': return defineAsyncComponent(() => import('./security.vue'));
		case '2fa': return defineAsyncComponent(() => import('./2fa.vue'));
		case 'api': return defineAsyncComponent(() => import('./api.vue'));
		case 'webhook': return defineAsyncComponent(() => import('./webhook.vue'));
		case 'webhook/new': return defineAsyncComponent(() => import('./webhook.new.vue'));
		case 'webhook/edit': return defineAsyncComponent(() => import('./webhook.edit.vue'));
		case 'apps': return defineAsyncComponent(() => import('./apps.vue'));
		case 'other': return defineAsyncComponent(() => import('./other.vue'));
		case 'general': return defineAsyncComponent(() => import('./general.vue'));
		case 'email': return defineAsyncComponent(() => import('./email.vue'));
		case 'theme': return defineAsyncComponent(() => import('./theme.vue'));
		case 'theme/install': return defineAsyncComponent(() => import('./theme.install.vue'));
		case 'theme/manage': return defineAsyncComponent(() => import('./theme.manage.vue'));
		case 'navbar': return defineAsyncComponent(() => import('./navbar.vue'));
		case 'statusbars': return defineAsyncComponent(() => import('./statusbars.vue'));
		case 'sounds': return defineAsyncComponent(() => import('./sounds.vue'));
		case 'custom-css': return defineAsyncComponent(() => import('./custom-css.vue'));
		case 'deck': return defineAsyncComponent(() => import('./deck.vue'));
		case 'plugin': return defineAsyncComponent(() => import('./plugin.vue'));
		case 'plugin/install': return defineAsyncComponent(() => import('./plugin.install.vue'));
		case 'import-export': return defineAsyncComponent(() => import('./import-export.vue'));
		case 'account-info': return defineAsyncComponent(() => import('./account-info.vue'));
		case 'delete-account': return defineAsyncComponent(() => import('./delete-account.vue'));
	}
	return null;
});

watch(component, () => {
	pageProps.value = {};

	nextTick(() => {
		scroll(el.value, { top: 0 });
	});
}, { immediate: true });

watch(() => props.initialPage, () => {
	if (props.initialPage == null && !narrow.value) {
		router.push('/settings/profile');
	} else {
		if (props.initialPage == null) {
			INFO.value = indexInfo;
		}
	}
});

watch(narrow, () => {
	if (props.initialPage == null && !narrow.value) {
		router.push('/settings/profile');
	}
});

onMounted(() => {
	ro.observe(el.value);

	narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;
	if (props.initialPage == null && !narrow.value) {
		router.push('/settings/profile');
	}
});

onUnmounted(() => {
	ro.disconnect();
});

const emailNotConfigured = computed(() => instance.enableEmail && ($i.email == null || !$i.emailVerified));

provideMetadataReceiver((info) => {
	if (info == null) {
		childInfo.value = null;
	} else {
		childInfo.value = info;
	}
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(INFO);
// w 890
// h 700
</script>

<style lang="scss" scoped>
.vvcocwet {
	> .body {
		> .nav {
			.baaadecd {
				> .info {
					margin: 16px 0;
				}

				> .accounts {
					> .avatar {
						display: block;
						width: 50px;
						height: 50px;
						margin: 8px auto 16px auto;
					}
				}
			}
		}

		> .main {
			.bkzroven {
			}
		}
	}

	&.wide {
		> .body {
			display: flex;
			height: 100%;

			> .nav {
				width: 34%;
				padding-right: 32px;
				box-sizing: border-box;
				overflow: auto;
			}

			> .main {
				flex: 1;
				min-width: 0;
				overflow: auto;
			}
		}
	}
}
</style>
