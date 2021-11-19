<template>
<div ref="el" class="vvcocwet" :class="{ wide: !narrow }">
	<div v-if="!narrow || page == null" class="nav">
		<MkSpacer :content-max="700">
			<div class="baaadecd">
				<div class="title">{{ $ts.settings }}</div>
				<MkInfo v-if="emailNotConfigured" warn class="info">{{ $ts.emailNotConfiguredWarning }} <MkA to="/settings/email" class="_link">{{ $ts.configure }}</MkA></MkInfo>
				<MkSuperMenu :def="menuDef" :grid="page == null"></MkSuperMenu>
			</div>
		</MkSpacer>
	</div>
	<div class="main">
		<component :is="component" :key="page" v-bind="pageProps"/>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { i18n } from '@/i18n';
import MkInfo from '@/components/ui/info.vue';
import MkSuperMenu from '@/components/ui/super-menu.vue';
import { scroll } from '@/scripts/scroll';
import { signout } from '@/account';
import { unisonReload } from '@/scripts/unison-reload';
import * as symbols from '@/symbols';
import { instance } from '@/instance';
import { $i } from '@/account';

export default defineComponent({
	components: {
		MkInfo,
		MkSuperMenu,
	},

	props: {
		initialPage: {
			type: String,
			required: false
		}
	},

	setup(props, context) {
		const indexInfo = {
			title: i18n.locale.settings,
			icon: 'fas fa-cog',
			bg: 'var(--bg)',
			hideHeader: true,
		};
		const INFO = ref(indexInfo);
		const page = ref(props.initialPage);
		const narrow = ref(false);
		const view = ref(null);
		const el = ref(null);
		const menuDef = computed(() => [{
			title: i18n.locale.basicSettings,
			items: [{
				icon: 'fas fa-user',
				text: i18n.locale.profile,
				to: '/settings/profile',
				active: page.value === 'profile',
			}, {
				icon: 'fas fa-lock-open',
				text: i18n.locale.privacy,
				to: '/settings/privacy',
				active: page.value === 'privacy',
			}, {
				icon: 'fas fa-laugh',
				text: i18n.locale.reaction,
				to: '/settings/reaction',
				active: page.value === 'reaction',
			}, {
				icon: 'fas fa-cloud',
				text: i18n.locale.drive,
				to: '/settings/drive',
				active: page.value === 'drive',
			}, {
				icon: 'fas fa-bell',
				text: i18n.locale.notifications,
				to: '/settings/notifications',
				active: page.value === 'notifications',
			}, {
				icon: 'fas fa-envelope',
				text: i18n.locale.email,
				to: '/settings/email',
				active: page.value === 'email',
			}, {
				icon: 'fas fa-share-alt',
				text: i18n.locale.integration,
				to: '/settings/integration',
				active: page.value === 'integration',
			}, {
				icon: 'fas fa-lock',
				text: i18n.locale.security,
				to: '/settings/security',
				active: page.value === 'security',
			}],
		}, {
			title: i18n.locale.clientSettings,
			items: [{
				icon: 'fas fa-cogs',
				text: i18n.locale.general,
				to: '/settings/general',
				active: page.value === 'general',
			}, {
				icon: 'fas fa-palette',
				text: i18n.locale.theme,
				to: '/settings/theme',
				active: page.value === 'theme',
			}, {
				icon: 'fas fa-list-ul',
				text: i18n.locale.menu,
				to: '/settings/menu',
				active: page.value === 'menu',
			}, {
				icon: 'fas fa-music',
				text: i18n.locale.sounds,
				to: '/settings/sounds',
				active: page.value === 'sounds',
			}, {
				icon: 'fas fa-plug',
				text: i18n.locale.plugins,
				to: '/settings/plugin',
				active: page.value === 'plugin',
			}],
		}, {
			title: i18n.locale.otherSettings,
			items: [{
				icon: 'fas fa-boxes',
				text: i18n.locale.importAndExport,
				to: '/settings/import-export',
				active: page.value === 'import-export',
			}, {
				icon: 'fas fa-ban',
				text: i18n.locale.muteAndBlock,
				to: '/settings/mute-block',
				active: page.value === 'mute-block',
			}, {
				icon: 'fas fa-comment-slash',
				text: i18n.locale.wordMute,
				to: '/settings/word-mute',
				active: page.value === 'word-mute',
			}, {
				icon: 'fas fa-key',
				text: 'API',
				to: '/settings/api',
				active: page.value === 'api',
			}, {
				icon: 'fas fa-ellipsis-h',
				text: i18n.locale.other,
				to: '/settings/other',
				active: page.value === 'other',
			}],
		}, {
			items: [{
				type: 'button',
				icon: 'fas fa-trash',
				text: i18n.locale.clearCache,
				action: () => {
					localStorage.removeItem('locale');
					localStorage.removeItem('theme');
					unisonReload();
				},
			}, {
				type: 'button',
				icon: 'fas fa-sign-in-alt fa-flip-horizontal',
				text: i18n.locale.logout,
				action: () => {
					signout();
				},
				danger: true,
			},],
		}]);

		const pageProps = ref({});
		const component = computed(() => {
			if (page.value == null) return null;
			switch (page.value) {
				case 'accounts': return defineAsyncComponent(() => import('./accounts.vue'));
				case 'profile': return defineAsyncComponent(() => import('./profile.vue'));
				case 'privacy': return defineAsyncComponent(() => import('./privacy.vue'));
				case 'reaction': return defineAsyncComponent(() => import('./reaction.vue'));
				case 'drive': return defineAsyncComponent(() => import('./drive.vue'));
				case 'notifications': return defineAsyncComponent(() => import('./notifications.vue'));
				case 'mute-block': return defineAsyncComponent(() => import('./mute-block.vue'));
				case 'word-mute': return defineAsyncComponent(() => import('./word-mute.vue'));
				case 'integration': return defineAsyncComponent(() => import('./integration.vue'));
				case 'security': return defineAsyncComponent(() => import('./security.vue'));
				case '2fa': return defineAsyncComponent(() => import('./2fa.vue'));
				case 'api': return defineAsyncComponent(() => import('./api.vue'));
				case 'apps': return defineAsyncComponent(() => import('./apps.vue'));
				case 'other': return defineAsyncComponent(() => import('./other.vue'));
				case 'general': return defineAsyncComponent(() => import('./general.vue'));
				case 'email': return defineAsyncComponent(() => import('./email.vue'));
				case 'email/address': return defineAsyncComponent(() => import('./email-address.vue'));
				case 'email/notification': return defineAsyncComponent(() => import('./email-notification.vue'));
				case 'theme': return defineAsyncComponent(() => import('./theme.vue'));
				case 'theme/install': return defineAsyncComponent(() => import('./theme.install.vue'));
				case 'theme/manage': return defineAsyncComponent(() => import('./theme.manage.vue'));
				case 'menu': return defineAsyncComponent(() => import('./menu.vue'));
				case 'sounds': return defineAsyncComponent(() => import('./sounds.vue'));
				case 'custom-css': return defineAsyncComponent(() => import('./custom-css.vue'));
				case 'deck': return defineAsyncComponent(() => import('./deck.vue'));
				case 'plugin': return defineAsyncComponent(() => import('./plugin.vue'));
				case 'plugin/install': return defineAsyncComponent(() => import('./plugin.install.vue'));
				case 'plugin/manage': return defineAsyncComponent(() => import('./plugin.manage.vue'));
				case 'import-export': return defineAsyncComponent(() => import('./import-export.vue'));
				case 'account-info': return defineAsyncComponent(() => import('./account-info.vue'));
				case 'update': return defineAsyncComponent(() => import('./update.vue'));
				case 'registry': return defineAsyncComponent(() => import('./registry.vue'));
				case 'delete-account': return defineAsyncComponent(() => import('./delete-account.vue'));
				case 'experimental-features': return defineAsyncComponent(() => import('./experimental-features.vue'));
			}
			if (page.value.startsWith('registry/keys/system/')) {
				return defineAsyncComponent(() => import('./registry.keys.vue'));
			}
			if (page.value.startsWith('registry/value/system/')) {
				return defineAsyncComponent(() => import('./registry.value.vue'));
			}
			return null;
		});

		watch(component, () => {
			pageProps.value = {};

			if (page.value) {
				if (page.value.startsWith('registry/keys/system/')) {
					pageProps.value.scope = page.value.replace('registry/keys/system/', '').split('/');
				}
				if (page.value.startsWith('registry/value/system/')) {
					const path = page.value.replace('registry/value/system/', '').split('/');
					pageProps.value.xKey = path.pop();
					pageProps.value.scope = path;
				}
			}

			nextTick(() => {
				scroll(el.value, { top: 0 });
			});
		}, { immediate: true });

		watch(() => props.initialPage, () => {
			if (props.initialPage == null && !narrow.value) {
				page.value = 'profile';
			} else {
				page.value = props.initialPage;
				if (props.initialPage == null) {
					INFO.value = indexInfo;
				}
			}
		});

		onMounted(() => {
			narrow.value = el.value.offsetWidth < 800;
			if (!narrow.value) {
				page.value = 'profile';
			}
		});

		const emailNotConfigured = computed(() => instance.enableEmail && ($i.email == null || !$i.emailVerified));

		return {
			[symbols.PAGE_INFO]: INFO,
			page,
			menuDef,
			narrow,
			view,
			el,
			pageProps,
			component,
			emailNotConfigured,
		};
	},
});
</script>

<style lang="scss" scoped>
.vvcocwet {
	> .nav {
		.baaadecd {
			> .title {
				margin: 16px;
				font-size: 1.5em;
				font-weight: bold;
			}

			> .info {
				margin: 0 16px;
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

	&.wide {
		display: flex;
		max-width: 1000px;
		margin: 0 auto;
		height: 100%;

		> .nav {
			width: 32%;
			box-sizing: border-box;
			overflow: auto;

			.baaadecd {
				> .title {
					margin: 24px 0;
				}
			}
		}

		> .main {
			flex: 1;
			min-width: 0;
			overflow: auto;
		}
	}
}
</style>
