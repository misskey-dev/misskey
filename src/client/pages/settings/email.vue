<template>
<FormBase>
	<FormGroup>
		<template #label>{{ $ts.emailAddress }}</template>
		<FormLink to="/settings/email/address">
			<template v-if="$i.email && !$i.emailVerified" #icon><Fa :icon="faExclamationTriangle" style="color: var(--warn);"/></template>
			<template v-else-if="$i.email && $i.emailVerified" #icon><Fa :icon="faCheck" style="color: var(--success);"/></template>
			{{ $i.email || $ts.notSet }}
		</FormLink>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCog, faExclamationTriangle, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import FormButton from '@/components/form/button.vue';
import FormLink from '@/components/form/link.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		FormBase,
		FormLink,
		FormButton,
		FormGroup,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$ts.email,
				icon: faEnvelope
			},
			faCog, faExclamationTriangle, faCheck
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {

	}
});
</script>
