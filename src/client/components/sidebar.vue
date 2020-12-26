<template>
<div class="mvcprjjd">
	<transition name="nav-back">
		<div class="nav-back _modalBg"
			v-if="showing"
			@click="showing = false"
			@touchstart.passive="showing = false"
		></div>
	</transition>

	<transition name="nav">
		<nav class="nav" :class="{ iconOnly, hidden }" v-show="showing">
			<div>
				<button class="item _button account" @click="openAccountMenu">
					<MkAvatar :user="$i" class="avatar"/><MkAcct class="text" :user="$i"/>
				</button>
				<MkA class="item index" active-class="active" to="/" exact>
					<Fa :icon="faHome" fixed-width/><span class="text">{{ $ts.timeline }}</span>
				</MkA>
				<template v-for="item in menu">
					<div v-if="item === '-'" class="divider"></div>
					<component v-else-if="menuDef[item] && (menuDef[item].show !== false)" :is="menuDef[item].to ? 'MkA' : 'button'" class="item _button" :class="item" active-class="active" v-on="menuDef[item].action ? { click: menuDef[item].action } : {}" :to="menuDef[item].to">
						<Fa :icon="menuDef[item].icon" fixed-width/><span class="text">{{ $t(menuDef[item].title) }}</span>
						<i v-if="menuDef[item].indicated"><Fa :icon="faCircle"/></i>
					</component>
				</template>
				<div class="divider"></div>
				<button class="item _button" :class="{ active: $route.path === '/instance' || $route.path.startsWith('/instance/') }" v-if="$i.isAdmin || $i.isModerator" @click="oepnInstanceMenu">
					<Fa :icon="faServer" fixed-width/><span class="text">{{ $ts.instance }}</span>
				</button>
				<button class="item _button" @click="more">
					<Fa :icon="faEllipsisH" fixed-width/><span class="text">{{ $ts.more }}</span>
					<i v-if="otherNavItemIndicated"><Fa :icon="faCircle"/></i>
				</button>
				<MkA class="item" active-class="active" to="/settings">
					<Fa :icon="faCog" fixed-width/><span class="text">{{ $ts.settings }}</span>
				</MkA>
			</div>
		</nav>
	</transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faGripVertical, faChevronLeft, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faInfoCircle, faQuestionCircle, faProjectDiagram, faStream, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh, faComments } from '@fortawesome/free-regular-svg-icons';
import { host } from '@/config';
import { search } from '@/scripts/search';
import * as os from '@/os';
import { sidebarDef } from '@/sidebar';
import { getAccounts, addAccount, login } from '@/account';

export default defineComponent({
	data() {
		return {
			host: host,
			showing: false,
			searching: false,
			accounts: [],
			connection: null,
			menuDef: sidebarDef,
			iconOnly: false,
			hidden: false,
			faGripVertical, faChevronLeft, faComments, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faBell, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faEnvelope, faListUl, faPlus, faUserClock, faLaugh, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faProjectDiagram
		};
	},

	computed: {
		menu(): string[] {
			return this.$store.state.menu;
		},

		otherNavItemIndicated(): boolean {
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

		'$store.reactiveState.sidebarDisplay'() {
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
			this.iconOnly = (window.innerWidth <= 1279) || (this.$store.state.sidebarDisplay === 'icon');
			this.hidden = (window.innerWidth <= 650);
		},

		show() {
			this.showing = true;
		},

		search() {
			if (this.searching) return;

			os.dialog({
				title: this.$ts.search,
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
			const storedAccounts = getAccounts();
			const accounts = (await os.api('users/show', { userIds: storedAccounts.map(x => x.id) })).filter(x => x.id !== this.$i.id);

			const accountItems = accounts.map(account => ({
				type: 'user',
				user: account,
				action: () => { this.switchAccount(account); }
			}));

			os.modalMenu([...[{
				type: 'link',
				text: this.$ts.profile,
				to: `/@${ this.$i.username }`,
				avatar: this.$i,
			}, null, ...accountItems, {
				icon: faPlus,
				text: this.$ts.addAcount,
				action: () => {
					os.modalMenu([{
						text: this.$ts.existingAcount,
						action: () => { this.addAcount(); },
					}, {
						text: this.$ts.createAccount,
						action: () => { this.createAccount(); },
					}], ev.currentTarget || ev.target);
				},
			}]], ev.currentTarget || ev.target, {
				align: 'left'
			});
		},

		oepnInstanceMenu(ev) {
			os.modalMenu([{
				type: 'link',
				text: this.$ts.dashboard,
				to: '/instance',
				icon: faTachometerAlt,
			}, null, this.$i.isAdmin ? {
				type: 'link',
				text: this.$ts.settings,
				to: '/instance/settings',
				icon: faCog,
			} : undefined, {
				type: 'link',
				text: this.$ts.customEmojis,
				to: '/instance/emojis',
				icon: faLaugh,
			}, {
				type: 'link',
				text: this.$ts.users,
				to: '/instance/users',
				icon: faUsers,
			}, {
				type: 'link',
				text: this.$ts.files,
				to: '/instance/files',
				icon: faCloud,
			}, {
				type: 'link',
				text: this.$ts.jobQueue,
				to: '/instance/queue',
				icon: faExchangeAlt,
			}, {
				type: 'link',
				text: this.$ts.federation,
				to: '/instance/federation',
				icon: faGlobe,
			}, {
				type: 'link',
				text: this.$ts.relays,
				to: '/instance/relays',
				icon: faProjectDiagram,
			}, {
				type: 'link',
				text: this.$ts.announcements,
				to: '/instance/announcements',
				icon: faBroadcastTower,
			}, {
				type: 'link',
				text: this.$ts.abuseReports,
				to: '/instance/abuses',
				icon: faExclamationCircle,
			}, {
				type: 'link',
				text: this.$ts.logs,
				to: '/instance/logs',
				icon: faStream,
			}], ev.currentTarget || ev.target);
		},

		more(ev) {
			os.popup(import('./launch-pad.vue'), {}, {
			}, 'closed');
		},

		addAcount() {
			os.popup(import('./signin-dialog.vue'), {}, {
				done: res => {
					addAccount(res.id, res.i);
					os.success();
				},
			}, 'closed');
		},

		createAccount() {
			os.popup(import('./signup-dialog.vue'), {}, {
				done: res => {
					addAccount(res.id, res.i);
					this.switchAccountWithToken(res.i);
				},
			}, 'closed');
		},

		switchAccount(account: any) {
			const storedAccounts = getAccounts();
			const token = storedAccounts.find(x => x.id === account.id).token;
			this.switchAccountWithToken(token);
		},

		switchAccountWithToken(token: string) {
			login(token);
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
	$nav-icon-only-width: 86px;

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

			> .divider {
				margin: 16px 0;
				border-top: solid 1px var(--divider);
			}

			> .item {
				position: relative;
				display: block;
				padding-left: 24px;
				font-size: $ui-font-size;
				line-height: 3rem;
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
