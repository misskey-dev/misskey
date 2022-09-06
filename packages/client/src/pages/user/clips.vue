<template>
<div>
	<MkPagination v-slot="{items}" ref="list" :pagination="pagination">
		<MkA v-for="item in items" :key="item.id" :to="`/clips/${item.id}`" class="item _panel _gap">
			<b>{{ item.name }}</b>
			<div v-if="item.description" class="description">{{ item.description }}</div>
		</MkA>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';

const props = defineProps<{
	user: misskey.entities.User;
}>();

const pagination = {
	endpoint: 'users/clips' as const,
	limit: 20,
	params: computed(() => ({
		userId: props.user.id,
	})),
};
</script>

<style lang="scss" scoped>

</style>
