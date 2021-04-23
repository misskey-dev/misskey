<template>
<FormBase>
	<FormGroup>
		<template #label>{{ $ts.emailAddress }}</template>
		<FormLink to="/settings/email/address">
			<template v-if="$i.email && !$i.emailVerified" #icon><i class="fas fa-exclamation-triangle" style="color: var(--warn);"></i></template>
			<template v-else-if="$i.email && $i.emailVerified" #icon><i class="fas fa-check" style="color: var(--success);"></i></template>
			{{ $i.email || $ts.notSet }}
		</FormLink>
	</FormGroup>

	<FormLink to="/settings/email/notification">
		<template #icon><i class="fas fa-bell"></i></template>
		{{ $ts.emailNotification }}
	</FormLink>

	<FormSwitch :value="$i.receiveAnnouncementEmail" @update:value="onChangeReceiveAnnouncementEmail">
		{{ $ts.receiveAnnouncementFromInstance }}
	</FormSwitch>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormButton from '@client/components/form/button.vue';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormSwitch from '@client/components/form/switch.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormLink,
		FormButton,
		FormSwitch,
		FormGroup,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.email,
				icon: 'fas fa-envelope'
			},
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		onChangeReceiveAnnouncementEmail(v) {
			os.api('i/update', {
				receiveAnnouncementEmail: v
			});
		},
	}
});
</script>
