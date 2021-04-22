<template>
<FormBase>
	<FormSuspense :p="init">
		<FormLink :to="userPage(user)">Profile</FormLink>

		<FormGroup>
			<FormKeyValueView>
				<template #key>Acct</template>
				<template #value><span class="_monospace">{{ acct(user) }}</span></template>
			</FormKeyValueView>

			<FormKeyValueView>
				<template #key>ID</template>
				<template #value><span class="_monospace">{{ user.id }}</span></template>
			</FormKeyValueView>
		</FormGroup>

		<FormGroup>
			<FormLink :to="`/user-ap-info/${user.id}`">ActivityPub</FormLink>

			<FormLink v-if="user.host" :to="`/instance-info/${user.host}`">{{ $ts.instanceInfo }}<template #suffix>{{ user.host }}</template></FormLink>
			<FormKeyValueView v-else>
				<template #key>{{ $ts.instanceInfo }}</template>
				<template #value>(Local user)</template>
			</FormKeyValueView>
		</FormGroup>

		<FormGroup>
			<FormKeyValueView>
				<template #key>{{ $ts.updatedAt }}</template>
				<template #value><MkTime v-if="user.lastFetchedAt" mode="detail" :time="user.lastFetchedAt"/><span v-else>N/A</span></template>
			</FormKeyValueView>
		</FormGroup>

		<FormGroup>
			<FormButton><i class="fas fa-key"></i> {{ $ts.resetPassword }}</FormButton>
		</FormGroup>

		<FormObjectView tall :value="user">
			<span>Raw</span>
		</FormObjectView>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent } from 'vue';
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
import { userPage, acct } from '@client/filters/user';

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
			[symbols.PAGE_INFO]: computed(() => ({
				title: this.$ts.userInfo,
				icon: 'fas fa-info-circle',
				actions: this.user ? [this.user.url ? {
					text: this.user.url,
					icon: 'fas fa-external-link-alt',
					handler: () => {
						window.open(this.user.url, '_blank');
					}
				} : undefined].filter(x => x !== undefined) : [],
			})),
			init: null,
			user: null,
			info: null,
		}
	},

	watch: {
		userId: {
			handler() {
				this.init = () => Promise.all([os.api('users/show', {
					userId: this.userId
				}), os.api('admin/show-user', {
					userId: this.userId
				})]).then(([user, info]) => {
					this.user = user;
					this.info = info;
				});
			},
			immediate: true
		}
	},

	methods: {
		number,
		bytes,
		userPage,
		acct,
	}
});
</script>
