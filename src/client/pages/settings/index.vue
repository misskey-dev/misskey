<template>
<div class="vvcocwet" :class="{ wide: !narrow }" ref="el">
	<div class="nav" v-if="!narrow || page == null">
		<div class="menu">
			<div class="label">{{ $t('basicSettings') }}</div>
			<MkA class="item" :class="{ active: page === 'profile' }" replace to="/settings/profile"><Fa :icon="faUser" fixed-width class="icon"/>{{ $t('profile') }}</MkA>
			<MkA class="item" :class="{ active: page === 'privacy' }" replace to="/settings/privacy"><Fa :icon="faLockOpen" fixed-width class="icon"/>{{ $t('privacy') }}</MkA>
			<MkA class="item" :class="{ active: page === 'reaction' }" replace to="/settings/reaction"><Fa :icon="faLaugh" fixed-width class="icon"/>{{ $t('reaction') }}</MkA>
			<MkA class="item" :class="{ active: page === 'notifications' }" replace to="/settings/notifications"><Fa :icon="faBell" fixed-width class="icon"/>{{ $t('notifications') }}</MkA>
			<MkA class="item" :class="{ active: page === 'integration' }" replace to="/settings/integration"><Fa :icon="faShareAlt" fixed-width class="icon"/>{{ $t('integration') }}</MkA>
			<MkA class="item" :class="{ active: page === 'security' }" replace to="/settings/security"><Fa :icon="faLock" fixed-width class="icon"/>{{ $t('security') }}</MkA>
		</div>
		<div class="menu">
			<div class="label">{{ $t('clientSettings') }}</div>
			<MkA class="item" :class="{ active: page === 'general' }" replace to="/settings/general"><Fa :icon="faCogs" fixed-width class="icon"/>{{ $t('general') }}</MkA>
			<MkA class="item" :class="{ active: page === 'theme' }" replace to="/settings/theme"><Fa :icon="faPalette" fixed-width class="icon"/>{{ $t('theme') }}</MkA>
			<MkA class="item" :class="{ active: page === 'sidebar' }" replace to="/settings/sidebar"><Fa :icon="faListUl" fixed-width class="icon"/>{{ $t('sidebar') }}</MkA>
			<MkA class="item" :class="{ active: page === 'sounds' }" replace to="/settings/sounds"><Fa :icon="faMusic" fixed-width class="icon"/>{{ $t('sounds') }}</MkA>
			<MkA class="item" :class="{ active: page === 'plugins' }" replace to="/settings/plugins"><Fa :icon="faPlug" fixed-width class="icon"/>{{ $t('plugins') }}</MkA>
		</div>
		<div class="menu">
			<div class="label">{{ $t('otherSettings') }}</div>
			<MkA class="item" :class="{ active: page === 'import-export' }" replace to="/settings/import-export"><Fa :icon="faBoxes" fixed-width class="icon"/>{{ $t('importAndExport') }}</MkA>
			<MkA class="item" :class="{ active: page === 'mute-block' }" replace to="/settings/mute-block"><Fa :icon="faBan" fixed-width class="icon"/>{{ $t('muteAndBlock') }}</MkA>
			<MkA class="item" :class="{ active: page === 'word-mute' }" replace to="/settings/word-mute"><Fa :icon="faCommentSlash" fixed-width class="icon"/>{{ $t('wordMute') }}</MkA>
			<MkA class="item" :class="{ active: page === 'api' }" replace to="/settings/api"><Fa :icon="faKey" fixed-width class="icon"/>API</MkA>
			<MkA class="item" :class="{ active: page === 'other' }" replace to="/settings/other"><Fa :icon="faEllipsisH" fixed-width class="icon"/>{{ $t('other') }}</MkA>
		</div>
		<div class="menu">
			<button class="_button item" @click="logout">{{ $t('logout') }}</button>
		</div>
	</div>
	<div class="main">
		<transition :name="($store.state.device.animation && !narrow) ? 'view-slide' : ''" appear mode="out-in">
			<component :is="component" @info="onInfo"/>
		</transition>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent, onMounted, ref } from 'vue';
import { faCog, faPalette, faPlug, faUser, faListUl, faLock, faCommentSlash, faMusic, faCogs, faEllipsisH, faBan, faShareAlt, faLockOpen, faKey, faBoxes } from '@fortawesome/free-solid-svg-icons';
import { faLaugh, faBell } from '@fortawesome/free-regular-svg-icons';
import { store } from '@/store';
import { i18n } from '@/i18n';

export default defineComponent({
	props: {
		page: {
			type: String,
			required: false
		}
	},

	setup(props, context) {
		const INFO = ref({
			header: [{
				title: i18n.global.t('settings'),
				icon: faCog
			}]
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
			narrow.value = el.value.offsetWidth < 650;
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
.view-slide-enter-active, .view-slide-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.view-slide-enter-from, .view-slide-leave-to {
	opacity: 0;
	transform: translateX(32px);
}

.vvcocwet {
	> .nav {
		> .menu {
			margin: 16px 0;

			> .label {
				padding: 8px 32px;
				font-size: 80%;
				opacity: 0.7;
			}

			> .item {
				display: block;
				width: 100%;
				box-sizing: border-box;
				padding: 0 32px;
				line-height: 48px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				//background: var(--panel);
				//border-bottom: solid 1px var(--divider);
				transition: padding 0.2s ease, color 0.1s ease;

				&:first-of-type {
					//border-top: solid 1px var(--divider);
				}

				&.active {
					color: var(--accent);
					padding-left: 42px;
				}

				&:hover {
					text-decoration: none;
					padding-left: 42px;
				}

				> .icon {
					margin-right: 0.5em;
				}
			}
		}
	}

	&.wide {
		display: flex;

		> .nav {
			width: 30%;
			max-width: 300px;
		}

		> .main {
			flex: 1;
		}
	}
}
</style>
