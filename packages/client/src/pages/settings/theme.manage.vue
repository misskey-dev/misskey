<template>
<div class="_formRoot">
	<FormSelect v-model="selectedThemeId" class="_formBlock">
		<template #label>{{ $ts.theme }}</template>
		<optgroup :label="$ts._theme.installedThemes">
			<option v-for="x in installedThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
		</optgroup>
		<optgroup :label="$ts._theme.builtinThemes">
			<option v-for="x in builtinThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
		</optgroup>
	</FormSelect>
	<template v-if="selectedTheme">
		<FormInput readonly :modelValue="selectedTheme.author" class="_formBlock">
			<template #label>{{ $ts.author }}</template>
		</FormInput>
		<FormTextarea v-if="selectedTheme.desc" readonly :modelValue="selectedTheme.desc" class="_formBlock">
			<template #label>{{ $ts._theme.description }}</template>
		</FormTextarea>
		<FormTextarea readonly tall :modelValue="selectedThemeCode" class="_formBlock">
			<template #label>{{ $ts._theme.code }}</template>
			<template #caption><button class="_textButton" @click="copyThemeCode()">{{ $ts.copy }}</button></template>
		</FormTextarea>
		<FormButton v-if="!builtinThemes.some(t => t.id == selectedTheme.id)" class="_formBlock" danger @click="uninstall()"><i class="fas fa-trash-alt"></i> {{ $ts.uninstall }}</FormButton>
	</template>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as JSON5 from 'json5';
import FormTextarea from '@/components/form/textarea.vue';
import FormSelect from '@/components/form/select.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormInput from '@/components/form/input.vue';
import FormButton from '@/components/ui/button.vue';
import { Theme, builtinThemes } from '@/scripts/theme';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import { getThemes, removeTheme } from '@/theme-store';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormTextarea,
		FormSelect,
		FormRadios,
		FormBase,
		FormGroup,
		FormInput,
		FormButton,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts._theme.manage,
				icon: 'fas fa-folder-open',
				bg: 'var(--bg)',
			},
			installedThemes: getThemes(),
			builtinThemes,
			selectedThemeId: null,
		}
	},

	computed: {
		themes(): Theme[] {
			return this.builtinThemes.concat(this.installedThemes);
		},
	
		selectedTheme() {
			if (this.selectedThemeId == null) return null;
			return this.themes.find(x => x.id === this.selectedThemeId);
		},

		selectedThemeCode() {
			if (this.selectedTheme == null) return null;
			return JSON5.stringify(this.selectedTheme, null, '\t');
		},
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		copyThemeCode() {
			copyToClipboard(this.selectedThemeCode);
			os.success();
		},

		uninstall() {
			removeTheme(this.selectedTheme);
			this.installedThemes = this.installedThemes.filter(t => t.id !== this.selectedThemeId);
			this.selectedThemeId = null;
			os.success();
		},
	}
});
</script>
