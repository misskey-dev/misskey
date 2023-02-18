<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="600">
			<XEditor :role="role" @created="created" @updated="updated"/>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XHeader from './_header_.vue';
import XEditor from './roles.editor.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { useRouter } from '@/router';

const router = useRouter();

const props = defineProps<{
	id?: string;
}>();

let role = $ref(null);

if (props.id) {
	role = await os.api('admin/roles/show', {
		roleId: props.id,
	});
}

function created(r) {
	router.push('/admin/roles/' + r.id);
}

function updated() {
	router.push('/admin/roles/' + role.id);
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => role ? {
	title: i18n.ts._role.edit + ': ' + role.name,
	icon: 'ti ti-badge',
} : {
	title: i18n.ts._role.new,
	icon: 'ti ti-badge',
}));
</script>

<style lang="scss" module>

</style>
