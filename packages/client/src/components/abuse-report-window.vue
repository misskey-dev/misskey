<template>
<XWindow ref="window" :initial-width="400" :initial-height="500" :can-resize="true" @closed="$emit('closed')">
	<template #header>
		<i class="fas fa-exclamation-circle" style="margin-right: 0.5em;"></i>
		<I18n :src="$ts.reportAbuseOf" tag="span">
			<template #name>
				<b><MkAcct :user="user"/></b>
			</template>
		</I18n>
	</template>
	<div class="dpvffvvy _monolithic_">
		<div class="_section">
			<MkTextarea v-model="comment">
				<template #label>{{ $ts.details }}</template>
				<template #caption>{{ $ts.fillAbuseReportDescription }}</template>
			</MkTextarea>
		</div>
		<div class="_section">
			<MkButton primary full :disabled="comment.length === 0" @click="send">{{ $ts.send }}</MkButton>
		</div>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import XWindow from '@/components/ui/window.vue';
import MkTextarea from '@/components/form/textarea.vue';
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
		};
	},

	methods: {
		send() {
			os.apiWithDialog('users/report-abuse', {
				userId: this.user.id,
				comment: this.comment,
			}, undefined, res => {
				os.alert({
					type: 'success',
					text: this.$ts.abuseReported
				});
				this.$refs.window.close();
			});
		}
	},
});
</script>

<style lang="scss" scoped>
.dpvffvvy {
	--root-margin: 16px;
}
</style>
