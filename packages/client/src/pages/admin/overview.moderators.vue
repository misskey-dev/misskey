<template>
<div>
	<MkLoading v-if="fetching"/>
	<div v-else :class="$style.root">
		<MkA v-for="user in moderators" :key="user.id" v-user-preview="user.id" class="user" :to="`/user-info/${user.id}`">
			<MkAvatar :user="user" class="avatar" :show-indicator="true" :disable-link="true"/>
		</MkA>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as os from '@/os';
import number from '@/filters/number';
import { i18n } from '@/i18n';

let moderators: any = $ref(null);
let fetching = $ref(true);

onMounted(async () => {
	moderators = await os.api('admin/show-users', {
		sort: '+lastActiveDate',
		state: 'adminOrModerator',
		limit: 30,
	});

	fetching = false;
});
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(30px, 40px));
	grid-gap: 12px;
	place-content: center;

	&:global {
		> .user {
			width: 100%;
			height: 100%;
			aspect-ratio: 1;

			> .avatar {
				width: 100%;
				height: 100%;
			}
		}
	}
}
</style>
