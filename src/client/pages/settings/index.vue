<template>
<div class="vvcocwet" :class="{ wide: !narrow }" ref="el">
	<FormBase class="nav" v-if="!narrow || page == null">
		<FormGroup>
			<template #label>{{ $t('basicSettings') }}</template>
			<FormLink :active="page === 'profile'" replace to="/settings/profile"><template #icon><Fa :icon="faUser"/></template>{{ $t('profile') }}</FormLink>
			<FormLink :active="page === 'privacy'" replace to="/settings/privacy"><template #icon><Fa :icon="faLockOpen"/></template>{{ $t('privacy') }}</FormLink>
			<FormLink :active="page === 'reaction'" replace to="/settings/reaction"><template #icon><Fa :icon="faLaugh"/></template>{{ $t('reaction') }}</FormLink>
			<FormLink :active="page === 'notifications'" replace to="/settings/notifications"><template #icon><Fa :icon="faBell"/></template>{{ $t('notifications') }}</FormLink>
			<FormLink :active="page === 'integration'" replace to="/settings/integration"><template #icon><Fa :icon="faShareAlt"/></template>{{ $t('integration') }}</FormLink>
			<FormLink :active="page === 'security'" replace to="/settings/security"><template #icon><Fa :icon="faLock"/></template>{{ $t('security') }}</FormLink>
		</FormGroup>
		<FormGroup>
			<template #label>{{ $t('clientSettings') }}</template>
			<FormLink :active="page === 'general'" replace to="/settings/general"><template #icon><Fa :icon="faCogs"/></template>{{ $t('general') }}</FormLink>
			<FormLink :active="page === 'theme'" replace to="/settings/theme"><template #icon><Fa :icon="faPalette"/></template>{{ $t('theme') }}</FormLink>
			<FormLink :active="page === 'sidebar'" replace to="/settings/sidebar"><template #icon><Fa :icon="faListUl"/></template>{{ $t('sidebar') }}</FormLink>
			<FormLink :active="page === 'sounds'" replace to="/settings/sounds"><template #icon><Fa :icon="faMusic"/></template>{{ $t('sounds') }}</FormLink>
			<FormLink :active="page === 'plugins'" replace to="/settings/plugins"><template #icon><Fa :icon="faPlug"/></template>{{ $t('plugins') }}</FormLink>
		</FormGroup>
		<FormGroup>
			<template #label>{{ $t('otherSettings') }}</template>
			<FormLink :active="page === 'import-export'" replace to="/settings/import-export"><template #icon><Fa :icon="faBoxes"/></template>{{ $t('importAndExport') }}</FormLink>
			<FormLink :active="page === 'mute-block'" replace to="/settings/mute-block"><template #icon><Fa :icon="faBan"/></template>{{ $t('muteAndBlock') }}</FormLink>
			<FormLink :active="page === 'word-mute'" replace to="/settings/word-mute"><template #icon><Fa :icon="faCommentSlash"/></template>{{ $t('wordMute') }}</FormLink>
			<FormLink :active="page === 'api'" replace to="/settings/api"><template #icon><Fa :icon="faKey"/></template>API</FormLink>
			<FormLink :active="page === 'other'" replace to="/settings/other"><template #icon><Fa :icon="faEllipsisH"/></template>{{ $t('other') }}</FormLink>
		</FormGroup>
		<FormGroup>
			<FormButton @click="logout" danger>{{ $t('logout') }}</FormButton>
		</FormGroup>
	</FormBase>
	<div class="main">
		<component :is="component" @info="onInfo"/>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent, onMounted, ref } from 'vue';
import { faCog, faPalette, faPlug, faUser, faListUl, faLock, faCommentSlash, faMusic, faCogs, faEllipsisH, faBan, faShareAlt, faLockOpen, faKey, faBoxes } from '@fortawesome/free-solid-svg-icons';
import { faLaugh, faBell } from '@fortawesome/free-regular-svg-icons';
import { store } from '@/store';
import { i18n } from '@/i18n';
import FormLink from '@/components/form/link.vue';
import FormGroup from '@/components/form/group.vue';
import FormBase from '@/components/form/base.vue';
import FormButton from '@/components/form/button.vue';

export default defineComponent({
	components: {
		FormBase,
		FormLink,
		FormGroup,
		FormButton,
	},

	props: {
		page: {
			type: String,
			required: false
		}
	},

	setup(props, context) {
		const INFO = ref({
			title: i18n.global.t('settings'),
			icon: faCog
		});
		const narrow = ref(false);
		const view = ref(null);
		const el = ref(null);
		const onInfo = (viewInfo) => {
			INFO.value = viewInfo;
		};
		const component = computed(() => {
			switch (props.page) {
				case 'profile': return defineAsyncComponent(() => import('./profile.vue'));
				case 'privacy': return defineAsyncComponent(() => import('./privacy.vue'));
				case 'reaction': return defineAsyncComponent(() => import('./reaction.vue'));
				case 'notifications': return defineAsyncComponent(() => import('./notifications.vue'));
				case 'mute-block': return defineAsyncComponent(() => import('./mute-block.vue'));
				case 'word-mute': return defineAsyncComponent(() => import('./word-mute.vue'));
				case 'integration': return defineAsyncComponent(() => import('./integration.vue'));
				case 'security': return defineAsyncComponent(() => import('./security.vue'));
				case 'api': return defineAsyncComponent(() => import('./api.vue'));
				case 'other': return defineAsyncComponent(() => import('./other.vue'));
				case 'general': return defineAsyncComponent(() => import('./general.vue'));
				case 'theme': return defineAsyncComponent(() => import('./theme.vue'));
				case 'sidebar': return defineAsyncComponent(() => import('./sidebar.vue'));
				case 'sounds': return defineAsyncComponent(() => import('./sounds.vue'));
				case 'plugins': return defineAsyncComponent(() => import('./plugins.vue'));
				case 'import-export': return defineAsyncComponent(() => import('./import-export.vue'));
				case 'regedit': return defineAsyncComponent(() => import('./regedit.vue'));
				default: return null;
			}
		});

		onMounted(() => {
			narrow.value = el.value.offsetWidth < 1025;
		});

		return {
			INFO,
			narrow,
			view,
			el,
			onInfo,
			component,
			logout: () => {
				store.dispatch('logout');
				location.href = '/';
			},
			faPalette, faPlug, faUser, faListUl, faLock, faLaugh, faCommentSlash, faMusic, faBell, faCogs, faEllipsisH, faBan, faShareAlt, faLockOpen, faKey, faBoxes,
		};
	},
});
</script>

<style lang="scss" scoped>
.vvcocwet {
	&.wide {
		display: flex;

		> .nav {
			width: 30%;
			max-width: 300px;
			border-right: solid 1px var(--divider);
		}

		> .main {
			flex: 1;
			--baseContentWidth: 100%;

			::v-deep(._section) {
				padding: 0 0 32px 0;

				& + ._section {
					padding-top: 32px;
				}
			}
		}
	}
}
</style>
