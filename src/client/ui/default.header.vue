<template>
<div class="azykntjl">
	<div class="body">
		<div class="left">
			<MkA class="item index" active-class="active" to="/" exact v-click-anime v-tooltip="$ts.timeline">
				<i class="fas fa-home fa-fw"></i>
			</MkA>
			<template v-for="item in menu">
				<div v-if="item === '-'" class="divider"></div>
				<component v-else-if="menuDef[item] && (menuDef[item].show !== false)" :is="menuDef[item].to ? 'MkA' : 'button'" class="item _button" :class="item" active-class="active" v-on="menuDef[item].action ? { click: menuDef[item].action } : {}" :to="menuDef[item].to" v-click-anime v-tooltip="$ts[menuDef[item].title]">
					<i class="fa-fw" :class="menuDef[item].icon"></i>
					<span v-if="menuDef[item].indicated" class="indicator"><i class="fas fa-circle"></i></span>
				</component>
			</template>
			<div class="divider"></div>
			<MkA v-if="$i.isAdmin || $i.isModerator" class="item" active-class="active" to="/instance" :behavior="settingsWindowed ? 'modalWindow' : null" v-click-anime v-tooltip="$ts.instance">
				<i class="fas fa-server fa-fw"></i>
			</MkA>
			<button class="item _button" @click="more" v-click-anime>
				<i class="fas fa-ellipsis-h fa-fw"></i>
				<span v-if="otherNavItemIndicated" class="indicator"><i class="fas fa-circle"></i></span>
			</button>
		</div>
		<div class="right">
			<MkA class="item" active-class="active" to="/settings" :behavior="settingsWindowed ? 'modalWindow' : null" v-click-anime v-tooltip="$ts.settings">
				<i class="fas fa-cog fa-fw"></i>
			</MkA>
			<button class="item _button account" @click="openAccountMenu" v-click-anime>
				<MkAvatar :user="$i" class="avatar"/><MkAcct class="acct" :user="$i"/>
			</button>
			<div class="post" @click="post">
				<MkButton class="button" primary full>
					<i class="fas fa-pencil-alt fa-fw"></i>
				</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { host } from '@client/config';
import { search } from '@client/scripts/search';
import * as os from '@client/os';
import { menuDef } from '@client/menu';
import { getAccounts, addAccount, login } from '@client/account';
import MkButton from '@client/components/ui/button.vue';

export default defineComponent({
	components: {
		MkButton,
	},

	data() {
		return {
			host: host,
			accounts: [],
			connection: null,
			menuDef: menuDef,
			settingsWindowed: false,
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
		'$store.reactiveState.menuDisplay.value'() {
			this.calcViewState();
		},
	},

	created() {
		window.addEventListener('resize', this.calcViewState);
		this.calcViewState();
	},

	methods: {
		calcViewState() {
			this.settingsWindowed = (window.innerWidth > 1400);
		},

		post() {
			os.post();
		},

		search() {
			search();
		},

		async openAccountMenu(ev) {
			const storedAccounts = await getAccounts().then(accounts => accounts.filter(x => x.id !== this.$i.id));
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

			os.popupMenu([...[{
				type: 'link',
				text: this.$ts.profile,
				to: `/@${ this.$i.username }`,
				avatar: this.$i,
			}, null, ...accountItemPromises, {
				icon: 'fas fa-plus',
				text: this.$ts.addAccount,
				action: () => {
					os.popupMenu([{
						text: this.$ts.existingAccount,
						action: () => { this.addAccount(); },
					}, {
						text: this.$ts.createAccount,
						action: () => { this.createAccount(); },
					}], ev.currentTarget || ev.target);
				},
			}]], ev.currentTarget || ev.target, {
				align: 'left'
			});
		},

		more(ev) {
			os.popup(import('@client/components/launch-pad.vue'), {}, {
			}, 'closed');
		},

		addAccount() {
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

		async switchAccount(account: any) {
			const storedAccounts = await getAccounts();
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
.azykntjl {
	$height: 60px;
	$avatar-size: 32px;
	$avatar-margin: 8px;

	position: sticky;
	top: 0;
	z-index: 1000;
	width: 100%;
	height: $height;
	background-color: var(--bg);

	> .body {
		max-width: 1380px;
		margin: 0 auto;
		display: flex;

		> .right,
		> .left {

			> .item {
				position: relative;
				font-size: 0.9em;
				display: inline-block;
				padding: 0 12px;
				line-height: $height;

				> i,
				> .avatar {
					margin-right: 0;
				}

				> i {
					left: 10px;
				}

				> .avatar {
					width: $avatar-size;
					height: $avatar-size;
					vertical-align: middle;
				}

				> .indicator {
					position: absolute;
					top: 0;
					left: 0;
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

			> .divider {
				display: inline-block;
				height: 16px;
				margin: 0 10px;
				border-right: solid 0.5px var(--divider);
			}

			> .post {
				display: inline-block;
			
				> .button {
					width: 40px;
					height: 40px;
					padding: 0;
					min-width: 0;
				}
			}

			> .account {
				display: inline-flex;
				align-items: center;
				vertical-align: top;
				margin-right: 8px;

				> .acct {
					margin-left: 8px;
				}
			}
		}

		> .right {
			margin-left: auto;
		}
	}
}
</style>
