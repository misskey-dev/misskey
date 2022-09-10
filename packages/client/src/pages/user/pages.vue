<template>
<div>
	<MkPagination v-slot="{items}" ref="list" :pagination="pagination">
		<MkPagePreview v-for="page in items" :key="page.id" :page="page" class="_gap"/>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as misskey from 'misskey-js';
import MkPagePreview from '@/components/MkPagePreview.vue';
import MkPagination from '@/components/MkPagination.vue';

const props = defineProps<{
	user: misskey.entities.User;
}>();

const pagination = {
	endpoint: 'users/pages' as const,
	limit: 20,
	params: computed(() => ({
		userId: props.user.id,
	})),
};
</script>

<style lang="scss" scoped>

</style>
