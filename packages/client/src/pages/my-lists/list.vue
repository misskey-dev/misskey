<template>
<MkSpacer :content-max="700">
	<div class="mk-list-page">
		<transition :name="$store.state.animation ? 'zoom' : ''" mode="out-in">
			<div v-if="list" class="_section">
				<div class="_content">
					<MkButton inline @click="addUser()">{{ $ts.addUser }}</MkButton>
					<MkButton inline @click="renameList()">{{ $ts.rename }}</MkButton>
					<MkButton inline @click="deleteList()">{{ $ts.delete }}</MkButton>
				</div>
			</div>
		</transition>

		<transition :name="$store.state.animation ? 'zoom' : ''" mode="out-in">
			<div v-if="list" class="_section members _gap">
				<div class="_title">{{ $ts.members }}</div>
				<div class="_content">
					<div class="users">
						<div v-for="user in users" :key="user.id" class="user _panel">
							<MkAvatar :user="user" class="avatar" :show-indicator="true"/>
							<div class="body">
								<MkUserName :user="user" class="name"/>
								<MkAcct :user="user" class="acct"/>
							</div>
							<div class="action">
								<button class="_button" @click="removeUser(user)"><i class="fas fa-times"></i></button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</transition>
	</div>
</MkSpacer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkButton
	},

	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => this.list ? {
				title: this.list.name,
				icon: 'fas fa-list-ul',
				bg: 'var(--bg)',
			} : null),
			list: null,
			users: [],
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
			os.api('users/lists/show', {
				listId: this.$route.params.list
			}).then(list => {
				this.list = list;
				os.api('users/show', {
					userIds: this.list.userIds
				}).then(users => {
					this.users = users;
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
			const { canceled, result: name } = await os.inputText({
				title: this.$ts.enterListName,
				default: this.list.name
			});
			if (canceled) return;

			await os.api('users/lists/update', {
				listId: this.list.id,
				name: name
			});

			this.list.name = name;
		},

		async deleteList() {
			const { canceled } = await os.confirm({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.list.name }),
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
