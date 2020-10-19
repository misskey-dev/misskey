<template>
<div class="mk-list-page">
	<transition name="zoom" mode="out-in">
		<div v-if="list" class="_section">
			<div class="_content">
				<MkButton inline @click="addUser()">{{ $t('addUser') }}</MkButton>
				<MkButton inline @click="renameList()">{{ $t('rename') }}</MkButton>
				<MkButton inline @click="deleteList()">{{ $t('delete') }}</MkButton>
			</div>
		</div>
	</transition>

	<transition name="zoom" mode="out-in">
		<div v-if="list" class="_section members _vMargin">
			<div class="_title">{{ $t('members') }}</div>
			<div class="_content">
				<div class="users">
					<div class="user _panel" v-for="user in users" :key="user.id">
						<MkAvatar :user="user" class="avatar"/>
						<div class="body">
							<MkUserName :user="user" class="name"/>
							<MkAcct :user="user" class="acct"/>
						</div>
						<div class="action">
							<button class="_button" @click="removeUser(user)"><Fa :icon="faTimes"/></button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faTimes, faListUl } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton
	},

	data() {
		return {
			INFO: computed(() => this.list ? {
				header: [{
					title: this.list.name,
					icon: faListUl,
				}],
			} : null),
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
			os.selectUser().then(user => {
				os.apiWithDialog('users/lists/push', {
					listId: this.list.id,
					userId: user.id
				}).then(() => {
					this.users.push(user);
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
			os.success();
			this.$router.push('/my/lists');
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-list-page {
	> .members {
		> ._content {
			> .users {
				> .user {
					display: flex;
					align-items: center;
					padding: 16px;

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
