<template>
<div class="npcljfve" :class="{ iconOnly }">
	<button class="item _button account" @click="openAccountMenu">
		<MkAvatar :user="$i" class="avatar"/><MkAcct class="text" :user="$i"/>
	</button>
	<div class="post" @click="post">
		<MkButton class="button" primary full>
			<i class="fas fa-pencil-alt fa-fw"></i><span class="text" v-if="!iconOnly">{{ $ts.note }}</span>
		</MkButton>
	</div>
	<div class="divider"></div>
	<MkA class="item index" active-class="active" to="/" exact>
		<i class="fas fa-home fa-fw"></i><span class="text">{{ $ts.timeline }}</span>
	</MkA>
	<template v-for="item in menu">
		<div v-if="item === '-'" class="divider"></div>
		<component v-else-if="menuDef[item] && (menuDef[item].show !== false)" :is="menuDef[item].to ? 'MkA' : 'button'" class="item _button" :class="item" active-class="active" v-on="menuDef[item].action ? { click: menuDef[item].action } : {}" :to="menuDef[item].to">
			<i class="fa-fw" :class="menuDef[item].icon"></i><span class="text">{{ $ts[menuDef[item].title] }}</span>
			<span v-if="menuDef[item].indicated" class="indicator"><i class="fas fa-circle"></i></span>
		</component>
	</template>
	<div class="divider"></div>
	<button class="item _button" :class="{ active: $route.path === '/instance' || $route.path.startsWith('/instance/') }" v-if="$i.isAdmin || $i.isModerator" @click="oepnInstanceMenu">
		<i class="fas fa-server fa-fw"></i><span class="text">{{ $ts.instance }}</span>
	</button>
	<button class="item _button" @click="more">
		<i class="fas fa-ellipsis-h fa-fw"></i><span class="text">{{ $ts.more }}</span>
		<span v-if="otherNavItemIndicated" class="indicator"><i class="fas fa-circle"></i></span>
	</button>
	<MkA class="item" active-class="active" to="/settings" :behavior="settingsWindowed ? 'modalWindow' : null">
		<i class="fas fa-cog fa-fw"></i><span class="text">{{ $ts.settings }}</span>
	</MkA>
	<div class="divider"></div>
	<div class="foo">
		<MkEmoji :normal="true" :no-style="true" emoji="🍮"/>
	</div>
	<!--<MisskeyLogo class="misskey"/>-->
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
import { StickySidebar } from '@client/scripts/sticky-sidebar';
import MisskeyLogo from '@/../assets/client/misskey.svg';

export default defineComponent({
	components: {
		MkButton,
		MisskeyLogo,
	},

	data() {
		return {
			host: host,
			accounts: [],
			connection: null,
			menuDef: sidebarDef,
			iconOnly: false,
			settingsWindowed: false,
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

	mounted() {
		const sticky = new StickySidebar(this.$el.parentElement, 16);
		window.addEventListener('scroll', () => {
			sticky.calc(window.scrollY);
		}, { passive: true });
	},

	methods: {
		calcViewState() {
			this.iconOnly = (window.innerWidth <= 1400) || (this.$store.state.sidebarDisplay === 'icon');
			this.settingsWindowed = (window.innerWidth > 1400);
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
				icon: 'fas fa-plus',
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
				icon: 'fas fa-tachometer-alt',
			}, null, this.$i.isAdmin ? {
				type: 'link',
				text: this.$ts.settings,
				to: '/instance/settings',
				icon: 'fas fa-cog',
			} : undefined, {
				type: 'link',
				text: this.$ts.customEmojis,
				to: '/instance/emojis',
				icon: 'fas fa-laugh',
			}, {
				type: 'link',
				text: this.$ts.users,
				to: '/instance/users',
				icon: 'fas fa-users',
			}, {
				type: 'link',
				text: this.$ts.files,
				to: '/instance/files',
				icon: 'fas fa-cloud',
			}, {
				type: 'link',
				text: this.$ts.jobQueue,
				to: '/instance/queue',
				icon: 'fas fa-exchange-alt',
			}, {
				type: 'link',
				text: this.$ts.federation,
				to: '/instance/federation',
				icon: 'fas fa-globe',
			}, {
				type: 'link',
				text: this.$ts.relays,
				to: '/instance/relays',
				icon: 'fas fa-project-diagram',
			}, {
				type: 'link',
				text: this.$ts.announcements,
				to: '/instance/announcements',
				icon: 'fas fa-broadcast-tower',
			}, {
				type: 'link',
				text: this.$ts.abuseReports,
				to: '/instance/abuses',
				icon: 'fas fa-exclamation-circle',
			}, {
				type: 'link',
				text: this.$ts.logs,
				to: '/instance/logs',
				icon: 'fas fa-stream',
			}], ev.currentTarget || ev.target);
		},

		more(ev) {
			os.popup(import('@client/components/launch-pad.vue'), {}, {
			}, 'closed');
		},

		addAcount() {
			os.popup(import('@client/components/signin-dialog.vue'), {}, {
				done: res => {
					addAccount(res.id, res.i);
					os.success();
				},
			}, 'closed');
		},

		createAccount() {
			os.popup(import('@client/components/signup-dialog.vue'), {}, {
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
	$nav-icon-only-width: 78px; // TODO: どこかに集約したい
	$avatar-size: 32px;
	$avatar-margin: 8px;

	padding: 0 16px;
	box-sizing: border-box;
	width: 260px;

	&.iconOnly {
		flex: 0 0 $nav-icon-only-width;
		width: $nav-icon-only-width !important;

		> .divider {
			margin: 8px auto;
			width: calc(100% - 32px);
		}

		> .post {
			> .button {
				width: 46px;
				height: 46px;
				padding: 0;
			}
		}

		> .item {
			padding-left: 0;
			width: 100%;
			text-align: center;
			font-size: $ui-font-size * 1.1;
			line-height: 3.7rem;

			> i,
			> .avatar {
				margin-right: 0;
			}

			> i {
				left: 10px;
			}

			> .text {
				display: none;
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

	> .misskey {
		fill: currentColor;
	}

	> .foo {
		text-align: center;
		padding: 8px 0 16px 0;
		opacity: 0.5;
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

		> i {
			width: 32px;
		}

		> i,
		> .avatar {
			margin-right: $avatar-margin;
		}

		> .avatar {
			width: $avatar-size;
			height: $avatar-size;
			vertical-align: middle;
		}

		> .indicator {
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
