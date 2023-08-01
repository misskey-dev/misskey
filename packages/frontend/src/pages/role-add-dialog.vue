/*
 * SPDX-FileCopyrightText: lqvp
 * SPDX-License-Identifier: AGPL-3.0-only
 */

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	@close="dialog.close()"
	@closed="$emit('closed')"
>
	<template v-if="!props.role" #header>
		<div :class="$style.header">
			<span>{{ i18n.ts.roles }}<span class="_beta">{{ i18n.ts.originalFeature }}</span></span>
			<XTabs :class="$style.tabs" :rootEl="dialog" :tab="tab" :tabs="headerTabs" @update:tab="key => tab = key"/>
		</div>
	</template>
	<template v-else #header>{{ i18n.ts.changes }}</template>

	<div v-if="tab === 'add'">
		<MkSpacer :marginMin="20" :marginMax="28">
			<div class="_gaps_m">
				<div v-if="iconUrl != null" :class="$style.imgs">
					<div :class="$style.imgContainer">
						<img :src="iconUrl" :class="$style.img"/>
					</div>
				</div>
				<MkButton rounded style="margin: 0 auto;" @click="changeImage">{{ i18n.ts.selectFile }}</MkButton>
				<MkInput v-model="name">
					<template #label>{{ i18n.ts.name }}</template>
				</MkInput>
				<MkTextarea v-model="description">
					<template #label>{{ i18n.ts.description }}</template>
				</MkTextarea>
				<MkColorInput v-model="color">
					<template #label>{{ i18n.ts.color }}</template>
				</MkColorInput>
				<MkSwitch v-model="isPublic">{{ i18n.ts._role.isPublic }}</MkSwitch>
			</div>
		</MkSpacer>
		<div :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done"><i class="ti ti-check"></i> {{ props.role ? i18n.ts.update : i18n.ts.create }}</MkButton>
		</div>
	</div>

	<div v-else-if="tab === 'manage'">
		<MkSpacer :marginMin="20" :marginMax="28">
			<div class="_gaps_m">
				<div class="_gaps_s">
					<MkFoldableSection>
						<template #header>Assigned roles</template>
						<div class="_gaps_s">
							<DialogRole v-for="role in rolesAssigned" :key="role.id" :role="role" :isAssigned="true"/>
						</div>
					</MkFoldableSection>
					<MkFoldableSection>
						<template #header>Assignable roles</template>
						<div class="_gaps_s">
							<DialogRole v-for="role in roles" :key="role.id" :role="role" :isAssigned="false"/>
						</div>
					</MkFoldableSection>
				</div>
			</div>
		</MkSpacer>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onMounted, computed, ref, watch } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import MkSwitch from '@/components/MkSwitch.vue';
import { selectFile } from '@/utility/select-file.js';
import XTabs from '@/components/global/MkPageHeader.tabs.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkColorInput from '@/components/MkColorInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import DialogRole from '@/pages/DialogRole.vue';
import { misskeyApi } from '@/utility/misskey-api.js';

const props = defineProps<{
	role?: any,
}>();

const dialog = ref(null);
const name = ref(props.role ? props.role.name : '');
const description = ref(props.role ? props.role.description : '');
const color = ref(props.role ? props.role.color : '#000000');
const isPublic = ref(props.role ? props.role.isPublic : false);

const iconId = ref(props.role ? props.role.iconId : null);
const iconUrl = ref(props.role ? props.role.iconUrl : null);

let assignedList = [];
let roleList = [];

const rolesAssigned = computed(() => assignedList);
const roles = computed(() => roleList);

watch(() => iconId.value, async () => {
	if (iconId.value == null) {
		iconUrl.value = null;
	} else {
		try {
			const file = await misskeyApi('drive/files/show', {
				fileId: iconId.value,
			});
			iconUrl.value = file.url;
		} catch (err) {
			console.error('Failed to fetch file:', err);
			iconUrl.value = null;
		}
	}
});

onMounted(async () => {
	assignedList = await misskeyApi('roles/list', {
		assignedOnly: true,
	});
	roleList = await misskeyApi('roles/list', {
		communityPublicOnly: true,
	}).then(v => v.filter(r => !assignedList.some(ra => r.id === ra.id)));
});

const tab = ref('add');
const headerTabs = computed(() => [{
	key: 'add',
	title: i18n.ts.add,
}, {
	key: 'manage',
	title: i18n.ts.manage,
}]);

const emit = defineEmits<{
	(ev: 'done', v: { deleted?: boolean; updated?: any; created?: any }): void,
	(ev: 'closed'): void
}>();

async function changeImage(ev) {
	try {
		const file = await selectFile(ev.currentTarget ?? ev.target, null);
		if (file != null) {
			iconId.value = file.id;
			iconUrl.value = file.url;
		}
	} catch (err) {
		console.error('Failed to select file:', err);
		os.alert({
			type: 'error',
			text: i18n.ts.failedToLoad,
		});
	}
}

async function done() {
	if (!name.value?.trim()) {
		os.alert({
			type: 'error',
			text: i18n.ts.inputRequired,
		});
		return;
	}

	const params = {
		name: name.value,
		description: description.value,
		iconUrl: iconUrl.value, // ← ここを修正
		color: color.value,
		isPublic: isPublic.value,
	};

	try {
		if (props.role) {
			await os.apiWithDialog('roles/update', {
				roleId: props.role.id,
				...params,
			});

			emit('done', {
				updated: {
					roleId: props.role.id,
					...params,
				},
			});
		} else {
			const created = await os.apiWithDialog('roles/add', params);

			emit('done', {
				created: created,
			});
		}

		if (dialog.value) dialog.value.close();
	} catch (err) {
		console.error('API error:', err);
	}
}
</script>

	<style lang="scss" module>

	.header {
		display: flex;
		gap: 10px;
	}

	.imgs {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.imgContainer {
		padding: 8px;
		border-radius: 6px;
	}

	.img {
		display: block;
		height: 64px;
		width: 64px;
		object-fit: contain;
	}

	.roleItem {
		display: flex;
	}

	.role {
		flex: 1;
	}

	.roleUnassign {
		width: 32px;
		height: 32px;
		margin-left: 8px;
		align-self: center;
	}

	.footer {
		position: sticky;
		bottom: 0;
		left: 0;
		padding: 12px;
		border-top: solid 0.5px var(--divider);
		-webkit-backdrop-filter: var(--blur, blur(15px));
		backdrop-filter: var(--blur, blur(15px));
	}

	// profile.vueからの流用
	.metadataRoot {
		container-type: inline-size;
	}

	.metadataMargin {
		margin-bottom: 1.5em;
	}

	.aliaseDragItem {
		display: flex;
		padding-bottom: .75em;
		align-items: flex-end;
		border-bottom: solid 0.5px var(--divider);

		&:last-child {
			border-bottom: 0;
		}

		/* (drag button) 32px + (drag button margin) 8px + (input width) 200px * 2 + (input gap) 12px = 452px */
		@container (max-width: 452px) {
			align-items: center;
		}
	}

	.dragItemHandle {
		cursor: grab;
		width: 32px;
		height: 32px;
		margin: 0 8px 0 0;
		opacity: 0.5;
		flex-shrink: 0;

		&:active {
			cursor: grabbing;
		}
	}

	.dragItemRemove {
		@extend .dragItemHandle;

		color: #ff2a2a;
		opacity: 1;
		cursor: pointer;

		&:hover, &:focus {
			opacity: .7;
		}
		&:active {
			cursor: pointer;
		}
	}

	.dragItemForm {
		flex-grow: 1;
	}

	.tabs:first-child {
		margin-left: auto;
		padding: 0 12px;
	}
	.tabs {
		pointer-events: auto;
		margin-right: auto;
	}
	</style>
