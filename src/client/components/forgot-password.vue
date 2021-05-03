<template>
<XModalWindow ref="dialog"
	:width="370"
	:height="400"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
>
	<template #header>{{ $ts.forgotPassword }}</template>

	<form class="_monolithic_" @submit.prevent="onSubmit" v-if="$instance.enableEmail">
		<div class="_section">
			<MkInput v-model:value="username" type="text" pattern="^[a-zA-Z0-9_]+$" spellcheck="false" autofocus required>
				<span>{{ $ts.username }}</span>
				<template #prefix>@</template>
			</MkInput>

			<MkInput v-model:value="email" type="email" spellcheck="false" autofocus required>
				<span>{{ $ts.emailAddress }}</span>
				<template #desc>{{ $ts._forgotPassword.enterEmail }}</template>
			</MkInput>

			<MkButton type="submit" :disabled="processing" primary style="margin: 0 auto;">{{ $ts.send }}</MkButton>
		</div>
		<div class="_section">
			<MkA to="/about" class="_link">{{ $ts._forgotPassword.ifNoEmail }}</MkA>
		</div>
	</form>
	<div v-else>
		{{ $ts._forgotPassword.contactAdmin }}
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XModalWindow from '@client/components/ui/modal-window.vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		XModalWindow,
		MkButton,
		MkInput,
	},

	emits: ['done', 'closed'],

	data() {
		return {
			username: '',
			email: '',
			processing: false,
		};
	},

	methods: {
		async onSubmit() {
			this.processing = true;
			await os.apiWithDialog('request-reset-password', {
				username: this.username,
				email: this.email,
			});

			this.$emit('done');
			this.$refs.dialog.close();
		}
	}
});
</script>
