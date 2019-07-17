<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faBolt"/> {{ $t('blocks.button') }}</template>

	<section class="xfhsjczc">
		<ui-input v-model="value.text"><span>{{ $t('blocks._button.text') }}</span></ui-input>
		<ui-switch v-model="value.primary"><span>{{ $t('blocks._button.colored') }}</span></ui-switch>
		<ui-select v-model="value.action">
			<template #label>{{ $t('blocks._button.action') }}</template>
			<option value="dialog">{{ $t('blocks._button._action.dialog') }}</option>
			<option value="resetRandom">{{ $t('blocks._button._action.resetRandom') }}</option>
			<option value="pushEvent">{{ $t('blocks._button._action.pushEvent') }}</option>
		</ui-select>
		<template v-if="value.action === 'dialog'">
			<ui-input v-model="value.content"><span>{{ $t('blocks._button._action._dialog.content') }}</span></ui-input>
		</template>
		<template v-else-if="value.action === 'pushEvent'">
			<ui-input v-model="value.event"><span>{{ $t('blocks._button._action._pushEvent.event') }}</span></ui-input>
			<ui-input v-model="value.message"><span>{{ $t('blocks._button._action._pushEvent.message') }}</span></ui-input>
			<ui-select v-model="value.var">
				<template #label>{{ $t('blocks._button._action._pushEvent.variable') }}</template>
				<option :value="null">{{ $t('blocks._button._action._pushEvent.no-variable') }}</option>
				<option v-for="v in aiScript.getVarsByType()" :value="v.name">{{ v.name }}</option>
				<optgroup :label="$t('script.pageVariables')">
					<option v-for="v in aiScript.getPageVarsByType()" :value="v">{{ v }}</option>
				</optgroup>
				<optgroup :label="$t('script.enviromentVariables')">
					<option v-for="v in aiScript.getEnvVarsByType()" :value="v">{{ v }}</option>
				</optgroup>
			</ui-select>
		</template>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../../../../i18n';
import XContainer from '../page-editor.container.vue';

export default Vue.extend({
	i18n: i18n('pages'),

	components: {
		XContainer
	},

	props: {
		value: {
			required: true
		},
		aiScript: {
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
	},
});
</script>

<style lang="stylus" scoped>
.xfhsjczc
	padding 0 16px 0 16px

</style>
