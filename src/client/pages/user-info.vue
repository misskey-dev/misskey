<template>
<FormBase>
	<template v-if="user">
		<FormKeyValueView>
			<template #key>ID</template>
			<template #value><span class="_monospace">{{ user.id }}</span></template>
		</FormKeyValueView>

		<FormGroup>
			<FormLink :to="`/user-ap-info/${user.id}`">ActivityPub</FormLink>

			<FormLink v-if="user.host" :to="`/instance-info/${user.host}`">{{ $ts.instanceInfo }}<template #suffix>{{ user.host }}</template></FormLink>
			<FormKeyValueView v-else>
				<template #key>{{ $ts.instanceInfo }}</template>
				<template #value>(Local user)</template>
			</FormKeyValueView>
		</FormGroup>

		<FormObjectView tall :value="user">
			<span>Raw</span>
		</FormObjectView>
	</template>
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
		}
	}
});
</script>
