<template>
<div class="ieepwinx">
	<portal to="icon"><fa :icon="faSatellite"/></portal>
	<portal to="title">{{ $t('manageAntennas') }}</portal>

	<mk-button @click="create" primary class="add"><fa :icon="faPlus"/> {{ $t('createAntenna') }}</mk-button>

	<x-antenna v-if="draft" :antenna="draft" @created="onAntennaCreated"/>

	<mk-pagination :pagination="pagination" #default="{items}" class="antennas" ref="list">
		<div class="antenna _panel" v-for="(antenna, i) in items" :key="antenna.id" :data-index="i">
			<x-antenna :antenna="antenna" @created="onAntennaDeleted"/>
		</div>
	</mk-pagination>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSatellite, faPlus } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '../../components/ui/pagination.vue';
import MkButton from '../../components/ui/button.vue';
import XAntenna from './index.antenna.vue';

export default Vue.extend({
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
				src: 'home',
				keywords: []
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

	> .antennas {
		> .antenna {
			display: flex;
			padding: 16px;
		}
	}
}
</style>
