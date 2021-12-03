<template>
<FormSlot>
	<template #label><slot name="label"></slot></template>
	<div class="abcaccfa">
		<slot :items="items"></slot>
		<div v-if="empty" key="_empty_" class="empty">
			<slot name="empty"></slot>
		</div>
		<MkButton v-show="more" class="button" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" @click="fetchMore">
			<template v-if="!moreFetching">{{ $ts.loadMore }}</template>
			<template v-if="moreFetching"><MkLoading inline/></template>
		</MkButton>
	</div>
</FormSlot>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import FormSlot from './slot.vue';
import paging from '@/scripts/paging';

export default defineComponent({
	components: {
		MkButton,
		FormSlot,
	},

	mixins: [
		paging({}),
	],

	props: {
		pagination: {
			required: true
		},
	},
});
</script>

<style lang="scss" scoped>
.abcaccfa {
}
</style>
