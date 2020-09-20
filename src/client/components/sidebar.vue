<template>
<div class="mvcprjjd">
	<transition name="nav-back">
		<div class="nav-back _modalBg"
			v-if="showing"
			@click="showing = false"
			@touchstart="showing = false"
		></div>
	</transition>

	<transition name="nav">
		<nav class="nav" :class="{ iconOnly, hidden }" v-show="showing">
			<div>
				<button class="item _button account" @click="openAccountMenu" v-if="$store.getters.isSignedIn">
					<mk-avatar :user="$store.state.i" class="avatar"/><mk-acct class="text" :user="$store.state.i"/>
				</button>
				<button class="item _button index active" @click="top()" v-if="$route.name === 'index'">
					<fa :icon="faHome" fixed-width/><span class="text">{{ $store.getters.isSignedIn ? $t('timeline') : $t('home') }}</span>
				</button>
				<router-link class="item index" active-class="active" to="/" exact v-else>
					<fa :icon="faHome" fixed-width/><span class="text">{{ $store.getters.isSignedIn ? $t('timeline') : $t('home') }}</span>
				</router-link>
				<template v-for="item in menu">
					<div v-if="item === '-'" class="divider"></div>
					<component v-else-if="menuDef[item] && (menuDef[item].show !== false)" :is="menuDef[item].to ? 'router-link' : 'button'" class="item _button" :class="item" active-class="active" @click="() => { if (menuDef[item].action) menuDef[item].action() }" :to="menuDef[item].to">
						<fa :icon="menuDef[item].icon" fixed-width/><span class="text">{{ $t(menuDef[item].title) }}</span>
						<i v-if="menuDef[item].indicated"><fa :icon="faCircle"/></i>
					</component>
				</template>
				<div class="divider"></div>
				<button class="item _button" :class="{ active: $route.path === '/instance' || $route.path.startsWith('/instance/') }" v-if="$store.getters.isSignedIn && ($store.state.i.isAdmin || $store.state.i.isModerator)" @click="oepnInstanceMenu">
					<fa :icon="faServer" fixed-width/><span class="text">{{ $t('instance') }}</span>
				</button>
				<button class="item _button" @click="more">
					<fa :icon="faEllipsisH" fixed-width/><span class="text">{{ $t('more') }}</span>
					<i v-if="otherNavItemIndicated"><fa :icon="faCircle"/></i>
				</button>
				<router-link class="item" active-class="active" to="/preferences">
					<fa :icon="faCog" fixed-width/><span class="text">{{ $t('settings') }}</span>
				</router-link>
			</div>
		</nav>
	</transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faGripVertical, faChevronLeft, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faInfoCircle, faQuestionCircle, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh, faComments } from '@fortawesome/free-regular-svg-icons';
import { host, instanceName } from '@/config';
import { search } from '@/scripts/search';
import * as os from '@/os';

export default defineComponent({
	data() {
		return {
			host: host,
			showing: false,
			searching: false,
			accounts: [],
			connection: null,
			menuDef: this.$store.getters.nav({
				search: this.search
			}),
			iconOnly: false,
			hidden: false,
			faGripVertical, faChevronLeft, faComments, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faBell, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faEnvelope, faListUl, faPlus, faUserClock, faLaugh, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faProjectDiagram
		};
	},

	computed: {
		menu(): string[] {
			return this.$store.state.deviceUser.menu;
		},

		otherNavItemIndicated(): boolean {
			if (!this.$store.getters.isSignedIn) return false;
			for (const def in this.menuDef) {
				if (this.menu.includes(def)) continue;
				if (this.menuDef[def].indicated) return true;
			}
			return false;
		},
	},

	watch: {
		$route(to, from) {
			this.showing = false;
		},

		'$store.state.device.sidebarDisplay'() {
			this.calcViewState();
		},

		iconOnly() {
			this.$nextTick(() => {
				this.$emit('change-view-mode');
			});
		},

		hidden() {
			this.$nextTick(() => {
				this.$emit('change-view-mode');
			});
		}
	},

	created() {
		window.addEventListener('resize', this.calcViewState);
		this.calcViewState();
	},

	methods: {
		calcViewState() {
			this.iconOnly = (window.innerWidth <= 1279) || (this.$store.state.device.sidebarDisplay === 'icon');
			this.hidden = (window.innerWidth <= 650) || (this.$store.state.device.sidebarDisplay === 'hide');
		},

		show() {
			this.showing = true;
		},

		top() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		search() {
			if (this.searching) return;

			os.dialog({
				title: this.$t('search'),
				input: true
			}).then(async ({ canceled, result: query }) => {
				if (canceled || query == null || query === '') return;

				this.searching = true;
				search(this, query).finally(() => {
					this.searching = false;
				});
			});
		},

		async openAccountMenu(ev) {
			const accounts = (await os.api('users/show', { userIds: this.$store.state.device.accounts.map(x => x.id) })).filter(x => x.id !== this.$store.state.i.id);

			const accountItems = accounts.map(account => ({
				type: 'user',
				user: account,
				action: () => { this.switchAccount(account); }
			}));

			os.menu({
				items: [...[{
					type: 'link',
					text: this.$t('profile'),
					to: `/@${ this.$store.state.i.username }`,
					avatar: this.$store.state.i,
				}, {
					type: 'link',
					text: this.$t('accountSettings'),
					to: '/my/settings',
					icon: faCog,
				}, null, ...accountItems, {
					icon: faPlus,
					text: this.$t('addAcount'),
					action: () => {
						os.menu({
							items: [{
								text: this.$t('existingAcount'),
								action: () => { this.addAcount(); },
							}, {
								text: this.$t('createAccount'),
								action: () => { this.createAccount(); },
							}],
							align: 'left',
							fixed: true,
							width: 240,
						}, {
							source: ev.currentTarget || ev.target,
						});
					},
				}]],
				align: 'left',
				fixed: true,
				width: 240,
			}, {
				source: ev.currentTarget || ev.target,
			});
		},

		oepnInstanceMenu(ev) {
			os.menu({
				items: [{
					type: 'link',
					text: this.$t('dashboard'),
					to: '/instance',
					icon: faTachometerAlt,
				}, null, {
					type: 'link',
					text: this.$t('settings'),
					to: '/instance/settings',
					icon: faCog,
				}, {
					type: 'link',
					text: this.$t('customEmojis'),
					to: '/instance/emojis',
					icon: faLaugh,
				}, {
					type: 'link',
					text: this.$t('users'),
					to: '/instance/users',
					icon: faUsers,
				}, {
					type: 'link',
					text: this.$t('files'),
					to: '/instance/files',
					icon: faCloud,
				}, {
					type: 'link',
					text: this.$t('jobQueue'),
					to: '/instance/queue',
					icon: faExchangeAlt,
				}, {
					type: 'link',
					text: this.$t('federation'),
					to: '/instance/federation',
					icon: faGlobe,
				}, {
					type: 'link',
					text: this.$t('relays'),
					to: '/instance/relays',
					icon: faProjectDiagram,
				}, {
					type: 'link',
					text: this.$t('announcements'),
					to: '/instance/announcements',
					icon: faBroadcastTower,
				}],
				align: 'left',
				fixed: true,
				width: 200,
			}, {
				source: ev.currentTarget || ev.target,
			});
		},

		more(ev) {
			const items = Object.keys(this.menuDef).filter(k => !this.menu.includes(k)).map(k => this.menuDef[k]).filter(def => def.show == null ? true : def.show).map(def => ({
				type: def.to ? 'link' : 'button',
				text: this.$t(def.title),
				icon: def.icon,
				to: def.to,
				action: def.action,
				indicate: def.indicated,
			}));
			os.menu({
				items: [...items, null, {
					type: 'link',
					text: this.$t('help'),
					to: '/docs',
					icon: faQuestionCircle,
				}, {
					type: 'link',
					text: this.$t('aboutX', { x: instanceName || host }),
					to: '/about',
					icon: faInfoCircle,
				}, {
					type: 'link',
					text: this.$t('aboutMisskey'),
					to: '/about-misskey',
					icon: faInfoCircle,
				}],
				align: 'left',
				fixed: true,
				width: 200,
			}, {
				source: ev.currentTarget || ev.target,
			});
		},

		async addAcount() {
			os.modal(await import('./signin-dialog.vue')).$once('login', res => {
				this.$store.dispatch('addAcount', res);
				os.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
		},

		async createAccount() {
			os.modal(await import('./signup-dialog.vue')).$once('signup', res => {
				this.$store.dispatch('addAcount', res);
				this.switchAccountWithToken(res.i);
			});
		},

		async switchAccount(account: any) {
			const token = this.$store.state.device.accounts.find((x: any) => x.id === account.id).token;
			this.switchAccountWithToken(token);
		},

		switchAccountWithToken(token: string) {
			os.dialog({
				type: 'waiting',
				iconOnly: true
			});

			os.api('i', {}, token).then((i: any) => {
				this.$store.dispatch('switchAccount', {
					...i,
					token: token
				}).then(() => {
					this.$nextTick(() => {
						location.reload();
					});
				});
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.nav-enter-active,
.nav-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.nav-enter-from,
.nav-leave-active {
	opacity: 0;
	transform: translateX(-240px);
}

.nav-back-enter-active,
.nav-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.nav-back-enter-from,
.nav-back-leave-active {
	opacity: 0;
}

.mvcprjjd {
	$ui-font-size: 1em; // TODO: どこかに集約したい
	$nav-width: 250px;
	$nav-icon-only-width: 80px;

	> .nav-back {
		z-index: 1001;
	}

	> .nav {
		$avatar-size: 32px;
		$avatar-margin: 8px;

		flex: 0 0 $nav-width;
		width: $nav-width;
		box-sizing: border-box;

		&.iconOnly {
			flex: 0 0 $nav-icon-only-width;
			width: $nav-icon-only-width;

			&:not(.hidden) {
				> div {
					width: $nav-icon-only-width;

					> .divider {
						margin: 8px auto;
						width: calc(100% - 32px);
					}

					> .item {
						padding-left: 0;
						width: 100%;
						text-align: center;
						font-size: $ui-font-size * 1.1;
						line-height: 3.7rem;

						> [data-icon],
						> .avatar {
							margin-right: 0;
						}

						> i {
							left: 10px;
						}

						> .text {
							display: none;
						}

						&:first-child {
							margin-bottom: 8px;
						}

						&:last-child {
							margin-top: 8px;
						}
					}
				}
			}
		}

		&.hidden {
			position: fixed;
			top: 0;
			left: 0;
			z-index: 1001;

			> div {
				> .index,
				> .notifications {
					display: none;
				}
			}
		}

		&:not(.hidden) {
			display: block !important;
		}

		> div {
			position: fixed;
			top: 0;
			left: 0;
			z-index: 1001;
			width: $nav-width;
			// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
			height: calc(var(--vh, 1vh) * 100);
			box-sizing: border-box;
			overflow: auto;
			background: var(--navBg);
			border-right: solid 1px var(--divider);

			> .divider {
				margin: 16px 0;
				border-top: solid 1px var(--divider);
			}

			> .item {
				position: relative;
				display: block;
				padding-left: 32px;
				font-size: $ui-font-size;
				line-height: 3.2rem;
				text-overflow: ellipsis;
				overflow: hidden;
				white-space: nowrap;
				width: 100%;
				text-align: left;
				box-sizing: border-box;
				color: var(--navFg);

				> [data-icon] {
					width: 32px;
				}

				> [data-icon],
				> .avatar {
					margin-right: $avatar-margin;
				}

				> .avatar {
					width: $avatar-size;
					height: $avatar-size;
					vertical-align: middle;
				}

				> i {
					position: absolute;
					top: 0;
					left: 20px;
					color: var(--navIndicator);
					font-size: 8px;
					animation: blink 1s infinite;
				}

				&:hover {
					text-decoration: none;
					color: var(--navHoverFg);
				}

				&.active {
					color: var(--navActive);
				}

				&:first-child, &:last-child {
					position: sticky;
					z-index: 1;
					padding-top: 8px;
					padding-bottom: 8px;
					background: var(--X14);
					-webkit-backdrop-filter: blur(8px);
					backdrop-filter: blur(8px);
				}

				&:first-child {
					top: 0;
					margin-bottom: 16px;
					border-bottom: solid 1px var(--divider);
				}

				&:last-child {
					bottom: 0;
					margin-top: 16px;
					border-top: solid 1px var(--divider);
				}
			}
		}
	}
}
</style>
