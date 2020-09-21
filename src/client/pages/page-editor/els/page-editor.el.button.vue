<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><Fa :icon="faBolt"/> {{ $t('_pages.blocks.button') }}</template>

	<section class="xfhsjczc">
		<MkInput v-model:value="value.text"><span>{{ $t('_pages.blocks._button.text') }}</span></MkInput>
		<MkSwitch v-model:value="value.primary"><span>{{ $t('_pages.blocks._button.colored') }}</span></MkSwitch>
		<MkSelect v-model:value="value.action">
			<template #label>{{ $t('_pages.blocks._button.action') }}</template>
			<option value="dialog">{{ $t('_pages.blocks._button._action.dialog') }}</option>
			<option value="resetRandom">{{ $t('_pages.blocks._button._action.resetRandom') }}</option>
			<option value="pushEvent">{{ $t('_pages.blocks._button._action.pushEvent') }}</option>
			<option value="callAiScript">{{ $t('_pages.blocks._button._action.callAiScript') }}</option>
		</MkSelect>
		<template v-if="value.action === 'dialog'">
			<MkInput v-model:value="value.content"><span>{{ $t('_pages.blocks._button._action._dialog.content') }}</span></MkInput>
		</template>
		<template v-else-if="value.action === 'pushEvent'">
			<MkInput v-model:value="value.event"><span>{{ $t('_pages.blocks._button._action._pushEvent.event') }}</span></MkInput>
			<MkInput v-model:value="value.message"><span>{{ $t('_pages.blocks._button._action._pushEvent.message') }}</span></MkInput>
			<MkSelect v-model:value="value.var">
				<template #label>{{ $t('_pages.blocks._button._action._pushEvent.variable') }}</template>
				<option :value="null">{{ $t('_pages.blocks._button._action._pushEvent.no-variable') }}</option>
				<option v-for="v in hpml.getVarsByType()" :value="v.name">{{ v.name }}</option>
				<optgroup :label="$t('_pages.script.pageVariables')">
					<option v-for="v in hpml.getPageVarsByType()" :value="v">{{ v }}</option>
				</optgroup>
				<optgroup :label="$t('_pages.script.enviromentVariables')">
					<option v-for="v in hpml.getEnvVarsByType()" :value="v">{{ v }}</option>
				</optgroup>
			</MkSelect>
		</template>
		<template v-else-if="value.action === 'callAiScript'">
			<MkInput v-model:value="value.fn"><span>{{ $t('_pages.blocks._button._action._callAiScript.functionName') }}</span></MkInput>
		</template>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkSelect from '@/components/ui/select.vue';
import MkInput from '@/components/ui/input.vue';
import MkSwitch from '@/components/ui/switch.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer, MkSelect, MkInput, MkSwitch
	},

	props: {
		value: {
			required: true
		},
		hpml: {
			required: true,
		},
	},

	data() {
		return {
			faBolt
		};
	},

	created() {
		if (this.value.text == null) Vue.set(this.value, 'text', '');
		if (this.value.action == null) Vue.set(this.value, 'action', 'dialog');
		if (this.value.content == null) Vue.set(this.value, 'content', null);
		if (this.value.event == null) Vue.set(this.value, 'event', null);
		if (this.value.message == null) Vue.set(this.value, 'message', null);
		if (this.value.primary == null) Vue.set(this.value, 'primary', false);
		if (this.value.var == null) Vue.set(this.value, 'var', null);
		if (this.value.fn == null) Vue.set(this.value, 'fn', null);
	},
});
</script>

<style lang="scss" scoped>
.xfhsjczc {
	padding: 0 16px 0 16px;
}
</style>
