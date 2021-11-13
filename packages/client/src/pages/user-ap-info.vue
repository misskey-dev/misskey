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
					<template #value><span class="_monospace">{{ ap.sharedInbox || ap.endpoints.sharedInbox }}</span></template>
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
			<FormGroup>
				<FormLink :to="`https://${user.host}/.well-known/webfinger?resource=acct:${user.username}`" external>WebFinger</FormLink>
			</FormGroup>
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
import FormObjectView from '@/components/debobigego/object-view.vue';
import FormTextarea from '@/components/debobigego/textarea.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormKeyValueView from '@/components/debobigego/key-value-view.vue';
import FormSuspense from '@/components/debobigego/suspense.vue';
import * as os from '@/os';
import number from '@/filters/number';
import bytes from '@/filters/bytes';
import * as symbols from '@/symbols';
import { url } from '@/config';

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
				icon: 'fas fa-info-circle'
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
