<template>
<XModalWindow ref="dialog"
	:width="370"
	:height="400"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
>
	<template #header>{{ $ts.forgotPassword }}</template>

	<form class="bafeceda" @submit.prevent="onSubmit" v-if="$instance.enableEmail">
		<div class="main _formRoot">
			<MkInput class="_formBlock" v-model="username" type="text" pattern="^[a-zA-Z0-9_]+$" spellcheck="false" autofocus required>
				<template #label>{{ $ts.username }}</template>
				<template #prefix>@</template>
			</MkInput>

			<MkInput class="_formBlock" v-model="email" type="email" spellcheck="false" required>
				<template #label>{{ $ts.emailAddress }}</template>
				<template #caption>{{ $ts._forgotPassword.enterEmail }}</template>
			</MkInput>

			<MkButton class="_formBlock" type="submit" :disabled="processing" primary style="margin: 0 auto;">{{ $ts.send }}</MkButton>
		</div>
		<div class="sub">
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
import XModalWindow from '@/components/ui/modal-window.vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import * as os from '@/os';

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

<style lang="scss" scoped>
.bafeceda {
	> .main {
		padding: 24px;
	}

	> .sub {
		border-top: solid 0.5px var(--divider);
		padding: 24px;
	}
}
</style>
