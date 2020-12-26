<template>
<XWindow ref="window" :initial-width="400" :initial-height="500" :can-resize="true" @closed="$emit('closed')">
	<template #header>
		<Fa :icon="faExclamationCircle" style="margin-right: 0.5em;"/>
		<I18n src="reportAbuseOf" tag="span">
			<template #name>
				<b><MkAcct :user="user"/></b>
			</template>
		</I18n>
	</template>
	<div class="dpvffvvy">
		<div class="_section">
			<div class="_content">
				<MkTextarea v-model:value="comment">
					<span>{{ $t('details') }}</span>
					<template #desc>{{ $t('fillAbuseReportDescription') }}</template>
				</MkTextarea>
			</div>
		</div>
		<div class="_section">
			<div class="_content">
				<MkButton @click="send" primary full :disabled="comment.length === 0">{{ $t('send') }}</MkButton>
			</div>
		</div>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import XWindow from '@/components/ui/window.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XWindow,
		MkTextarea,
		MkButton,
	},

	props: {
		user: {
			type: Object,
			required: true,
		},
		initialComment: {
			type: String,
			required: false,
		},
	},

	emits: ['closed'],

	data() {
		return {
			comment: this.initialComment || '',
			faExclamationCircle,
		};
	},

	methods: {
		send() {
			os.apiWithDialog('users/report-abuse', {
				userId: this.user.id,
				comment: this.comment,
			}, undefined, res => {
				os.dialog({
					type: 'success',
					text: this.$t('abuseReported')
				});
				this.$refs.window.close();
			});
		}
	},
});
</script>

<style lang="scss" scoped>
.dpvffvvy {
	--section-padding: 16px;
}
</style>
