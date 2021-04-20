<template>
<div class="vvcocwet" :class="{ wide: !narrow }" ref="el">
	<div class="nav" v-if="!narrow || page == null">
		<FormBase>
			<FormGroup>
				<template #label>{{ $ts.basicSettings }}</template>
				<FormLink :active="page === 'profile'" replace to="/settings/profile"><template #icon><i class="fas fa-user"></i></template>{{ $ts.profile }}</FormLink>
				<FormLink :active="page === 'privacy'" replace to="/settings/privacy"><template #icon><i class="fas fa-lock-open"></i></template>{{ $ts.privacy }}</FormLink>
				<FormLink :active="page === 'reaction'" replace to="/settings/reaction"><template #icon><i class="fas fa-laugh"></i></template>{{ $ts.reaction }}</FormLink>
				<FormLink :active="page === 'drive'" replace to="/settings/drive"><template #icon><i class="fas fa-cloud"></i></template>{{ $ts.drive }}</FormLink>
				<FormLink :active="page === 'notifications'" replace to="/settings/notifications"><template #icon><i class="fas fa-bell"></i></template>{{ $ts.notifications }}</FormLink>
				<FormLink :active="page === 'email'" replace to="/settings/email"><template #icon><i class="fas fa-envelope"></i></template>{{ $ts.email }}</FormLink>
				<FormLink :active="page === 'integration'" replace to="/settings/integration"><template #icon><i class="fas fa-share-alt"></i></template>{{ $ts.integration }}</FormLink>
				<FormLink :active="page === 'security'" replace to="/settings/security"><template #icon><i class="fas fa-lock"></i></template>{{ $ts.security }}</FormLink>
			</FormGroup>
			<FormGroup>
				<template #label>{{ $ts.clientSettings }}</template>
				<FormLink :active="page === 'general'" replace to="/settings/general"><template #icon><i class="fas fa-cogs"></i></template>{{ $ts.general }}</FormLink>
				<FormLink :active="page === 'theme'" replace to="/settings/theme"><template #icon><i class="fas fa-palette"></i></template>{{ $ts.theme }}</FormLink>
				<FormLink :active="page === 'sidebar'" replace to="/settings/sidebar"><template #icon><i class="fas fa-list-ul"></i></template>{{ $ts.sidebar }}</FormLink>
				<FormLink :active="page === 'sounds'" replace to="/settings/sounds"><template #icon><i class="fas fa-music"></i></template>{{ $ts.sounds }}</FormLink>
				<FormLink :active="page === 'plugin'" replace to="/settings/plugin"><template #icon><i class="fas fa-plug"></i></template>{{ $ts.plugins }}</FormLink>
			</FormGroup>
			<FormGroup>
				<template #label>{{ $ts.otherSettings }}</template>
				<FormLink :active="page === 'import-export'" replace to="/settings/import-export"><template #icon><i class="fas fa-boxes"></i></template>{{ $ts.importAndExport }}</FormLink>
				<FormLink :active="page === 'mute-block'" replace to="/settings/mute-block"><template #icon><i class="fas fa-ban"></i></template>{{ $ts.muteAndBlock }}</FormLink>
				<FormLink :active="page === 'word-mute'" replace to="/settings/word-mute"><template #icon><i class="fas fa-comment-slash"></i></template>{{ $ts.wordMute }}</FormLink>
				<FormLink :active="page === 'api'" replace to="/settings/api"><template #icon><i class="fas fa-key"></i></template>API</FormLink>
				<FormLink :active="page === 'other'" replace to="/settings/other"><template #icon><i class="fas fa-ellipsis-h"></i></template>{{ $ts.other }}</FormLink>
			</FormGroup>
			<FormGroup>
				<FormButton @click="clear">{{ $ts.clearCache }}</FormButton>
			</FormGroup>
			<FormGroup>
				<FormButton @click="logout" danger>{{ $ts.logout }}</FormButton>
			</FormGroup>
		</FormBase>
	</div>
	<div class="main">
		<component :is="component" :key="page" @info="onInfo" v-bind="pageProps"/>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { faCog, faPalette, faPlug, faUser, faListUl, faLock, faCommentSlash, faMusic, faCogs, faEllipsisH, faBan, faShareAlt, faLockOpen, faKey, faBoxes, faCloud } from '@fortawesome/free-solid-svg-icons';
import { faLaugh, faBell, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { i18n } from '@client/i18n';
import FormLink from '@client/components/form/link.vue';
import FormGroup from '@client/components/form/group.vue';
import FormBase from '@client/components/form/base.vue';
import FormButton from '@client/components/form/button.vue';
import { scroll } from '@client/scripts/scroll';
import { signout } from '@client/account';
import { unisonReload } from '@client/scripts/unison-reload';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormLink,
		FormGroup,
		FormButton,
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
			icon: 'fas fa-cog'
		};
		const INFO = ref(indexInfo);
		const page = ref(props.initialPage);
		const narrow = ref(false);
		const view = ref(null);
		const el = ref(null);
		const onInfo = (viewInfo) => {
			INFO.value = viewInfo;
		};
		const pageProps = ref({});
		const component = computed(() => {
			if (page.value == null) return null;
			switch (page.value) {
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
				case 'sidebar': return defineAsyncComponent(() => import('./sidebar.vue'));
				case 'sounds': return defineAsyncComponent(() => import('./sounds.vue'));
				case 'deck': return defineAsyncComponent(() => import('./deck.vue'));
				case 'plugin': return defineAsyncComponent(() => import('./plugin.vue'));
				case 'plugin/install': return defineAsyncComponent(() => import('./plugin.install.vue'));
				case 'plugin/manage': return defineAsyncComponent(() => import('./plugin.manage.vue'));
				case 'import-export': return defineAsyncComponent(() => import('./import-export.vue'));
				case 'account-info': return defineAsyncComponent(() => import('./account-info.vue'));
				case 'update': return defineAsyncComponent(() => import('./update.vue'));
				case 'registry': return defineAsyncComponent(() => import('./registry.vue'));
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
				scroll(el.value, 0);
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

		return {
			[symbols.PAGE_INFO]: INFO,
			page,
			narrow,
			view,
			el,
			onInfo,
			pageProps,
			component,
			logout: () => {
				signout();
			},
			clear: () => {
				localStorage.removeItem('locale');
				localStorage.removeItem('theme');
				unisonReload();
			},
			faPalette, faPlug, faUser, faListUl, faLock, faLaugh, faCommentSlash, faMusic, faBell, faCogs, faEllipsisH, faBan, faShareAlt, faLockOpen, faKey, faBoxes, faEnvelope, faCloud,
		};
	},
});
</script>

<style lang="scss" scoped>
.vvcocwet {
	&.wide {
		display: flex;
		max-width: 1100px;
		margin: 0 auto;
		height: 100%;

		> .nav {
			width: 32%;
			box-sizing: border-box;
			border-right: solid 0.5px var(--divider);
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
