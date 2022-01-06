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

<script setup lang="ts">
import { ref } from 'vue';
import XWindow from '@/components/ui/window.vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps({
	user: {
		type: Object,
		required: true,
	},
	initialComment: {
		type: String,
		required: false,
	},
});

/*const emits = */defineEmits(['closed']);

const window = ref<InstanceType<typeof XWindow>>();
const comment = ref(props.initialComment || '');

function send() {
	os.apiWithDialog('users/report-abuse', {
		userId: props.user.id,
		comment: comment.value,
	}, undefined).then(res => {
		os.alert({
			type: 'success',
			text: i18n.locale.abuseReported
		});
		window.value?.close();
	});
}
</script>

<style lang="scss" scoped>
.dpvffvvy {
	--root-margin: 16px;
}
</style>
