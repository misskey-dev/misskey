<template>
<div class="cxiknjgy" :class="{ autoMargin }">
	<slot :items="items"></slot>
	<div class="empty" v-if="empty" key="_empty_">
		<slot name="empty"></slot>
	</div>
	<div class="more" v-show="more" key="_more_">
		<mk-button class="button" ref="loadMore" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" primary>
			<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
			<template v-if="moreFetching"><mk-loading inline/></template>
		</mk-button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkButton from './button.vue';
import paging from '../../scripts/paging';

export default Vue.extend({
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
