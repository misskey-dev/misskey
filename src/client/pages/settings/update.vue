<template>
<FormBase>
	<template v-if="meta">
		<MkInfo v-if="version === meta.version">{{ $ts.youAreRunningUpToDateClient }}</MkInfo>
		<MkInfo v-else warn>{{ $ts.newVersionOfClientAvailable }}</MkInfo>
	</template>
	<FormGroup>
		<template #label>{{ instanceName }}</template>
		<FormKeyValueView>
			<template #key>{{ $ts.currentVersion }}</template>
			<template #value>{{ version }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.latestVersion }}</template>
			<template #value v-if="meta">{{ meta.version }}</template>
			<template #value v-else><MkEllipsis/></template>
		</FormKeyValueView>
	</FormGroup>
	<FormGroup>
		<template #label>Misskey</template>
		<FormKeyValueView>
			<template #key>{{ $ts.latestVersion }}</template>
			<template #value v-if="releases">{{ releases[0].tag_name }}</template>
			<template #value v-else><MkEllipsis/></template>
		</FormKeyValueView>
		<template #caption v-if="releases"><MkTime :time="releases[0].published_at" mode="detail"/></template>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faInfoCircle, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import FormSwitch from '@client/components/form/switch.vue';
import FormSelect from '@client/components/form/select.vue';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import MkInfo from '@client/components/ui/info.vue';
import * as os from '@client/os';
import { version, instanceName } from '@client/config';

export default defineComponent({
	components: {
		FormBase,
		FormSelect,
		FormSwitch,
		FormButton,
		FormLink,
		FormGroup,
		FormKeyValueView,
		MkInfo,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: 'Misskey Update',
				icon: faSyncAlt
			},
			version,
			instanceName,
			releases: null,
			meta: null
		}
	},

	mounted() {
		this.$emit('info', this.INFO);

		os.api('meta', {
			detail: false
		}).then(meta => {
			this.meta = meta;
			localStorage.setItem('v', meta.version);
		});

		fetch('https://api.github.com/repos/syuilo/misskey/releases', {
			method: 'GET',
		})
		.then(res => res.json())
		.then(res => {
			this.releases = res;
		});
	},

	methods: {
	}
});
</script>
