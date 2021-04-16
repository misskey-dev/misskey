<template>
<FormBase>
	<FormGroup v-if="instance">
		<template #label>{{ instance.host }}</template>
		<FormKeyValueView>
			<template #key>Name</template>
			<template #value><span class="_monospace">{{ instance.name || `(${$ts.unknown})` }}</span></template>
		</FormKeyValueView>

		<FormGroup>
			<FormKeyValueView>
				<template #key>Software Name</template>
				<template #value><span class="_monospace">{{ instance.softwareName || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>Software Version</template>
				<template #value><span class="_monospace">{{ instance.softwareVersion || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
		</FormGroup>
		<FormGroup>
			<FormKeyValueView>
				<template #key>Maintainer Name</template>
				<template #value><span class="_monospace">{{ instance.maintainerName || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>Maintainer Contact</template>
				<template #value><span class="_monospace">{{ instance.maintainerEmail || `(${$ts.unknown})` }}</span></template>
			</FormKeyValueView>
		</FormGroup>
		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.latestRequestSentAt }}</template>
				<template #value><MkTime v-if="instance.latestRequestSentAt" :time="instance.latestRequestSentAt"/><span v-else>N/A</span></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.latestStatus }}</template>
				<template #value>{{ instance.latestStatus ? instance.latestStatus : 'N/A' }}</template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>{{ $ts.latestRequestReceivedAt }}</template>
				<template #value><MkTime v-if="instance.latestRequestReceivedAt" :time="instance.latestRequestReceivedAt"/><span v-else>N/A</span></template>
			</FormKeyValueView>
		</FormGroup>
		<FormGroup>
			<FormKeyValueView>
				<template #key>Open Registrations</template>
				<template #value>{{ instance.openRegistrations ? $ts.yes : $ts.no }}</template>
			</FormKeyValueView>
		</FormGroup>
		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.registeredAt }}</template>
				<template #value><MkTime mode="detail" :time="instance.caughtAt"/></template>
			</FormKeyValueView>
		</FormGroup>
		<FormObjectView tall :value="instance">
			<span>Raw</span>
		</FormObjectView>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import FormObjectView from '@client/components/form/object-view.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import FormSuspense from '@client/components/form/suspense.vue';
import * as os from '@client/os';
import number from '@client/filters/number';
import bytes from '@client/filters/bytes';
import * as symbols from '@client/symbols';
import { url } from '@client/config';

export default defineComponent({
	components: {
		FormBase,
		FormTextarea,
		FormObjectView,
		FormButton,
		FormLink,
		FormGroup,
		FormKeyValueView,
		FormSuspense,
	},

	props: {
		host: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.instanceInfo,
				icon: faInfoCircle
			},
			instance: null,
		}
	},

	mounted() {
		this.fetch();
	},

	methods: {
		number,
		bytes,

		async fetch() {
			this.instance = await os.api('federation/show-instance', {
				host: this.host
			});
		}
	}
});
</script>
