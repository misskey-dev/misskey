<template>
<div class="cxiknjgy" :class="{ autoMargin }">
	<slot :items="items"></slot>
	<div class="empty" v-if="empty" key="_empty_">
		<slot name="empty"></slot>
	</div>
	<div class="more" v-show="more" key="_more_">
		<intersect @enter="() => !moreFetching && $store.state.device.enableInfiniteScroll && fetchMore()">
			<mk-button class="button" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" @click="fetchMore()" primary>
				<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
				<template v-if="moreFetching"><mk-loading inline/></template>
			</mk-button>
		</intersect>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Intersect from 'vue-intersect';
import MkButton from './button.vue';
import paging from '../../scripts/paging';

export default Vue.extend({
	mixins: [
		paging({}),
	],

	components: {
		MkButton,
		Intersect
	},

	props: {
		pagination: {
			required: true
		},
		autoMargin: {
			required: false,
			default: true
		}
	},
});
</script>

<style lang="scss" scoped>
.cxiknjgy {
	&.autoMargin > *:not(:last-child) {
		margin-bottom: 16px;

		@media (max-width: 500px) {
			margin-bottom: 8px;
		}
	}

	> .more > .button {
		margin-left: auto;
		margin-right: auto;
		height: 48px;
		min-width: 150px;
	}
}
</style>
