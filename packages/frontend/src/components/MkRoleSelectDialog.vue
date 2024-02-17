<template>
<MkWindow
	ref="windowEl"
	:initialWidth="400"
	:initialHeight="500"
	:canResize="false"
	@close="windowEl?.close()"
	@closed="$emit('closed')"
>
	<template #header>{{ title }}</template>
	<MkSpacer :marginMin="20" :marginMax="28">
		<div class="_gaps">
			<div :class="$style.header">
				<MkButton rounded @click="addRole"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
			</div>

			<div>
				<div v-if="selectedRoles.length > 0" class="_gaps" :class="$style.roleItemArea">
					<div v-for="role in selectedRoles" :key="role.id" :class="$style.roleItem">
						<MkRolePreview :class="$style.role" :role="role" :forModeration="true" :detailed="false" style="pointer-events: none;"/>
						<button v-if="role.target === 'manual'" class="_button" :class="$style.roleUnAssign" @click="removeRole(role.id)"><i class="ti ti-x"></i></button>
						<button v-else class="_button" :class="$style.roleUnAssign" disabled><i class="ti ti-ban"></i></button>
					</div>
				</div>
				<div v-else :class="$style.roleItemArea" style="text-align: center">
					何も選択されていません
				</div>
			</div>

			<MkInfo v-if="infoMessage">{{ infoMessage }}</MkInfo>

			<div :class="$style.buttons">
				<MkButton primary @click="onOkClicked">{{ i18n.ts.ok }}</MkButton>
				<MkButton @click="onCancelClicked">{{ i18n.ts.cancel }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkWindow>
</template>

<script setup lang="ts">
import { computed, defineProps, ref, toRefs } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkRolePreview from '@/components/MkRolePreview.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import Section from '@/components/form/section.vue';
import * as os from '@/os.js';
import MkWindow from '@/components/MkWindow.vue';
import MkSpacer from '@/components/global/MkSpacer.vue';

const emit = defineEmits<{
	(ev: 'done', value: Misskey.entities.Role[]),
	(ev: 'closed'),
}>();

const props = withDefaults(defineProps<{
	initialRoleIds?: string[],
	infoMessage?: string,
	title?: string,
	publicOnly: boolean,
}>(), {
	initialRoleIds: undefined,
	infoMessage: undefined,
	title: undefined,
	publicOnly: true,
});

const { initialRoleIds, infoMessage, title, publicOnly } = toRefs(props);

const windowEl = ref<InstanceType<typeof MkWindow>>();
const roles = ref<Misskey.entities.Role[]>([]);
const selectedRoleIds = ref<string[]>(initialRoleIds.value ?? []);

const selectedRoles = computed(() => {
	const r = roles.value.filter(role => selectedRoleIds.value.includes(role.id));
	r.sort((a, b) => {
		if (a.displayOrder !== b.displayOrder) {
			return b.displayOrder - a.displayOrder;
		}

		return a.id.localeCompare(b.id);
	});
	return r;
});

async function fetchRoles() {
	const result = await misskeyApi('admin/roles/list', {});
	roles.value = result.filter(it => publicOnly.value ? it.isPublic : true);
}

async function addRole() {
	const items = roles.value
		.filter(r => r.isPublic)
		.filter(r => !selectedRoleIds.value.includes(r.id))
		.map(r => ({ text: r.name, value: r }));

	const { canceled, result: role } = await os.select({ items });
	if (canceled) {
		return;
	}

	selectedRoleIds.value.push(role.id);
}

async function removeRole(roleId: string) {
	selectedRoleIds.value = selectedRoleIds.value.filter(x => x !== roleId);
}

function onOkClicked() {
	emit('done', selectedRoles.value);
	windowEl.value?.close();
}

function onCancelClicked() {
	emit('closed');
}

fetchRoles();
</script>

<style module lang="scss">
.roleItemArea {
	background-color: var(--acrylicBg);
	border-radius: var(--radius);
	padding: 12px;
}

.roleItem {
	display: flex;
}

.role {
	flex: 1;
}

.roleUnAssign {
	width: 32px;
	height: 32px;
	margin-left: 8px;
	align-self: center;
}

.header {
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.title {
	flex: 1;
}

.addRoleButton {
	min-width: 32px;
	min-height: 32px;
	max-width: 32px;
	max-height: 32px;
	margin-left: 8px;
	align-self: center;
	padding: 0;
}

.buttons {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
}

.divider {
	border-top: solid 0.5px var(--divider);
}

</style>
