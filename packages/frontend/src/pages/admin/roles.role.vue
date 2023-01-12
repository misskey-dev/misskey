<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :content-max="900">
			<div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XHeader from './_header_.vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkPagination from '@/components/MkPagination.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { dateString } from '@/filters/date';
import { useRouter } from '@/router';

const router = useRouter();

const props = defineProps<{
	id?: string;
}>();

const role = await os.api('admin/roles/show', {
	roleId: props.id,
});

console.log(role);

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: i18n.ts.role + ': ' + role.name,
	icon: 'ti ti-badge',
})));
</script>

<style lang="scss" module>

</style>
