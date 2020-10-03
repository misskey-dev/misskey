<template>
<div class="vvcocwet" :class="{ wide: !narrow }">
	<div class="nav" v-if="!narrow || $route.name === 'settings'">
		<div class="menu account">
			<div class="label">{{ $t('accountSettings') }}</div>
			<router-link class="item" to="/settings/account/profile"><Fa :icon="faUser" fixed-width class="icon"/>{{ $t('profile') }}</router-link>
			<router-link class="item" to="/settings/account/privacy"><Fa :icon="faLock" fixed-width class="icon"/>{{ $t('privacy') }}</router-link>
			<router-link class="item" to="/settings/account/reaction"><Fa :icon="faLaugh" fixed-width class="icon"/>{{ $t('reaction') }}</router-link>
			<router-link class="item" to="/settings/account/word-mute"><Fa :icon="faCommentSlash" fixed-width class="icon"/>{{ $t('wordMute') }}</router-link>
		</div>
		<div class="menu client">
			<div class="label">{{ $t('clientSettings') }}</div>
			<router-link class="item" to="/settings/client/theme"><Fa :icon="faPalette" fixed-width class="icon"/>{{ $t('theme') }}</router-link>
			<router-link class="item" to="/settings/client/sidebar"><Fa :icon="faListUl" fixed-width class="icon"/>{{ $t('sidebar') }}</router-link>
			<router-link class="item" to="/settings/client/plugins"><Fa :icon="faPlug" fixed-width class="icon"/>{{ $t('plugins') }}</router-link>
		</div>
		<div class="menu other">
			<button class="_button item" @click="logout">{{ $t('logout') }}</button>
		</div>
	</div>
	<div class="main">
		<router-view></router-view>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCog, faPalette, faPlug, faUser, faListUl, faLock, faCommentSlash } from '@fortawesome/free-solid-svg-icons';
import { faLaugh } from '@fortawesome/free-regular-svg-icons';
import * as os from '@/os';

export default defineComponent({
	data() {
		return {
			info: {
				header: [{
					title: this.$t('settings'),
					icon: faCog
				}]
			},
			narrow: false,
			faPalette, faPlug, faUser, faListUl, faLock, faLaugh, faCommentSlash,
		};
	},

	mounted() {
		this.narrow = this.$el.offsetWidth < 650;
	}
});
</script>

<style lang="scss" scoped>
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

				&:first-of-type {
					//border-top: solid 1px var(--divider);
				}

				&.router-link-active {
					color: var(--accent);
				}

				&:hover {
					text-decoration: none;
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
