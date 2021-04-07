<template>
<div class="npcljfve" :class="{ iconOnly }">
	<button class="item _button account" @click="openAccountMenu">
		<MkAvatar :user="$i" class="avatar"/><MkAcct class="text" :user="$i"/>
	</button>
	<div class="post" @click="post">
		<MkButton class="button" primary full>
			<Fa :icon="faPencilAlt" fixed-width/><span class="text" v-if="!iconOnly">{{ $ts.note }}</span>
		</MkButton>
	</div>
	<div class="divider"></div>
	<MkA class="item index" active-class="active" to="/" exact>
		<Fa :icon="faHome" fixed-width/><span class="text">{{ $ts.timeline }}</span>
	</MkA>
	<template v-for="item in menu">
		<div v-if="item === '-'" class="divider"></div>
		<component v-else-if="menuDef[item] && (menuDef[item].show !== false)" :is="menuDef[item].to ? 'MkA' : 'button'" class="item _button" :class="item" active-class="active" v-on="menuDef[item].action ? { click: menuDef[item].action } : {}" :to="menuDef[item].to">
			<Fa :icon="menuDef[item].icon" fixed-width/><span class="text">{{ $ts[menuDef[item].title] }}</span>
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
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faGripVertical, faChevronLeft, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faInfoCircle, faQuestionCircle, faProjectDiagram, faStream, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh, faComments } from '@fortawesome/free-regular-svg-icons';
import { host } from '@client/config';
import { search } from '@client/scripts/search';
import * as os from '@client/os';
import { sidebarDef } from '@client/sidebar';
import { getAccounts, addAccount, login } from '@client/account';
import MkButton from '@client/components/ui/button.vue';

export default defineComponent({
	components: {
		MkButton
	},

	data() {
		return {
			host: host,
			accounts: [],
			connection: null,
			menuDef: sidebarDef,
			iconOnly: false,
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
		'$store.reactiveState.sidebarDisplay.value'() {
			this.calcViewState();
		},

		iconOnly() {
			this.$nextTick(() => {
				this.$emit('change-view-mode');
			});
		},
	},

	created() {
		window.addEventListener('resize', this.calcViewState);
		this.calcViewState();
	},

	methods: {
		calcViewState() {
			this.iconOnly = (window.innerWidth <= 1400) || (this.$store.state.sidebarDisplay === 'icon');
		},

		post() {
			os.post();
		},

		search() {
			search();
		},

		async openAccountMenu(ev) {
			const storedAccounts = getAccounts().filter(x => x.id !== this.$i.id);
			const accountsPromise = os.api('users/show', { userIds: storedAccounts.map(x => x.id) });

			const accountItemPromises = storedAccounts.map(a => new Promise(res => {
				accountsPromise.then(accounts => {
					const account = accounts.find(x => x.id === a.id);
					if (account == null) return res(null);
					res({
						type: 'user',
						user: account,
						action: () => { this.switchAccount(account); }
					});
				});
			}));

			os.modalMenu([...[{
				type: 'link',
				text: this.$ts.profile,
				to: `/@${ this.$i.username }`,
				avatar: this.$i,
			}, null, ...accountItemPromises, {
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
			os.popup(import('../../components/launch-pad.vue'), {}, {
			}, 'closed');
		},

		addAcount() {
			os.popup(import('../../components/signin-dialog.vue'), {}, {
				done: res => {
					addAccount(res.id, res.i);
					os.success();
				},
			}, 'closed');
		},

		createAccount() {
			os.popup(import('../../components/signup-dialog.vue'), {}, {
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
.npcljfve {
	$ui-font-size: 1em; // TODO: どこかに集約したい
	$nav-width: 250px;
	$nav-icon-only-width: 55px;
	$avatar-size: 32px;
	$avatar-margin: 8px;

	padding: 0 16px;

	&.iconOnly {
		flex: 0 0 $nav-icon-only-width;
		width: $nav-icon-only-width !important;

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

	> .divider {
		margin: 10px 0;
		border-top: solid 0.5px var(--divider);
	}

	> .post {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: 16px 0;
		background: var(--bg);

		> .button {
			min-width: 0;
		}
	}

	> .item {
		position: relative;
		display: block;
		font-size: $ui-font-size;
		line-height: 2.6rem;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 100%;
		text-align: left;
		box-sizing: border-box;

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
	}
}
</style>
