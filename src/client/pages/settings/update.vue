<template>
<FormBase>
	<template v-if="meta">
		<FormInfo v-if="version === meta.version">{{ $ts.youAreRunningUpToDateClient }}</FormInfo>
		<FormInfo v-else warn>{{ $ts.newVersionOfClientAvailable }}</FormInfo>
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
import FormSwitch from '@client/components/form/switch.vue';
import FormSelect from '@client/components/form/select.vue';
import FormLink from '@client/components/debobigego/link.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormGroup from '@client/components/debobigego/group.vue';
import FormButton from '@client/components/debobigego/button.vue';
import FormKeyValueView from '@client/components/debobigego/key-value-view.vue';
import FormInfo from '@client/components/debobigego/info.vue';
import * as os from '@client/os';
import { version, instanceName } from '@client/config';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormSelect,
		FormSwitch,
		FormButton,
		FormLink,
		FormGroup,
		FormKeyValueView,
		FormInfo,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: 'Misskey Update',
				icon: 'fas fa-sync-alt',
				bg: 'var(--bg)',
			},
			version,
			instanceName,
			releases: null,
			meta: null
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);

		os.api('meta', {
			detail: false
		}).then(meta => {
			this.meta = meta;
			localStorage.setItem('v', meta.version);
		});

		fetch('https://api.github.com/repos/misskey-dev/misskey/releases', {
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
