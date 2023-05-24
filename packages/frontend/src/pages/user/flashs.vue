<template>
<MkStickyContainer>
	<MkSpacer :contentMax="700">
		<div class="_gaps">
			<MkPagination v-slot="{ items }" :pagination="pagination">
				<div class="_gaps_s">
					<MkFlashPreview v-for="flash in items" :key="flash.id" :flash="flash"/>
				</div>
			</MkPagination>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import MkStickyContainer from '@/components/global/MkStickyContainer.vue';
import MkSpacer from '@/components/global/MkSpacer.vue';
import MkFlashPreview from '@/components/MkFlashPreview.vue';

const props = defineProps<{
	user: misskey.entities.UserDetailed;
}>();

const pagination = {
	endpoint: 'flash/list' as const,
	params: {
		userId: props.user.id,
	},
	limit: 10,
};
</script>
