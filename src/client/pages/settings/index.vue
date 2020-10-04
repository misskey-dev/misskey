<template>
<div class="vvcocwet" :class="{ wide: !narrow }" ref="el">
	<div class="nav" v-if="!narrow || $route.name === 'settings'">
		<div class="menu account">
			<div class="label">{{ $t('accountSettings') }}</div>
			<router-link class="item" replace to="/settings/account/profile"><Fa :icon="faUser" fixed-width class="icon"/>{{ $t('profile') }}</router-link>
			<router-link class="item" replace to="/settings/account/privacy"><Fa :icon="faLock" fixed-width class="icon"/>{{ $t('privacy') }}</router-link>
			<router-link class="item" replace to="/settings/account/reaction"><Fa :icon="faLaugh" fixed-width class="icon"/>{{ $t('reaction') }}</router-link>
			<router-link class="item" replace to="/settings/account/notifications"><Fa :icon="faBell" fixed-width class="icon"/>{{ $t('notifications') }}</router-link>
			<router-link class="item" replace to="/settings/account/word-mute"><Fa :icon="faCommentSlash" fixed-width class="icon"/>{{ $t('wordMute') }}</router-link>
			<router-link class="item" replace to="/settings/account/other"><Fa :icon="faEllipsisH" fixed-width class="icon"/>{{ $t('other') }}</router-link>
		</div>
		<div class="menu client">
			<div class="label">{{ $t('clientSettings') }}</div>
			<router-link class="item" replace to="/settings/client/general"><Fa :icon="faCogs" fixed-width class="icon"/>{{ $t('general') }}</router-link>
			<router-link class="item" replace to="/settings/client/theme"><Fa :icon="faPalette" fixed-width class="icon"/>{{ $t('theme') }}</router-link>
			<router-link class="item" replace to="/settings/client/sidebar"><Fa :icon="faListUl" fixed-width class="icon"/>{{ $t('sidebar') }}</router-link>
			<router-link class="item" replace to="/settings/client/sounds"><Fa :icon="faMusic" fixed-width class="icon"/>{{ $t('sounds') }}</router-link>
			<router-link class="item" replace to="/settings/client/plugins"><Fa :icon="faPlug" fixed-width class="icon"/>{{ $t('plugins') }}</router-link>
		</div>
		<div class="menu other">
			<button class="_button item" @click="logout">{{ $t('logout') }}</button>
		</div>
	</div>
	<div class="main">
		<router-view v-slot="{ Component }">
			<transition :name="($store.state.device.animation && !narrow) ? 'view-slide' : ''" appear mode="out-in">
				<component :is="Component" @info="onInfo"/>
			</transition>
		</router-view>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { faCog, faPalette, faPlug, faUser, faListUl, faLock, faCommentSlash, faMusic, faCogs, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { faLaugh, faBell } from '@fortawesome/free-regular-svg-icons';
import * as os from '@/os';

export default defineComponent({
	setup(props, context) {
		const info = ref({
			header: [{
				title: ('settings'),
				icon: faCog
			}]
		});
		const narrow = ref(false);
		const view = ref(null);
		const el = ref(null);
		const onInfo = (viewInfo) => {
			info.value = viewInfo;
		};

		onMounted(() => {
			narrow.value = el.value.offsetWidth < 650;
		});

		return {
			info,
			narrow,
			view,
			el,
			onInfo,
			faPalette, faPlug, faUser, faListUl, faLock, faLaugh, faCommentSlash, faMusic, faBell, faCogs, faEllipsisH,
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
	max-width: 1000px;
	margin: 0 auto;

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

				&.router-link-active {
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
			max-width: 260px;
		}

		> .main {
			flex: 1;
		}
	}
}
</style>
