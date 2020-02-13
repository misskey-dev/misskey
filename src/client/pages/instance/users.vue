<template>
<div class="mk-instance-users">
	<portal to="icon"><fa :icon="faUsers"/></portal>
	<portal to="title">{{ $t('users') }}</portal>

	<section class="_card lookup">
		<div class="_title"><fa :icon="faSearch"/> {{ $t('lookup') }}</div>
		<div class="_content">
			<mk-input class="target" v-model="target" type="text" @enter="showUser()">
				<span>{{ $t('usernameOrUserId') }}</span>
			</mk-input>
			<mk-button @click="showUser()" primary><fa :icon="faSearch"/> {{ $t('lookup') }}</mk-button>
		</div>
		<div class="_footer">
			<mk-button inline primary @click="search()"><fa :icon="faSearch"/> {{ $t('search') }}</mk-button>
		</div>
	</section>

	<section class="_card users">
		<div class="_title"><fa :icon="faUsers"/> {{ $t('users') }}</div>
		<div class="_content _list">
			<mk-pagination :pagination="pagination" #default="{items}" class="users" ref="users" :auto-margin="false">
				<button class="user _button _listItem" v-for="(user, i) in items" :key="user.id" @click="show(user)">
					<mk-avatar :user="user" class="avatar"/>
					<div class="body">
						<mk-user-name :user="user" class="name"/>
						<mk-acct :user="user" class="acct"/>
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
import Vue from 'vue';
import { faPlus, faUsers, faSearch } from '@fortawesome/free-solid-svg-icons';
import parseAcct from '../../../misc/acct/parse';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import MkPagination from '../../components/ui/pagination.vue';
import MkUserModerateDialog from '../../components/user-moderate-dialog.vue';
import MkUserSelect from '../../components/user-select.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: `${this.$t('users')} | ${this.$t('instance')}`
		};
	},

	components: {
		MkButton,
		MkInput,
		MkPagination,
	},

	data() {
		return {
			pagination: {
				endpoint: 'admin/show-users',
				limit: 10,
				offsetMode: true
			},
			target: '',
			faPlus, faUsers, faSearch
		}
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
			this.$root.api('admin/show-user', { userId: user.id }).then(info => {
				this.show(user, info);
			});
			this.target = '';
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

		async show(user, info) {
			if (info == null) info = await this.$root.api('admin/show-user', { userId: user.id });
			this.$root.new(MkUserModerateDialog, {
				user: { ...user, ...info }
			});
		},

		search() {
			this.$root.new(MkUserSelect, {}).$once('selected', user => {
				this.$root.api('admin/show-user', { userId: user.id }).then(info => {
					this.show(user, info);
				});
			});
		}
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
						width: 50px;
						height: 50px;
					}

					> .body {
						padding: 8px;

						> .name {
							display: block;
							font-weight: bold;
						}

						> .acct {
							opacity: 0.5;
						}
					}
				}
			}
		}
	}
}
</style>
