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
			<template #key>{{ $t('administrator') }}</template>
			<template #value>{{ meta.maintainerName }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('contact') }}</template>
			<template #value>{{ meta.maintainerEmail }}</template>
		</FormKeyValueView>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { version, instanceName } from '@/config';
import FormLink from '@/components/form/link.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormKeyValueView from '@/components/form/key-value-view.vue';
import * as os from '@/os';

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
				title: this.$t('instanceInfo'),
				icon: faInfoCircle
			},
			version,
			instanceName,
			serverInfo: null,
			faInfoCircle
		}
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},
	},
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
