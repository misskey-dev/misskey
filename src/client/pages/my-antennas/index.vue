<template>
<div class="ieepwinx">
	<portal to="header"><fa :icon="faSatellite"/>{{ $t('manageAntennas') }}</portal>

	<mk-button @click="create" primary class="add"><fa :icon="faPlus"/> {{ $t('add') }}</mk-button>

	<x-antenna v-if="draft" :antenna="draft" @created="onAntennaCreated" style="margin-bottom: var(--margin);"/>

	<mk-pagination :pagination="pagination" #default="{items}" class="antennas" ref="list">
		<x-antenna v-for="(antenna, i) in items" :key="antenna.id" :antenna="antenna" @created="onAntennaDeleted"/>
	</mk-pagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSatellite, faPlus } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import XAntenna from './index.antenna.vue';
import * as os from '@/os';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('manageAntennas') as string,
		};
	},

	components: {
		MkPagination,
		MkButton,
		XAntenna,
	},

	data() {
		return {
			pagination: {
				endpoint: 'antennas/list',
				limit: 10,
			},
			draft: null,
			faSatellite, faPlus
		};
	},

	methods: {
		create() {
			this.draft = {
				name: '',
				src: 'all',
				userListId: null,
				userGroupId: null,
				users: [],
				keywords: [],
				excludeKeywords: [],
				withReplies: false,
				caseSensitive: false,
				withFile: false,
				notify: false
			};
		},

		onAntennaCreated() {
			this.$refs.list.reload();
			this.draft = null;
		},

		onAntennaDeleted() {
			this.$refs.list.reload();
		},
	}
});
</script>

<style lang="scss" scoped>
.ieepwinx {
	> .add {
		margin: 0 auto 16px auto;
	}
}
</style>
