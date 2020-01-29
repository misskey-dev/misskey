<template>
<sequential-entrance class="cxiknjgy" :class="{ autoMargin }">
	<slot :items="items"></slot>
	<div class="empty" v-if="empty" key="_empty_">
		<slot name="empty"></slot>
	</div>
	<div class="more" v-if="more" key="_more_">
		<mk-button :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" @click="fetchMore()">
			<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
			<template v-if="moreFetching"><fa :icon="faSpinner" pulse fixed-width/></template>
		</mk-button>
	</div>
</sequential-entrance>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import MkButton from './button.vue';
import paging from '../../scripts/paging';

export default Vue.extend({
	mixins: [
		paging({}),
	],

	components: {
		MkButton
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

	data() {
		return {
			faSpinner
		};
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
}
</style>
