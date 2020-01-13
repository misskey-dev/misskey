<template>
<div class="mk-app">
	<header class="header">
		<div class="body">
			<button class="_button account" @click="openAccountMenu">
				<mk-avatar :user="$store.state.i" class="avatar"/>
				<span class="text"><mk-acct :user="$store.state.i"/></span>
			</button>
			<div class="title">
				<transition name="header" mode="out-in" appear>
					<div class="body" :key="pageKey">
						<div class="default">
							<portal-target name="avatar" slim/>
							<h1 class="title"><portal-target name="icon" slim/><portal-target name="title" slim/></h1>
						</div>
						<div class="custom">
							<portal-target name="header" slim/>
						</div>
					</div>
				</transition>
			</div>
			<div class="sub">
				<fa :icon="faSearch"/>
				<input type="search" class="search"/>
				<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>
			</div>
		</div>
	</header>
	<nav ref="nav" class="nav">
		<div class="menu" v-if="$store.getters.isSignedIn">
			<router-link class="item" to="/" exact>
				<fa :icon="faHome" fixed-width/><span class="text">{{ $t('timeline') }}</span>
			</router-link>
			<button class="item _button" @click="notificationsOpen = !notificationsOpen" ref="notificationButton">
				<fa :icon="faBell" fixed-width/><span class="text">{{ $t('notifications') }}</span>
				<i v-if="$store.state.i.hasUnreadNotifications"><fa :icon="faCircle"/></i>
			</button>
			<router-link class="item" to="/mentions">
				<fa :icon="faAt" fixed-width/><span class="text">{{ $t('mentions') }}</span>
				<i v-if="$store.state.i.hasUnreadMentions"><fa :icon="faCircle"/></i>
			</router-link>
			<router-link class="item" to="/messages">
				<fa :icon="faEnvelope" fixed-width/><span class="text">{{ $t('messages') }}</span>
				<i v-if="$store.state.i.hasUnreadSpecifiedNotes"><fa :icon="faCircle"/></i>
			</router-link>
			<router-link class="item" to="/favorites">
				<fa :icon="faStar" fixed-width/><span class="text">{{ $t('favorites') }}</span>
			</router-link>
			<router-link class="item" to="/follow-requests" v-if="$store.state.i.isLocked">
				<fa :icon="faUserClock" fixed-width/><span class="text">{{ $t('followRequests') }}</span>
				<i v-if="$store.state.i.pendingReceivedFollowRequestsCount"><fa :icon="faCircle"/></i>
			</router-link>
			<router-link class="item" to="/instance" v-if="$store.state.i.isAdmin || $store.state.i.isModerator">
				<fa :icon="faCog" fixed-width/><span class="text">{{ $t('instance') }}</span>
			</router-link>
			<button class="item _button" @click="search()">
				<fa :icon="faSearch" fixed-width/><span class="text">{{ $t('search') }}</span>
			</button>
			<button class="item _button" @click="more()">
				<fa :icon="faEllipsisH" fixed-width/><span class="text">{{ $t('more') }}</span>
			</button>
		</div>
	</nav>
	<main>
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
	<div class="widgets">
		<div class="widget">aaa</div>
	</div>
	<div class="buttons">
		<button v-if="$store.getters.isSignedIn" class="button nav _button" @click="() => { navOpen = !navOpen; notificationsOpen = false; }" ref="navButton"><fa :icon="navOpen ? faTimes : faBars"/><i v-if="$store.state.i.hasUnreadSpecifiedNotes || $store.state.i.pendingReceivedFollowRequestsCount"><fa :icon="faCircle"/></i></button>
		<button v-if="$store.getters.isSignedIn" class="button home _button" :disabled="$route.path === '/'" @click="$router.push('/')"><fa :icon="faHome"/></button>
		<button v-if="$store.getters.isSignedIn" class="button notifications _button" @click="notificationsOpen = !notificationsOpen" ref="notificationButton2"><fa :icon="notificationsOpen ? faTimes : faBell"/><i v-if="$store.state.i.hasUnreadNotification"><fa :icon="faCircle"/></i></button>
		<button v-if="$store.getters.isSignedIn" class="button post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>
	</div>
	<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>
	<transition name="zoom-in-bottom">
		<nav v-if="navOpen" ref="nav" class="popup-nav">
			<template v-if="showLists">
				<span v-if="lists.length === 0" style="opacity: 0.5; pointer-events: none;">{{ $t('noLists') }}</span>
				<router-link v-for="list in lists" :to="`/lists/${ list.id }`" :key="list.id">{{ list.name }}</router-link>
				<div></div>
				<button class="_button" @click="createList()"><fa :icon="faPlus" fixed-width/>{{ $t('createList') }}</button>
				<router-link to="/manage-lists"><fa :icon="faCog" fixed-width/>{{ $t('manageLists') }}</router-link>
			</template>
			<button class="_button" @click="search()"><fa :icon="faSearch" fixed-width/>{{ $t('search') }}</button>
			<div></div>
			<button class="_button" @click="showLists = true"><fa :icon="faListUl" fixed-width/>{{ $t('lists') }}</button>
			<router-link to="/messages"><fa :icon="faEnvelope" fixed-width/>{{ $t('messages') }}<i v-if="$store.state.i.hasUnreadSpecifiedNotes"><fa :icon="faCircle"/></i></router-link>
			<router-link to="/favorites"><fa :icon="faStar" fixed-width/>{{ $t('favorites') }}</router-link>
			<router-link to="/follow-requests" v-if="$store.state.i.isLocked"><fa :icon="faUserClock" fixed-width/>{{ $t('followRequests') }}<i v-if="$store.state.i.pendingReceivedFollowRequestsCount"><fa :icon="faCircle"/></i></router-link>
			<div v-if="$store.state.i.isAdmin"></div>
			<router-link v-if="$store.state.i.isAdmin || $store.state.i.isModerator" to="/instance"><fa :icon="faCog" fixed-width/>{{ $t('instance') }}</router-link>
			<div></div>
			<button class="_button" @click="openAccountMenu"><mk-avatar :user="$store.state.i" class="avatar"/><mk-user-name :user="$store.state.i"/></button>
		</nav>
	</transition>
	<transition name="zoom-in-top">
		<x-notifications v-if="notificationsOpen" class="notifications" ref="notifications"/>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faEllipsisH, faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh } from '@fortawesome/free-regular-svg-icons';
import i18n from './i18n';
import { host } from './config';
import { search } from './scripts/search';
import contains from './scripts/contains';

export default Vue.extend({
	i18n,

	components: {
		XNotifications: () => import('./components/notifications.vue').then(m => m.default),
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			searching: false,
			navOpen: false,
			notificationsOpen: false,
			showLists: false,
			accounts: [],
			lists: [],
			connection: null,
			faEllipsisH, faPencilAlt, faBars, faTimes, faBell, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faEnvelope, faListUl, faPlus, faUserClock, faLaugh, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud
		};
	},

	watch:{
		$route(to, from) {
			this.pageKey++;
			this.notificationsOpen = false;
		},

		notificationsOpen(open) {
			if (open) {
				for (const el of Array.from(document.querySelectorAll('*'))) {
					el.addEventListener('mousedown', this.onMousedown);
				}
			} else {
				for (const el of Array.from(document.querySelectorAll('*'))) {
					el.removeEventListener('mousedown', this.onMousedown);
				}
			}
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

		async openAccountMenu(ev) {
			const accounts = (await this.$root.api('users/show', { userIds: this.$store.state.device.accounts.map(x => x.id) })).filter(x => x.id !== this.$store.state.i.id);

			const accountItems = accounts.map(account => ({
				type: 'user',
				user: account,
				align: 'left',
				action: () => { this.switchAccount(account) }
			}));

			this.$root.menu({
				items: [...[{
					type: 'link',
					text: this.$t('profile'),
					to: `/@${ this.$store.state.i.username }`,
					avatar: this.$store.state.i,
					align: 'left',
				}, {
					type: 'link',
					text: this.$t('settings'),
					to: '/settings',
					icon: faCog,
					align: 'left',
				}, null, {
					type: 'item',
					text: this.$t('addAcount'),
					icon: faPlus,
					action: () => { this.addAcount() },
					align: 'left',
				}], ...accountItems],
				fixed: true,
				width: 240,
				source: ev.currentTarget || ev.target,
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

		onMousedown(e) {
			e.preventDefault();
			if (!contains(this.$refs.notifications.$el, e.target) &&
				!contains(this.$refs.notificationButton, e.target) &&
				!contains(this.$refs.notificationButton2, e.target)
				) this.notificationsOpen = false;
			return false;
		},
	}
});
</script>

<style lang="scss" scoped>
@import './theme';

@keyframes blink {
	0% { opacity: 1; }
	30% { opacity: 1; }
	90% { opacity: 0; }
}

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
	$widgets-width: 304px;
	$ui-font-size: 1em;
	$item-left-margin: 16px;
	$avatar-size: 32px;
	$avatar-margin: ($header-height - $avatar-size) / 2;
	$nav-icon-only-threshold: 1200px;
	$nav-hide-threshold: 700px;
	$side-hide-threshold: 1000px;

	min-height: 100vh;
	box-sizing: border-box;
	padding-top: $header-height;

	&, > .header > .body {
		display: flex;
		max-width: $max-width;
		margin: 0 auto;
	}

	> .nav, > .header > .body > .account {
		flex: 1;
		margin: 0 0 0 32px;
		box-sizing: border-box;
		width: 100%;
		max-width: $nav-width;

		@media (max-width: $nav-icon-only-threshold) {
			width: initial;
			flex-grow: 0;
			margin: 0 0 0 16px;
		}

		@media (max-width: $nav-hide-threshold) {
			display: none;
		}
	}

	> main, > .header > .body > .title {
		flex: 0 0 ($max-width - $nav-width - $widgets-width);
		min-width: 0;

		@media (max-width: $nav-icon-only-threshold) {
			flex: 1;
		}
	}

	> .widgets, > .header > .body > .sub {
		flex: 0 0 $widgets-width;
		margin: 0 16px 0 0;
		box-sizing: border-box;

		@media (max-width: $side-hide-threshold) {
			display: none;
		}
	}

	> .header {
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

		> .body {
			> .account {
				position: relative;
				height: $header-height;
				line-height: $header-height;
				padding-left: (($header-height - $avatar-margin) + $item-left-margin);
				text-align: left;
				font-weight: bold;

				> .avatar {
					position: absolute;
					width: $avatar-size;
					height: $avatar-size;
					top: $avatar-margin;
					left: $item-left-margin;
				}

				@media (max-width: $nav-icon-only-threshold) {
					> .text {
						display: none;
					}
				}
			}

			> .title {
				position: relative;
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

					> .default {
						padding: 0 16px;

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

					> .custom {
						position: absolute;
						top: 0;
						left: 0;
						height: 100%;
					}
				}
			}

			> .sub {
				$post-button-size: 42px;
				$post-button-margin: (($header-height - $post-button-size) / 2);
				position: relative;
				height: $header-height;

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
		}
	}

	> .nav {
		> .menu {
			position: sticky;
			top: $header-height + 16px;

			> .item {
				position: relative;
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

				> i {
					position: absolute;
					top: 0;
					left: 8px;
					color: $primary;
					font-size: 8px;
					animation: blink 1s infinite;
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
		}
	}

	> main {
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

	> .widgets {
		padding: 16px 0;

		> * {
			background: var(--bg);
			padding: 32px;
			border-radius: var(--radius);
		}
	}

	> .post {
		display: none;
		position: fixed;
		z-index: 1000;
		bottom: 32px;
		right: 32px;
		width: 64px;
		height: 64px;
		border-radius: 100%;
		box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
		font-size: 22px;

		@media (min-width: ($nav-hide-threshold + 1px)) {
			display: block;
		}

		@media (min-width: ($side-hide-threshold + 1px)) {
			display: none;
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

	> .notifications {
		position: fixed;
		top: 32px;
		left: 0;
		right: 0;
		margin: 0 auto;
		z-index: 10001;
		width: 320px;
		height: 350px;
		background: rgba(255, 255, 255, 0.5);
		-webkit-backdrop-filter: blur(12px);
		backdrop-filter: blur(12px);
		border-radius: 6px;
		box-shadow: 0 3px 12px rgba(27, 31, 35, 0.15);
		overflow: hidden;

		@media (prefers-color-scheme: dark) {
			background: rgba(0, 0, 0, 0.5);
		}

		@media (max-width: 500px) {
			width: 290px;
			height: 310px;
		}
	}
}
</style>
