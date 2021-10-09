<template>
<div class="vvcocwet" :class="{ wide: !narrow }" ref="el">
	<div class="nav" v-if="!narrow || page == null">
		<div class="group accounts">
			<MkAvatar :user="$i" class="avatar"/>
			<XLink :active="page === 'accounts'" replace to="/settings/accounts"><template #icon><i class="fas fa-users"></i></template>{{ $ts.accounts }}</XLink>
		</div>
		<MkInfo v-if="emailNotConfigured" warn class="info">{{ $ts.emailNotConfiguredWarning }} <MkA to="/settings/email" class="_link">{{ $ts.configure }}</MkA></MkInfo>
		<div class="group">
			<div class="label">{{ $ts.basicSettings }}</div>
			<XLink :active="page === 'profile'" replace to="/settings/profile"><template #icon><i class="fas fa-user"></i></template>{{ $ts.profile }}</XLink>
			<XLink :active="page === 'privacy'" replace to="/settings/privacy"><template #icon><i class="fas fa-lock-open"></i></template>{{ $ts.privacy }}</XLink>
			<XLink :active="page === 'reaction'" replace to="/settings/reaction"><template #icon><i class="fas fa-laugh"></i></template>{{ $ts.reaction }}</XLink>
			<XLink :active="page === 'drive'" replace to="/settings/drive"><template #icon><i class="fas fa-cloud"></i></template>{{ $ts.drive }}</XLink>
			<XLink :active="page === 'notifications'" replace to="/settings/notifications"><template #icon><i class="fas fa-bell"></i></template>{{ $ts.notifications }}</XLink>
			<XLink :active="page === 'email'" replace to="/settings/email"><template #icon><i class="fas fa-envelope"></i></template>{{ $ts.email }}</XLink>
			<XLink :active="page === 'integration'" replace to="/settings/integration"><template #icon><i class="fas fa-share-alt"></i></template>{{ $ts.integration }}</XLink>
			<XLink :active="page === 'security'" replace to="/settings/security"><template #icon><i class="fas fa-lock"></i></template>{{ $ts.security }}</XLink>
		</div>
		<div class="group">
			<div class="label">{{ $ts.clientSettings }}</div>
			<XLink :active="page === 'general'" replace to="/settings/general"><template #icon><i class="fas fa-cogs"></i></template>{{ $ts.general }}</XLink>
			<XLink :active="page === 'theme'" replace to="/settings/theme"><template #icon><i class="fas fa-palette"></i></template>{{ $ts.theme }}</XLink>
			<XLink :active="page === 'menu'" replace to="/settings/menu"><template #icon><i class="fas fa-list-ul"></i></template>{{ $ts.menu }}</XLink>
			<XLink :active="page === 'sounds'" replace to="/settings/sounds"><template #icon><i class="fas fa-music"></i></template>{{ $ts.sounds }}</XLink>
			<XLink :active="page === 'plugin'" replace to="/settings/plugin"><template #icon><i class="fas fa-plug"></i></template>{{ $ts.plugins }}</XLink>
		</div>
		<div class="group">
			<div class="label">{{ $ts.otherSettings }}</div>
			<XLink :active="page === 'import-export'" replace to="/settings/import-export"><template #icon><i class="fas fa-boxes"></i></template>{{ $ts.importAndExport }}</XLink>
			<XLink :active="page === 'mute-block'" replace to="/settings/mute-block"><template #icon><i class="fas fa-ban"></i></template>{{ $ts.muteAndBlock }}</XLink>
			<XLink :active="page === 'word-mute'" replace to="/settings/word-mute"><template #icon><i class="fas fa-comment-slash"></i></template>{{ $ts.wordMute }}</XLink>
			<XLink :active="page === 'api'" replace to="/settings/api"><template #icon><i class="fas fa-key"></i></template>API</XLink>
			<XLink :active="page === 'other'" replace to="/settings/other"><template #icon><i class="fas fa-ellipsis-h"></i></template>{{ $ts.other }}</XLink>
		</div>
		<div class="group">
			<XLink @click="clear"><template #icon><i class="fas fa-trash"></i></template>{{ $ts.clearCache }}</XLink>
			<XLink @click="logout" danger><template #icon><i class="fas fa-sign-in-alt fa-flip-horizontal"></i></template>{{ $ts.logout }}</XLink>
		</div>
	</div>
	<div class="main">
		<component :is="component" :key="page" v-bind="pageProps"/>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { i18n } from '@client/i18n';
import XLink from './index.link.vue';
import MkInfo from '@client/components/ui/info.vue';
import { scroll } from '@client/scripts/scroll';
import { signout } from '@client/account';
import { unisonReload } from '@client/scripts/unison-reload';
import * as symbols from '@client/symbols';
import { instance } from '@client/instance';
import { $i } from '@client/account';

export default defineComponent({
	components: {
		XLink,
		MkInfo,
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
		};
		const INFO = ref(indexInfo);
		const page = ref(props.initialPage);
		const narrow = ref(false);
		const view = ref(null);
		const el = ref(null);

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
			narrow,
			view,
			el,
			pageProps,
			component,
			emailNotConfigured,
			logout: () => {
				signout();
			},
			clear: () => {
				localStorage.removeItem('locale');
				localStorage.removeItem('theme');
				unisonReload();
			},
		};
	},
});
</script>

<style lang="scss" scoped>
.vvcocwet {
	> .nav {
		> .group {
			padding: 16px;

			> .label {
				font-size: 0.9em;
				opacity: 0.7;
				margin: 0 0 8px 12px;
			}
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

	&.wide {
		display: flex;
		max-width: 1000px;
		margin: 0 auto;
		height: 100%;

		> .nav {
			width: 32%;
			box-sizing: border-box;
			overflow: auto;
		}

		> .main {
			flex: 1;
			min-width: 0;
			overflow: auto;
			--baseContentWidth: 100%;
		}
	}
}
</style>
