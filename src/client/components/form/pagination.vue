<template>
<FormGroup class="uljviswt _formItem">
	<template #label><slot name="label"></slot></template>
	<slot :items="items"></slot>
	<div class="empty" v-if="empty" key="_empty_">
		<slot name="empty"></slot>
	</div>
	<FormButton v-show="more" class="button" @click="fetchMore" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary>
		<template v-if="!moreFetching">{{ $ts.loadMore }}</template>
		<template v-if="moreFetching"><MkLoading inline/></template>
	</FormButton>
</FormGroup>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormButton from './button.vue';
import FormGroup from './group.vue';
import paging from '@client/scripts/paging';

export default defineComponent({
	components: {
		FormButton,
		FormGroup,
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
.uljviswt {
}
</style>
