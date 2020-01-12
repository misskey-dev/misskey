<template>
<div class="mk-app">
	<div class="header-bg"></div>
	<nav v-if="true" ref="nav">
		<div class="menu">
			<button class="item _button account" @click="showAccounts = true">
				<mk-avatar :user="$store.state.i" class="avatar"/>
				<span class="text"><mk-acct :user="$store.state.i"/></span>
			</button>
			<router-link class="item" to="/" exact>
				<fa :icon="faHome" fixed-width/><span class="text">{{ $t('timeline') }}</span>
			</router-link>
			<button class="item _button" @click="search()">
				<fa :icon="faSearch" fixed-width/><span class="text">{{ $t('search') }}</span>
			</button>
			<button class="item _button" @click="showLists = true">
				<fa :icon="faListUl" fixed-width/><span class="text">{{ $t('lists') }}</span>
			</button>
			<router-link class="item" to="/messages">
				<fa :icon="faEnvelope" fixed-width/><span class="text">{{ $t('messages') }}</span>
			<i v-if="$store.state.i.hasUnreadSpecifiedNotes"><fa :icon="faCircle"/></i></router-link>
			<router-link class="item" to="/favorites">
				<fa :icon="faStar" fixed-width/><span class="text">{{ $t('favorites') }}</span>
			</router-link>
			<router-link class="item" to="/follow-requests" v-if="$store.state.i.isLocked">
				<fa :icon="faUserClock" fixed-width/><span class="text">{{ $t('followRequests') }}</span>
			<i v-if="$store.state.i.pendingReceivedFollowRequestsCount"><fa :icon="faCircle"/></i></router-link>
			<button class="item _button" v-if="$store.state.i.isAdmin" @click="showInstance = true">
				<fa :icon="faCog" fixed-width/><span class="text">{{ $t('instance') }}</span>
			</button>
		</div>
	</nav>
	<main>
		<header class="header">
			<transition name="header" mode="out-in" appear>
				<div class="body" :key="pageKey">
					<portal-target name="avatar" slim/>
					<h1 class="title"><portal-target name="icon" slim/><portal-target name="title" slim/></h1>
					<portal-target name="header" slim/>
				</div>
			</transition>
		</header>
		<div class="content">
			<transition name="page" mode="out-in">
				<router-view></router-view>
			</transition>
		</div>
		<div class="powerd-by" :class="{ visible: !$store.getters.isSignedIn }">
			<b><router-link to="/">{{ host }}</router-link></b>
			<small>Powered by <a href="https://github.com/syuilo/misskey" target="_blank">Misskey</a></small>
		</div>
	</main>
	<div class="side">
		<div class="search-and-post">
			<fa :icon="faSearch"/>
			<input type="search" class="search"/>
			<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>
		</div>
		<div class="widgets">
			<div class="widget">aaa</div>
		</div>
	</div>
	<div class="buttons">
		<button v-if="$store.getters.isSignedIn" class="button nav _button" @click="() => { navOpen = !navOpen; notificationsOpen = false; }" ref="navButton"><fa :icon="navOpen ? faTimes : faBars"/><i v-if="$store.state.i.hasUnreadSpecifiedNotes || $store.state.i.pendingReceivedFollowRequestsCount"><fa :icon="faCircle"/></i></button>
		<button v-if="$store.getters.isSignedIn" class="button home _button" :disabled="$route.path === '/'" @click="$router.push('/')"><fa :icon="faHome"/></button>
		<button v-if="$store.getters.isSignedIn" class="button notifications _button" @click="notificationsOpen = !notificationsOpen" ref="notificationsButton"><fa :icon="notificationsOpen ? faTimes : faBell"/><i v-if="$store.state.i.hasUnreadNotification"><fa :icon="faCircle"/></i></button>
		<button v-if="$store.getters.isSignedIn" class="button post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh } from '@fortawesome/free-regular-svg-icons';
import i18n from './i18n';
import { host } from './config';
import { search } from './scripts/search';

export default Vue.extend({
	i18n,

	components: {
		XNotifications: () => import('./components/notifications.vue').then(m => m.default),
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			faPencilAlt, faBars, faTimes, faBell, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faEnvelope, faListUl, faPlus, faUserClock, faLaugh, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud
		};
	},

	watch:{
		$route(to, from) {
			this.pageKey++;
		}
	},

	methods: {
		post() {
			this.$root.post();
		},

		search() {
			this.navOpen = false;
			if (this.searching) return;

			this.$root.dialog({
				title: this.$t('search'),
				input: true
			}).then(async ({ canceled, result: query }) => {
				if (canceled || query == null || query == '') return;

				this.searching = true;
				search(this, query).finally(() => {
					this.searching = false;
				});
			});
		},

		async addAcount() {
			this.navOpen = false;

			const { canceled: canceled1, result: username } = await this.$root.dialog({
				title: this.$t('username'),
				input: true
			});
			if (canceled1) return;

			const { canceled: canceled2, result: password } = await this.$root.dialog({
				title: this.$t('password'),
				input: { type: 'password' }
			});
			if (canceled2) return;

			this.$root.api('signin', {
				username: username,
				password: password,
			}).then(res => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
				this.$store.commit('device/set', {
					key: 'accounts',
					value: this.$store.state.device.accounts.concat([{ id: res.id, token: res.token }])
				});
			}).catch(() => {
				this.$root.dialog({
					type: 'error',
					text: this.$t('loginFailed')
				});
			});
		},

		async switchAccount(account) {
			this.navOpen = false;
			const token = this.$store.state.device.accounts.find(x => x.id === account.id).token;
			this.$root.api('i', {}, token).then(i => {
				this.$store.dispatch('switchAccount', {
					...i,
					token: token
				});
				location.reload();
			});
		},

		async createList() {
			this.navOpen = false;
			const { canceled, result: name } = await this.$root.dialog({
				title: this.$t('enterListName'),
				input: true
			});
			if (canceled) return;
			await this.$root.api('users/lists/create', { name: name });
			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
		},

		onNotification(notification) {
			// TODO: ユーザーが画面を見てないと思われるとき(ブラウザやタブがアクティブじゃないなど)は送信しない
			this.$root.stream.send('readNotification', {
				id: notification.id
			});

			this.$root.new(MkToast, {
				notification
			});
		},
	}
});
</script>

<style lang="scss" scoped>
@import './theme';

.header-enter-active, .header-leave-active {
	transition: opacity 0.5s, transform 0.5s !important;
}
.header-enter {
	opacity: 0;
	transform: scale(0.9);
}
.header-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.page-enter-active, .page-leave-active {
	transition: opacity 0.5s, transform 0.5s !important;
}
.page-enter {
	opacity: 0;
	transform: translateY(-32px);
}
.page-leave-to {
	opacity: 0;
	transform: translateY(32px);
}

.mk-app {
	$max-width: 1300px;
	$header-height: 60px;
	$nav-width: 320px;
	$side-width: 320px;
	$ui-font-size: 1em;
	$nav-icon-only-threshold: 1200px;
	$nav-hide-threshold: 700px;

	display: flex;
	max-width: $max-width;
	margin: 0 auto;

	> .header-bg {
		position: fixed;
		z-index: 1000;
		top: 0;
		left: 0;
		height: $header-height;
		width: 100%;
		//background-color: var(--bg);
		-webkit-backdrop-filter: blur(32px);
		backdrop-filter: blur(32px);
		background-color: rgba(255, 255, 255, 0.75);

		@media (prefers-color-scheme: dark) {
			background-color: rgba(20, 20, 20, 0.75);
		}
	}

	> nav {
		flex: 1;
		z-index: 1001;
		width: 100%;
		max-width: $nav-width;
		padding: 0 0 0 32px;
		box-sizing: border-box;

		@media (max-width: $nav-icon-only-threshold) {
			width: initial;
			flex-grow: 0;
			padding: 0 0 0 16px;
		}

		@media (max-width: $nav-hide-threshold) {
			display: none;
		}

		> .menu {
			$avatar-size: 32px;
			$avatar-margin: ($header-height - $avatar-size) / 2;
			$item-left-margin: 16px;

			position: sticky;
			top: 0;

			> .item {
				display: block;
				padding-left: $item-left-margin;
				font-size: $ui-font-size;
				font-weight: bold;
				line-height: 3em;
				text-overflow: ellipsis;
				overflow: hidden;
				white-space: nowrap;
				width: 100%;
				text-align: left;
				box-sizing: border-box;
				border-radius: 8px;
		
				> [data-icon] {
					width: ($header-height - ($avatar-margin * 2));
					margin-right: $avatar-margin;
				}

				&:hover {
					background: rgba(0, 0, 0, 0.03);
					text-decoration: none;

					@media (prefers-color-scheme: dark) {
						background: rgba(255, 255, 255, 0.03);
					}
				}

				&.router-link-active {
					color: $primary;
				}

				@media (max-width: $nav-icon-only-threshold) {
					> .text {
						display: none;
					}
				}
			}

			> .account {
				height: $header-height;
				line-height: $header-height;
				padding-left: (($header-height - $avatar-margin) + $item-left-margin);
				margin-bottom: 16px;
				border-radius: 0;

				> .avatar {
					position: absolute;
					width: $avatar-size;
					height: $avatar-size;
					top: $avatar-margin;
					left: $item-left-margin;
				}
			}
		}
	}

	> main {
		flex: 0 0 ($max-width - $nav-width - $side-width);
		min-width: 0;

		@media (max-width: $nav-icon-only-threshold) {
			flex: 1;
		}

		> .header {
			position: sticky;
			top: 0;
			z-index: 1001;
			width: 100%;
			padding: 0 16px;
			box-sizing: border-box;
			line-height: $header-height;
			height: $header-height;

			@media (max-width: 700px) {
				text-align: center;
			}

			> .body {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				height: $header-height;
		
				> .avatar {
					$size: 32px;
					display: inline-block;
					width: $size;
					height: $size;
					vertical-align: bottom;
					margin: (($header-height - $size) / 2) 8px (($header-height - $size) / 2) 0;
				}

				> .title {
					display: inline-block;
					font-size: $ui-font-size;
					margin: 0;
					line-height: $header-height;

					> [data-icon] {
						margin-right: 8px;
					}
				}
			}
		}

		> .content {
			padding: 16px;
			box-sizing: border-box;

			@media (max-width: 500px) {
				padding: 8px;
			}
		}

		> .powerd-by {
			font-size: 14px;
			text-align: center;
			margin: 32px 0;
			visibility: hidden;

			&.visible {
				visibility: visible;
			}

			&:not(.visible) {
				@media (min-width: 850px) {
					display: none;
				}
			}

			@media (max-width: 500px) {
				margin-top: 16px;
			}

			> small {
				display: block;
				margin-top: 8px;
				opacity: 0.5;

				@media (max-width: 500px) {
					margin-top: 4px;
				}
			}
		}
	}

	> .side {
		flex: 0 0 $side-width;
		padding: 0 16px 16px 0;
		box-sizing: border-box;

		@media (max-width: 1000px) {
			display: none;
		}

		> .search-and-post {
			$post-button-size: 42px;
			$post-button-margin: (($header-height - $post-button-size) / 2);

			position: sticky;
			top: 0;
			right: 0;
			z-index: 1001;
			height: $header-height;
			margin-bottom: 16px;

			> [data-icon] {
				position: absolute;
				top: 0;
				left: 16px;
				height: $header-height;
				pointer-events: none;
			}

			> .search {
				$margin: 8px;
				width: calc(100% - #{$post-button-size + $post-button-margin + $margin});
				box-sizing: border-box;
				margin-right: $margin;
				padding: 0 12px 0 42px;
				font-size: 1rem;
				line-height: 38px;
				border: none;
				border-radius: 38px;
				color: var(--fg);
				background: $lightHtml;

				@media (prefers-color-scheme: dark) {
					background: $darkHtml;
				}

				&:focus {
					outline: none;
				}
			}

			> .post {
				width: $post-button-size;
				height: $post-button-size;
				margin: $post-button-margin 0 $post-button-margin $post-button-margin;
				border-radius: 100%;
			}
		}

		> .widgets {
			> * {
				background: var(--bg);
				padding: 32px;
				border-radius: var(--radius);
			}
		}
	}

	> .buttons {
		position: fixed;
		z-index: 1000;
		bottom: 0;
		padding: 0 32px 32px 32px;
		display: flex;
		width: 100%;
		box-sizing: border-box;
		background: linear-gradient(0deg, $lightHtml, rgba($lightHtml, 0));

		@media (prefers-color-scheme: dark) {
			background: linear-gradient(0deg, $darkHtml, rgba($darkHtml, 0));
		}

		@media (max-width: 500px) {
			padding: 0 16px 16px 16px;
		}

		@media (min-width: ($nav-hide-threshold + 1px)) {
			display: none;
		}

		> .button {
			position: relative;
			padding: 0;
			margin: auto;
			width: 64px;
			height: 64px;
			border-radius: 100%;
			box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);

			&:first-child {
				margin-left: 0;
			}

			&:last-child {
				margin-right: 0;
			}

			> * {
				font-size: 22px;
			}

			&:disabled {
				cursor: default;

				> * {
					opacity: 0.5;
				}
			}

			&:not(.post) {
				background: var(--bg);
				color: var(--fg);

				&:hover {
					background: #eee;

					@media (prefers-color-scheme: dark) {
						background: #1c1e1f;
					}
				}

				> i {
					position: absolute;
					top: 0;
					left: 0;
					color: $primary;
					font-size: 16px;
					animation: blink 1s infinite;
				}
			}
		}
	}
}
</style>
