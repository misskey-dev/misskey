<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions"/></template>
	<div class="mk-group-page">
		<div class="_section members _gap">
			<div class="_content">
				<div class="users">
					<div v-for="user in users" :key="user.id" class="user _panel">
						<MkAvatar :user="user" class="avatar" :show-indicator="true" />
						<div class="body">
							<MkUserName :user="user" class="name" />
							<MkAcct :user="user" class="acct" />
						</div>
						<div class="action">
							<button class="_button" @click="removeUser(user)">
								<i class="fas fa-times"></i>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { definePageMetadata } from "@/scripts/page-metadata";
import { i18n } from "@/i18n";
import { useRouter } from "@/router";
import * as os from "@/os";

const props = defineProps<{
	groupId: {
		type: string;
		required: true;
	};
}>();

const users = ref<any[]>([]);
const group = ref<any>();

const router = useRouter();

watch(
	() => props.groupId,
	() => {
		fetch();
	}
);

async function fetch() {
	os.api("users/groups/show", {
		groupId: props.groupId,
	}).then((gp) => {
		group.value = gp;
		os.api("users/show", {
			userIds: group.value.userIds,
		}).then((us) => {
			users.value = us;
		});
	});
}

fetch();

function invite() {
	os.selectUser().then((user) => {
		os.apiWithDialog("users/groups/invite", {
			groupId: group.value.id,
			userId: user.id,
		});
	});
}

function removeUser(user) {
	os.api("users/groups/pull", {
		groupId: group.value.id,
		userId: user.id,
	}).then(() => {
		users.value = users.value.filter((x) => x.id !== user.id);
	});
}

async function renameGroup() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.groupName,
		default: group.value.name,
	});
	if (canceled) return;

	await os.api("users/groups/update", {
		groupId: group.value.id,
		name: name,
	});

	group.value.name = name;
}

function transfer() {
	os.selectUser().then((user) => {
		os.apiWithDialog("users/groups/transfer", {
			groupId: group.value.id,
			userId: user.id,
		});
	});
}

async function deleteGroup() {
	const { canceled } = await os.confirm({
		type: "warning",
		text: i18n.t("removeAreYouSure", { x: group.value.name }),
	});
	if (canceled) return;

	await os.apiWithDialog("users/groups/delete", {
		groupId: group.value.id,
	});
	router.push("/my/groups");
}

definePageMetadata(
	computed(() => ({
		title: i18n.ts.members,
		icon: "fas fa-users",
	})),
);

const headerActions = $computed(() => [
	{
		icon: 'fas fa-plus',
		text: i18n.ts.invite,
		handler: invite,
	}, {
		icon: 'fas fa-i-cursor',
		text: i18n.ts.rename,
		handler: renameGroup,
	}, {
		icon: 'fas fa-right-left',
		text: i18n.ts.transfer,
		handler: transfer,
	}, {
		icon: 'fas fa-trash-alt',
		text: i18n.ts.delete,
		handler: deleteGroup,
	},
]);

</script>

<style lang="scss" scoped>
.mk-group-page {
	> .members {
		> ._content {
			> .users {
				> ._panel {
					margin: 1rem 2rem;
				}
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
