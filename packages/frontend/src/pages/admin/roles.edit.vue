<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<XEditor v-if="data" v-model="data"/>
	</div>
	<template #footer>
		<div :class="$style.footer">
			<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px; --MI_SPACER-max: 16px;">
				<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XEditor from './roles.editor.vue';
import { genId } from '@/utility/id.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkButton from '@/components/MkButton.vue';
import { rolesCache } from '@/cache.js';
import { useRouter } from '@/router.js';

const router = useRouter();

const props = defineProps<{
	id?: string;
}>();

type RoleLike = Pick<Misskey.entities.Role, 'name' | 'description' | 'isAdministrator' | 'isModerator' | 'color' | 'iconUrl' | 'target' | 'isPublic' | 'isExplorable' | 'asBadge' | 'canEditMembersByModerator' | 'displayOrder' | 'preserveAssignmentOnMoveAccount'> & {
	condFormula: any;
	policies: any;
};

const role = ref<Misskey.entities.Role | null>(null);
const data = ref<RoleLike | null>(null);

if (props.id) {
	role.value = await misskeyApi('admin/roles/show', {
		roleId: props.id,
	});

	data.value = role.value;
} else {
	data.value = {
		name: 'New Role',
		description: '',
		isAdministrator: false,
		isModerator: false,
		color: null,
		iconUrl: null,
		target: 'manual',
		condFormula: { id: genId(), type: 'isRemote' },
		isPublic: false,
		isExplorable: false,
		asBadge: false,
		canEditMembersByModerator: false,
		displayOrder: 0,
		preserveAssignmentOnMoveAccount: false,
		policies: {},
	};
}

async function save() {
	if (data.value === null) return;
	rolesCache.delete();
	if (role.value) {
		os.apiWithDialog('admin/roles/update', {
			roleId: role.value.id,
			...data.value,
		});
		router.push('/admin/roles/:id', {
			params: {
				id: role.value.id,
			},
		});
	} else {
		const created = await os.apiWithDialog('admin/roles/create', {
			...data.value,
		});
		router.push('/admin/roles/:id', {
			params: {
				id: created.id,
			},
		});
	}
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: role.value ? `${i18n.ts._role.edit}: ${role.value.name}` : i18n.ts._role.new,
	icon: 'ti ti-badge',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>
