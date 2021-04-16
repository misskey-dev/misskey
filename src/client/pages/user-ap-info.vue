<template>
<FormBase>
	<FormSuspense :p="apPromiseFactory" v-slot="{ result: ap }">
		<FormGroup>
			<template #label>ActivityPub</template>
			<FormKeyValueView>
				<template #key>Type</template>
				<template #value><span class="_monospace">{{ ap.type }}</span></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>URI</template>
				<template #value><span class="_monospace">{{ ap.id }}</span></template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>URL</template>
				<template #value><span class="_monospace">{{ ap.url }}</span></template>
			</FormKeyValueView>
			<FormGroup>
				<FormKeyValueView>
					<template #key>Inbox</template>
					<template #value><span class="_monospace">{{ ap.inbox }}</span></template>
				</FormKeyValueView>
				<FormKeyValueView>
					<template #key>Shared Inbox</template>
					<template #value><span class="_monospace">{{ ap.sharedInbox }}</span></template>
				</FormKeyValueView>
				<FormKeyValueView>
					<template #key>Outbox</template>
					<template #value><span class="_monospace">{{ ap.outbox }}</span></template>
				</FormKeyValueView>
			</FormGroup>
			<FormTextarea readonly tall code pre :value="ap.publicKey.publicKeyPem">
				<span>Public Key</span>
			</FormTextarea>
			<FormKeyValueView>
				<template #key>Discoverable</template>
				<template #value>{{ ap.discoverable ? $ts.yes : $ts.no }}</template>
			</FormKeyValueView>
			<FormKeyValueView>
				<template #key>ManuallyApprovesFollowers</template>
				<template #value>{{ ap.manuallyApprovesFollowers ? $ts.yes : $ts.no }}</template>
			</FormKeyValueView>
			<FormObjectView tall :value="ap">
				<span>Raw</span>
			</FormObjectView>
			<FormLink v-if="user.host" :to="`/instance-info/${user.host}`">{{ $ts.instanceInfo }}<template #suffix>{{ user.host }}</template></FormLink>
			<FormKeyValueView v-else>
				<template #key>{{ $ts.instanceInfo }}</template>
				<template #value>(Local user)</template>
			</FormKeyValueView>
		</FormGroup>
	</FormSuspense>
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
		userId: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.userInfo,
				icon: faInfoCircle
			},
			user: null,
			apPromiseFactory: null,
		}
	},

	mounted() {
		this.fetch();
	},

	methods: {
		number,
		bytes,

		async fetch() {
			this.user = await os.api('users/show', {
				userId: this.userId
			});

			this.apPromiseFactory = () => os.api('ap/get', {
				uri: this.user.uri || `${url}/users/${this.user.id}`
			});
		}
	}
});
</script>
