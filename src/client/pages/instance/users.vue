<template>
<div class="mk-instance-users">
	<div class="_section">
		<div class="_content">
			<MkButton inline primary @click="addUser()"><Fa :icon="faPlus"/> {{ $ts.addUser }}</MkButton>
		</div>
	</div>

	<div class="_section lookup">
		<div class="_title"><Fa :icon="faSearch"/> {{ $ts.lookup }}</div>
		<div class="_content">
			<MkInput class="target" v-model:value="target" type="text" @enter="showUser()">
				<span>{{ $ts.usernameOrUserId }}</span>
			</MkInput>
			<MkButton @click="showUser()" primary><Fa :icon="faSearch"/> {{ $ts.lookup }}</MkButton>
		</div>
	</div>

	<div class="_section users">
		<div class="_title"><Fa :icon="faUsers"/> {{ $ts.users }}</div>
		<div class="_content">
			<div class="inputs" style="display: flex;">
				<MkSelect v-model:value="sort" style="margin: 0; flex: 1;">
					<template #label>{{ $ts.sort }}</template>
					<option value="-createdAt">{{ $ts.registeredDate }} ({{ $ts.ascendingOrder }})</option>
					<option value="+createdAt">{{ $ts.registeredDate }} ({{ $ts.descendingOrder }})</option>
					<option value="-updatedAt">{{ $ts.lastUsed }} ({{ $ts.ascendingOrder }})</option>
					<option value="+updatedAt">{{ $ts.lastUsed }} ({{ $ts.descendingOrder }})</option>
				</MkSelect>
				<MkSelect v-model:value="state" style="margin: 0; flex: 1;">
					<template #label>{{ $ts.state }}</template>
					<option value="all">{{ $ts.all }}</option>
					<option value="available">{{ $ts.normal }}</option>
					<option value="admin">{{ $ts.administrator }}</option>
					<option value="moderator">{{ $ts.moderator }}</option>
					<option value="silenced">{{ $ts.silence }}</option>
					<option value="suspended">{{ $ts.suspend }}</option>
				</MkSelect>
				<MkSelect v-model:value="origin" style="margin: 0; flex: 1;">
					<template #label>{{ $ts.instance }}</template>
					<option value="combined">{{ $ts.all }}</option>
					<option value="local">{{ $ts.local }}</option>
					<option value="remote">{{ $ts.remote }}</option>
				</MkSelect>
			</div>
			<div class="inputs" style="display: flex; padding-top: 1.2em;">
				<MkInput v-model:value="searchUsername" style="margin: 0; flex: 1;" type="text" spellcheck="false" @update:value="$refs.users.reload()">
					<span>{{ $ts.username }}</span>
				</MkInput>
				<MkInput v-model:value="searchHost" style="margin: 0; flex: 1;" type="text" spellcheck="false" @update:value="$refs.users.reload()" :disabled="pagination.params().origin === 'local'">
					<span>{{ $ts.host }}</span>
				</MkInput>
			</div>

			<MkPagination :pagination="pagination" #default="{items}" class="users" ref="users">
				<button class="user _panel _button _vMargin" v-for="user in items" :key="user.id" @click="show(user)">
					<MkAvatar class="avatar" :user="user" :disable-link="true"/>
					<div class="body">
						<header>
							<MkUserName class="name" :user="user"/>
							<span class="acct">@{{ acct(user) }}</span>
							<span class="staff" v-if="user.isAdmin"><Fa :icon="faBookmark"/></span>
							<span class="staff" v-if="user.isModerator"><Fa :icon="farBookmark"/></span>
							<span class="punished" v-if="user.isSilenced"><Fa :icon="faMicrophoneSlash"/></span>
							<span class="punished" v-if="user.isSuspended"><Fa :icon="faSnowflake"/></span>
						</header>
						<div>
							<span>{{ $ts.lastUsed }}: <MkTime v-if="user.updatedAt" :time="user.updatedAt" mode="detail"/></span>
						</div>
						<div>
							<span>{{ $ts.registeredDate }}: <MkTime :time="user.createdAt" mode="detail"/></span>
						</div>
					</div>
				</button>
			</MkPagination>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faUsers, faSearch, faBookmark, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import { faSnowflake, faBookmark as farBookmark } from '@fortawesome/free-regular-svg-icons';
import parseAcct from '../../../misc/acct/parse';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkSelect from '@client/components/ui/select.vue';
import MkPagination from '@client/components/ui/pagination.vue';
import { acct } from '../../filters/user';
import * as os from '@client/os';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkPagination,
	},

	data() {
		return {
			INFO: {
				title: this.$ts.users,
				icon: faUsers,
				action: {
					icon: faSearch,
					handler: this.searchUser
				}
			},
			target: '',
			sort: '+createdAt',
			state: 'all',
			origin: 'local',
			searchUsername: '',
			searchHost: '',
			pagination: {
				endpoint: 'admin/show-users',
				limit: 10,
				params: () => ({
					sort: this.sort,
					state: this.state,
					origin: this.origin,
					username: this.searchUsername,
					hostname: this.searchHost,
				}),
				offsetMode: true
			},
			faPlus, faUsers, faSearch, faBookmark, farBookmark, faMicrophoneSlash, faSnowflake
		}
	},

	watch: {
		sort() {
			this.$refs.users.reload();
		},
		state() {
			this.$refs.users.reload();
		},
		origin() {
			this.$refs.users.reload();
		},
	},

	methods: {
		/** テキストエリアのユーザーを解決する */
		fetchUser() {
			return new Promise((res) => {
				const usernamePromise = os.api('users/show', parseAcct(this.target));
				const idPromise = os.api('users/show', { userId: this.target });
				let _notFound = false;
				const notFound = () => {
					if (_notFound) {
						os.dialog({
							type: 'error',
							text: this.$ts.noSuchUser
						});
					} else {
						_notFound = true;
					}
				};
				usernamePromise.then(res).catch(e => {
					if (e.code === 'NO_SUCH_USER') {
						notFound();
					}
				});
				idPromise.then(res).catch(e => {
					notFound();
				});
			});
		},

		/** テキストエリアから処理対象ユーザーを設定する */
		async showUser() {
			const user = await this.fetchUser();
			this.show(user);
			this.target = '';
		},

		searchUser() {
			os.selectUser().then(user => {
				this.show(user);
			});
		},

		async addUser() {
			const { canceled: canceled1, result: username } = await os.dialog({
				title: this.$ts.username,
				input: true
			});
			if (canceled1) return;

			const { canceled: canceled2, result: password } = await os.dialog({
				title: this.$ts.password,
				input: { type: 'password' }
			});
			if (canceled2) return;

			os.apiWithDialog('admin/accounts/create', {
				username: username,
				password: password,
			}).then(res => {
				this.$refs.users.reload();
			});
		},

		show(user) {
			os.popup(import('./user-dialog.vue'), {
				userId: user.id
			}, {}, 'closed');
		},

		acct
	}
});
</script>

<style lang="scss" scoped>
.mk-instance-users {
	> .users {
		> ._content {
			> .users {
				margin-top: var(--margin);

				> .user {
					display: flex;
					width: 100%;
					box-sizing: border-box;
					text-align: left;
					align-items: center;
					padding: 16px;

					&:hover {
						color: var(--accent);
					}

					> .avatar {
						width: 60px;
						height: 60px;
					}

					> .body {
						margin-left: 0.3em;
						padding: 0 8px;
						flex: 1;

						@media (max-width: 500px) {
							font-size: 14px;
						}

						> header {
							> .name {
								font-weight: bold;
							}

							> .acct {
								margin-left: 8px;
								opacity: 0.7;
							}

							> .staff {
								margin-left: 0.5em;
								color: var(--badge);
							}

							> .punished {
								margin-left: 0.5em;
								color: #4dabf7;
							}
						}
					}
				}
			}
		}
	}
}
</style>
