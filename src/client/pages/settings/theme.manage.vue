<template>
<FormBase>
	<FormSelect v-model:value="selectedThemeId">
		<template #label>{{ $ts.theme }}</template>
		<optgroup :label="$ts._theme.installedThemes">
			<option v-for="x in installedThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
		</optgroup>
		<optgroup :label="$ts._theme.builtinThemes">
			<option v-for="x in builtinThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
		</optgroup>
	</FormSelect>
	<template v-if="selectedTheme">
		<FormInput readonly :value="selectedTheme.author">
			<span>{{ $ts.author }}</span>
		</FormInput>
		<FormTextarea readonly tall :value="selectedThemeCode">
			<span>{{ $ts._theme.code }}</span>
			<template #desc><button @click="copyThemeCode()" class="_textButton">{{ $ts.copy }}</button></template>
		</FormTextarea>
		<FormButton @click="uninstall()" danger v-if="!builtinThemes.some(t => t.id == selectedTheme.id)"><Fa :icon="faTrashAlt"/> {{ $ts.uninstall }}</FormButton>
	</template>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPalette, faDownload, faFolderOpen, faCheck, faTrashAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import * as JSON5 from 'json5';
import FormTextarea from '@/components/form/textarea.vue';
import FormSelect from '@/components/form/select.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormInput from '@/components/form/input.vue';
import FormButton from '@/components/form/button.vue';
import { Theme, builtinThemes } from '@/scripts/theme';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import { getThemes, removeTheme } from '@/theme-store';

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
			INFO: {
				title: this.$ts._theme.manage,
				icon: faFolderOpen
			},
			installedThemes: getThemes(),
			builtinThemes,
			selectedThemeId: null,
			faPalette, faDownload, faFolderOpen, faCheck, faTrashAlt, faEye
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
		this.$emit('info', this.INFO);
	},

	methods: {
		copyThemeCode() {
			copyToClipboard(this.selectedThemeCode);
			os.success();
		},

		uninstall() {
			removeTheme(this.selectedTheme);
			this.selectedThemeId = null;
			os.success();
		},
	}
});
</script>
