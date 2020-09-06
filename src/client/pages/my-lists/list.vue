<template>
<div class="mk-list-page">
	<portal to="header"><fa :icon="faListUl"/>{{ list.name }}</portal>

	<transition name="zoom" mode="out-in">
		<div v-if="list" class="_card _vMargin">
			<div class="_content">
				<mk-button inline @click="renameList()">{{ $t('rename') }}</mk-button>
				<mk-button inline @click="deleteList()">{{ $t('delete') }}</mk-button>
			</div>
		</div>
	</transition>

	<transition name="zoom" mode="out-in">
		<div v-if="list" class="_card members _vMargin">
			<div class="_title">{{ $t('members') }}</div>
			<div class="_content">
				<div class="users">
					<div class="user" v-for="user in users" :key="user.id">
						<mk-avatar :user="user" class="avatar"/>
						<div class="body">
							<mk-user-name :user="user" class="name"/>
							<mk-acct :user="user" class="acct"/>
						</div>
						<div class="action">
							<button class="_button" @click="removeUser(user)"><fa :icon="faTimes"/></button>
						</div>
					</div>
				</div>
			</div>
			<div class="_footer">
				<mk-button inline @click="addUser()">{{ $t('addUser') }}</mk-button>
			</div>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTimes, faListUl } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import MkButton from '@/components/ui/button.vue';
import MkUserSelect from '@/components/user-select.vue';
import * as os from '@/os';

export default defineComponent({
	metaInfo() {
		return {
			title: this.list ? `${this.list.name} | ${this.$t('manageLists')}` : this.$t('manageLists')
		};
	},

	components: {
		MkButton
	},

	data() {
		return {
			list: null,
			users: [],
			faTimes, faListUl
		};
	},

	watch: {
		$route: 'fetch'
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			Progress.start();
			os.api('users/lists/show', {
				listId: this.$route.params.list
			}).then(list => {
				this.list = list;
				os.api('users/show', {
					userIds: this.list.userIds
				}).then(users => {
					this.users = users;
					Progress.done();
				});
			});
		},

		addUser() {
			this.$root.new(MkUserSelect, {}).$once('selected', user => {
				os.api('users/lists/push', {
					listId: this.list.id,
					userId: user.id
				}).then(() => {
					this.users.push(user);
					os.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				}).catch(e => {
					os.dialog({
						type: 'error',
						text: e
					});
				});
			});
		},

		removeUser(user) {
			os.api('users/lists/pull', {
				listId: this.list.id,
				userId: user.id
			}).then(() => {
				this.users = this.users.filter(x => x.id !== user.id);
			});
		},

		async renameList() {
			const { canceled, result: name } = await os.dialog({
				title: this.$t('enterListName'),
				input: {
					default: this.list.name
				}
			});
			if (canceled) return;

			await os.api('users/lists/update', {
				listId: this.list.id,
				name: name
			});

			this.list.name = name;
		},

		async deleteList() {
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.list.name }),
				showCancelButton: true
			});
			if (canceled) return;

			await os.api('users/lists/delete', {
				listId: this.list.id
			});
			os.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
			this.$router.push('/my/lists');
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-list-page {
	> .members {
		> ._content {
			max-height: 400px;
			overflow: auto;

			> .users {
				> .user {
					display: flex;
					align-items: center;

					> .avatar {
						width: 50px;
						height: 50px;
					}

					> .body {
						flex: 1;
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
