<template>
<FormBase class="mmnnbwxb" v-if="meta">
	<div class="_formItem logo">
		<img v-if="meta.logoImageUrl" :src="meta.logoImageUrl">
		<span v-else class="text">{{ instanceName }}</span>
	</div>
	<FormGroup>
		<FormKeyValueView>
			<template #key>Misskey</template>
			<template #value>v{{ version }}</template>
		</FormKeyValueView>
	</FormGroup>

	<FormGroup>
		<FormKeyValueView>
			<template #key>{{ $ts.administrator }}</template>
			<template #value>{{ meta.maintainerName }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.contact }}</template>
			<template #value>{{ meta.maintainerEmail }}</template>
		</FormKeyValueView>
	</FormGroup>

	<FormLink v-if="meta.tosUrl" :to="meta.tosUrl" external>{{ $ts.tos }}</FormLink>

	<FormGroup v-if="stats">
		<template #label>{{ $ts.statistics }}</template>
		<FormKeyValueView>
			<template #key>{{ $ts.users }}</template>
			<template #value>{{ number(stats.originalUsersCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.notes }}</template>
			<template #value>{{ number(stats.originalNotesCount) }}</template>
		</FormKeyValueView>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { version, instanceName } from '@client/config';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import * as os from '@client/os';
import number from '@client/filters/number';

export default defineComponent({
	components: {
		FormBase,
		FormGroup,
		FormLink,
		FormKeyValueView,
	},

	data() {
		return {
			INFO: {
				title: this.$ts.instanceInfo,
				icon: faInfoCircle
			},
			version,
			instanceName,
			stats: null,
			faInfoCircle
		}
	},

	computed: {
		meta() {
			return this.$instance;
		},
	},

	created() {
		os.api('stats').then(stats => {
			this.stats = stats;
		});
	},

	methods: {
		number
	}
});
</script>

<style lang="scss" scoped>
.mmnnbwxb {
	max-width: 800px;
	box-sizing: border-box;
	margin: 0 auto;

	> .logo {
		text-align: center;

		> img {
			vertical-align: bottom;
			max-height: 100px;
		}
	}
}
</style>
