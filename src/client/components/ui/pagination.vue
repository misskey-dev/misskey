<template>
<div class="cxiknjgy">
	<slot :items="items"></slot>
	<div class="empty" v-if="empty" key="_empty_">
		<slot name="empty"></slot>
	</div>
	<div class="more" v-show="more" key="_more_">
		<MkButton class="button" v-appear="$store.state.device.enableInfiniteScroll ? fetchMore : null" @click="fetchMore" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary>
			<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
			<template v-if="moreFetching"><MkLoading inline/></template>
		</MkButton>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from './button.vue';
import paging from '@/scripts/paging';

export default defineComponent({
	components: {
		MkButton
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
.cxiknjgy {
	> .more > .button {
		margin-left: auto;
		margin-right: auto;
		height: 48px;
		min-width: 150px;
	}
}
</style>
