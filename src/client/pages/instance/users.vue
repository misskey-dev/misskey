<template>
<div class="mk-instance-users">
	<portal to="icon"><fa :icon="faUsers"/></portal>
	<portal to="title">{{ $t('users') }}</portal>

	<section class="_card _vMargin lookup">
		<div class="_title"><fa :icon="faSearch"/> {{ $t('lookup') }}</div>
		<div class="_content">
			<mk-input class="target" v-model="target" type="text" @enter="showUser()">
				<span>{{ $t('usernameOrUserId') }}</span>
			</mk-input>
			<mk-button @click="showUser()" primary><fa :icon="faSearch"/> {{ $t('lookup') }}</mk-button>
		</div>
		<div class="_footer">
			<mk-button inline primary @click="searchUser()"><fa :icon="faSearch"/> {{ $t('search') }}</mk-button>
		</div>
	</section>

	<section class="_card _vMargin users">
		<div class="_title"><fa :icon="faUsers"/> {{ $t('users') }}</div>
		<div class="_content">
			<div class="inputs" style="display: flex;">
				<mk-select v-model="sort" style="margin: 0; flex: 1;">
					<template #label>{{ $t('sort') }}</template>
					<option value="-createdAt">{{ $t('registeredDate') }} ({{ $t('ascendingOrder') }})</option>
					<option value="+createdAt">{{ $t('registeredDate') }} ({{ $t('descendingOrder') }})</option>
					<option value="-updatedAt">{{ $t('lastUsed') }} ({{ $t('ascendingOrder') }})</option>
					<option value="+updatedAt">{{ $t('lastUsed') }} ({{ $t('descendingOrder') }})</option>
				</mk-select>
				<mk-select v-model="state" style="margin: 0; flex: 1;">
					<template #label>{{ $t('state') }}</template>
					<option value="all">{{ $t('all') }}</option>
					<option value="available">{{ $t('normal') }}</option>
					<option value="admin">{{ $t('administrator') }}</option>
					<option value="moderator">{{ $t('moderator') }}</option>
					<option value="silenced">{{ $t('silence') }}</option>
					<option value="suspended">{{ $t('suspend') }}</option>
				</mk-select>
				<mk-select v-model="origin" style="margin: 0; flex: 1;">
					<template #label>{{ $t('instance') }}</template>
					<option value="combined">{{ $t('all') }}</option>
					<option value="local">{{ $t('local') }}</option>
					<option value="remote">{{ $t('remote') }}</option>
				</mk-select>
			</div>
			<div class="inputs" style="display: flex; padding-top: 1.2em;">
				<mk-input v-model="searchUsername" style="margin: 0; flex: 1;" type="text" spellcheck="false" @input="$refs.users.reload()">
					<span>{{ $t('username') }}</span>
				</mk-input>
				<mk-input v-model="searchHost" style="margin: 0; flex: 1;" type="text" spellcheck="false" @input="$refs.users.reload()" :disabled="pagination.params().origin === 'local'">
					<span>{{ $t('host') }}</span>
				</mk-input>
			</div>
		</div>
		<div class="_content _list">
			<mk-pagination :pagination="pagination" #default="{items}" class="users" ref="users" :auto-margin="false">
				<button class="user _button _listItem" v-for="(user, i) in items" :key="user.id" @click="show(user)">
					<mk-avatar class="avatar" :user="user" :disable-link="true"/>
					<div class="body">
						<header>
							<mk-user-name class="name" :user="user"/>
							<span class="acct">@{{ acct(user) }}</span>
							<span class="staff" v-if="user.isAdmin"><fa :icon="faBookmark"/></span>
							<span class="staff" v-if="user.isModerator"><fa :icon="farBookmark"/></span>
							<span class="punished" v-if="user.isSilenced"><fa :icon="faMicrophoneSlash"/></span>
							<span class="punished" v-if="user.isSuspended"><fa :icon="faSnowflake"/></span>
						</header>
						<div>
							<span>{{ $t('lastUsed') }}: <mk-time :time="user.updatedAt" mode="detail"/></span>
						</div>
						<div>
							<span>{{ $t('registeredDate') }}: <mk-time :time="user.createdAt" mode="detail"/></span>
						</div>
					</div>
				</button>
			</mk-pagination>
		</div>
		<div class="_footer">
			<mk-button inline primary @click="addUser()"><fa :icon="faPlus"/> {{ $t('addUser') }}</mk-button>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faUsers, faSearch, faBookmark, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import { faSnowflake, faBookmark as farBookmark } from '@fortawesome/free-regular-svg-icons';
import parseAcct from '../../../misc/acct/parse';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import MkSelect from '../../components/ui/select.vue';
import MkPagination from '../../components/ui/pagination.vue';
import MkUserSelect from '../../components/user-select.vue';
import { acct } from '../../filters/user';

export default defineComponent({
	metaInfo() {
		return {
			title: `${this.$t('users')} | ${this.$t('instance')}`
		};
	},

	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkPagination,
	},

	data() {
		return {
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
				const usernamePromise = this.$root.api('users/show', parseAcct(this.target));
				const idPromise = this.$root.api('users/show', { userId: this.target });
				let _notFound = false;
				const notFound = () => {
					if (_notFound) {
						this.$root.dialog({
							type: 'error',
							text: this.$t('noSuchUser')
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
			this.$root.new(MkUserSelect, {}).$once('selected', user => {
				this.show(user);
			});
		},

		async addUser() {
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

			const dialog = this.$root.dialog({
				type: 'waiting',
				iconOnly: true
			});

			this.$root.api('admin/accounts/create', {
				username: username,
				password: password,
			}).then(res => {
				this.$refs.users.reload();
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.id
				});
			}).finally(() => {
				dialog.close();
			});
		},

		async show(user) {
			this.$router.push('./users/' + user.id);
		},

		acct
	}
});
</script>

<style lang="scss" scoped>
.mk-instance-users {
	> .users {
		> ._content {
			max-height: 300px;
			overflow: auto;

			> .users {
				> .user {
					display: flex;
					width: 100%;
					box-sizing: border-box;
					text-align: left;
					align-items: center;

					> .avatar {
						width: 64px;
						height: 64px;
					}

					> .body {
						margin-left: 0.3em;
						padding: 8px;
						flex: 1;

						@media (max-width 500px) {
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
