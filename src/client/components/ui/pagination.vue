<template>
<transition name="fade" mode="out-in">
	<MkLoading v-if="fetching"/>

	<MkError v-else-if="error" @retry="init()"/>

	<div class="empty" v-else-if="empty" key="_empty_">
		<slot name="empty"></slot>
	</div>

	<div v-else class="cxiknjgy">
		<slot :items="items"></slot>
		<div class="more _gap" v-show="more" key="_more_">
			<MkButton class="button" v-appear="($store.state.enableInfiniteScroll && !disableAutoLoad) ? fetchMore : null" @click="fetchMore" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary>
				<template v-if="!moreFetching">{{ $ts.loadMore }}</template>
				<template v-if="moreFetching"><MkLoading inline/></template>
			</MkButton>
		</div>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from './button.vue';
import paging from '@client/scripts/paging';

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

		disableAutoLoad: {
			type: Boolean,
			required: false,
			default: false,
		}
	},
});
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.cxiknjgy {
	> .more > .button {
		margin-left: auto;
		margin-right: auto;
		height: 48px;
		min-width: 150px;
	}
}
</style>
