<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="fas fa-bolt"></i> {{ $ts._pages.blocks.button }}</template>

	<section class="xfhsjczc">
		<MkInput v-model="value.text"><template #label>{{ $ts._pages.blocks._button.text }}</template></MkInput>
		<MkSwitch v-model="value.primary"><span>{{ $ts._pages.blocks._button.colored }}</span></MkSwitch>
		<MkSelect v-model="value.action">
			<template #label>{{ $ts._pages.blocks._button.action }}</template>
			<option value="dialog">{{ $ts._pages.blocks._button._action.dialog }}</option>
			<option value="resetRandom">{{ $ts._pages.blocks._button._action.resetRandom }}</option>
			<option value="pushEvent">{{ $ts._pages.blocks._button._action.pushEvent }}</option>
			<option value="callAiScript">{{ $ts._pages.blocks._button._action.callAiScript }}</option>
		</MkSelect>
		<template v-if="value.action === 'dialog'">
			<MkInput v-model="value.content"><template #label>{{ $ts._pages.blocks._button._action._dialog.content }}</template></MkInput>
		</template>
		<template v-else-if="value.action === 'pushEvent'">
			<MkInput v-model="value.event"><template #label>{{ $ts._pages.blocks._button._action._pushEvent.event }}</template></MkInput>
			<MkInput v-model="value.message"><template #label>{{ $ts._pages.blocks._button._action._pushEvent.message }}</template></MkInput>
			<MkSelect v-model="value.var">
				<template #label>{{ $ts._pages.blocks._button._action._pushEvent.variable }}</template>
				<option :value="null">{{ $t('_pages.blocks._button._action._pushEvent.no-variable') }}</option>
				<option v-for="v in hpml.getVarsByType()" :value="v.name">{{ v.name }}</option>
				<optgroup :label="$ts._pages.script.pageVariables">
					<option v-for="v in hpml.getPageVarsByType()" :value="v">{{ v }}</option>
				</optgroup>
				<optgroup :label="$ts._pages.script.enviromentVariables">
					<option v-for="v in hpml.getEnvVarsByType()" :value="v">{{ v }}</option>
				</optgroup>
			</MkSelect>
		</template>
		<template v-else-if="value.action === 'callAiScript'">
			<MkInput v-model="value.fn"><template #label>{{ $ts._pages.blocks._button._action._callAiScript.functionName }}</template></MkInput>
		</template>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import { } from 'vue';
import XContainer from '../page-editor.container.vue';
import MkSelect from '@/components/form/select.vue';
import MkInput from '@/components/form/input.vue';
import MkSwitch from '@/components/form/switch.vue';

withDefaults(defineProps<{
	value: any,
	hpml: any
}>(), {
	value: {
		text: '',
		action: 'dialog',
		content: null,
		event: null,
		message: null,
		primary: false,
		var: null,
		fn: null
	}
});
</script>

<style lang="scss" scoped>
.xfhsjczc {
	padding: 0 16px 0 16px;
}
</style>
