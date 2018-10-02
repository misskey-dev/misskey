<template>
<div class="nicnklzforebnpfgasiypmpdaaglujqm">
	<label>
		<span>%i18n:@light-theme%</span>
		<ui-select v-model="light" placeholder="%i18n:@light-theme%">
			<option v-for="x in themes" :value="x.id" :key="x.id">{{ x.name }}</option>
		</ui-select>
	</label>

	<label>
		<span>%i18n:@dark-theme%</span>
		<ui-select v-model="dark" placeholder="%i18n:@dark-theme%">
			<option v-for="x in themes" :value="x.id" :key="x.id">{{ x.name }}</option>
		</ui-select>
	</label>

	<details class="creator">
		<summary>%fa:palette% %i18n:@create-a-theme%</summary>
		<div>
			<span>%i18n:@base-theme%:</span>
			<ui-radio v-model="myThemeBase" value="light">%i18n:@base-theme-light%</ui-radio>
			<ui-radio v-model="myThemeBase" value="dark">%i18n:@base-theme-dark%</ui-radio>
		</div>
		<div>
			<ui-input v-model="myThemeName">
				<span>%i18n:@theme-name%</span>
			</ui-input>
		</div>
		<div>
			<div style="padding-bottom:8px;">%i18n:@primary-color%:</div>
			<color-picker v-model="myThemePrimary"/>
		</div>
		<div>
			<div style="padding-bottom:8px;">%i18n:@secondary-color%:</div>
			<color-picker v-model="myThemeSecondary"/>
		</div>
		<div>
			<div style="padding-bottom:8px;">%i18n:@text-color%:</div>
			<color-picker v-model="myThemeText"/>
		</div>
		<ui-button @click="preview()">%fa:eye% %i18n:@preview-created-theme%</ui-button>
		<ui-button primary @click="gen()">%fa:save R% %i18n:@save-created-theme%</ui-button>
	</details>

	<details>
		<summary>%fa:download% %i18n:@install-a-theme%</summary>
		<ui-button @click="import_()">%fa:file-import% %i18n:@import%</ui-button>
		<input ref="file" type="file" accept=".misskeytheme" style="display:none;" @change="onUpdateImportFile"/>
		<p>%i18n:@import-by-code%:</p>
		<ui-textarea v-model="installThemeCode">
			<span>%i18n:@theme-code%</span>
		</ui-textarea>
		<ui-button @click="() => install(this.installThemeCode)">%fa:check% %i18n:@install%</ui-button>
	</details>

	<details>
		<summary>%fa:folder-open% %i18n:@installed-themes%</summary>
		<ui-select v-model="selectedInstalledThemeId" placeholder="%i18n:@select-theme%">
			<option v-for="x in installedThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
		</ui-select>
		<template v-if="selectedInstalledTheme">
			<ui-input readonly :value="selectedInstalledTheme.author">
				<span>%i18n:@author%</span>
			</ui-input>
			<ui-textarea v-if="selectedInstalledTheme.desc" readonly :value="selectedInstalledTheme.desc">
				<span>%i18n:@desc%</span>
			</ui-textarea>
			<ui-textarea readonly :value="selectedInstalledThemeCode">
				<span>%i18n:@theme-code%</span>
			</ui-textarea>
			<ui-button @click="export_()" link :download="`${selectedInstalledTheme.name}.misskeytheme`" ref="export">%fa:box% %i18n:@export%</ui-button>
			<ui-button @click="uninstall()">%fa:trash-alt R% %i18n:@uninstall%</ui-button>
		</template>
	</details>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { lightTheme, darkTheme, builtinThemes, applyTheme, Theme } from '../../../theme';
import { Chrome } from 'vue-color';
import * as uuid from 'uuid';
import * as tinycolor from 'tinycolor2';
import * as JSON5 from 'json5';

// 後方互換性のため
function convertOldThemedefinition(t) {
	const t2 = {
		id: t.meta.id,
		name: t.meta.name,
		author: t.meta.author,
		base: t.meta.base,
		vars: t.meta.vars,
		props: t
	};
	delete t2.props.meta;
	return t2;
}

export default Vue.extend({
	components: {
		ColorPicker: Chrome
	},

	data() {
		return {
			installThemeCode: null,
			selectedInstalledThemeId: null,
			myThemeBase: 'light',
			myThemeName: '',
			myThemePrimary: lightTheme.vars.primary,
			myThemeSecondary: lightTheme.vars.secondary,
			myThemeText: lightTheme.vars.text
		};
	},

	computed: {
		themes(): Theme[] {
			return this.$store.state.device.themes.concat(builtinThemes);
		},

		installedThemes(): Theme[] {
			return this.$store.state.device.themes;
		},

		light: {
			get() { return this.$store.state.device.lightTheme; },
			set(value) { this.$store.commit('device/set', { key: 'lightTheme', value }); }
		},

		dark: {
			get() { return this.$store.state.device.darkTheme; },
			set(value) { this.$store.commit('device/set', { key: 'darkTheme', value }); }
		},

		selectedInstalledTheme() {
			if (this.selectedInstalledThemeId == null) return null;
			return this.installedThemes.find(x => x.id == this.selectedInstalledThemeId);
		},

		selectedInstalledThemeCode() {
			if (this.selectedInstalledTheme == null) return null;
			return JSON5.stringify(this.selectedInstalledTheme, null, '\t');
		},

		myTheme(): any {
			return {
				name: this.myThemeName,
				author: this.$store.state.i.username,
				base: this.myThemeBase,
				vars: {
					primary: tinycolor(typeof this.myThemePrimary == 'string' ? this.myThemePrimary : this.myThemePrimary.rgba).toRgbString(),
					secondary: tinycolor(typeof this.myThemeSecondary == 'string' ? this.myThemeSecondary : this.myThemeSecondary.rgba).toRgbString(),
					text: tinycolor(typeof this.myThemeText == 'string' ? this.myThemeText : this.myThemeText.rgba).toRgbString()
				}
			};
		}
	},

	watch: {
		myThemeBase(v) {
			const theme = v == 'light' ? lightTheme : darkTheme;
			this.myThemePrimary = theme.vars.primary;
			this.myThemeSecondary = theme.vars.secondary;
			this.myThemeText = theme.vars.text;
		}
	},

	beforeCreate() {
		// migrate old theme definitions
		// 後方互換性のため
		this.$store.commit('device/set', {
			key: 'themes', value: this.$store.state.device.themes.map(t => {
				if (t.id == null) {
					return convertOldThemedefinition(t);
				} else {
					return t;
				}
			})
		});
	},

	methods: {
		install(code) {
			let theme;

			try {
				theme = JSON5.parse(code);
			} catch (e) {
				alert('%i18n:@invalid-theme%');
				return;
			}

			// 後方互換性のため
			if (theme.id == null && theme.meta != null) {
				theme = convertOldThemedefinition(theme);
			}

			if (theme.id == null) {
				alert('%i18n:@invalid-theme%');
				return;
			}

			if (this.$store.state.device.themes.some(t => t.id == theme.id)) {
				alert('%i18n:@already-installed%');
				return;
			}

			const themes = this.$store.state.device.themes.concat(theme);
			this.$store.commit('device/set', {
				key: 'themes', value: themes
			});

			alert('%i18n:@installed%'.replace('{}', theme.name));
		},

		uninstall() {
			const theme = this.selectedInstalledTheme;
			const themes = this.$store.state.device.themes.filter(t => t.id != theme.id);
			this.$store.commit('device/set', {
				key: 'themes', value: themes
			});
			alert('%i18n:@uninstalled%'.replace('{}', theme.name));
		},

		import_() {
			(this.$refs.file as any).click();
		}

		export_() {
			const blob = new Blob([this.selectedInstalledThemeCode], {
				type: 'application/json5'
			});
			this.$refs.export.$el.href = window.URL.createObjectURL(blob);
		},

		onUpdateImportFile() {
			const f = (this.$refs.file as any).files[0];

			const reader = new FileReader();

			reader.onload = e => {
				this.install(e.target.result);
			};

			reader.readAsText(f);
		},

		preview() {
			applyTheme(this.myTheme, false);
		},

		gen() {
			const theme = this.myTheme;
			theme.id = uuid();
			const themes = this.$store.state.device.themes.concat(theme);
			this.$store.commit('device/set', {
				key: 'themes', value: themes
			});
			alert('%i18n:@saved%');
		}
	}
});
</script>

<style lang="stylus" scoped>
.nicnklzforebnpfgasiypmpdaaglujqm
	> details
		border-top solid 1px var(--faceDivider)

		> summary
			padding 16px 0

		> *:last-child
			margin-bottom 16px

	> .creator
		> div
			padding 16px 0
			border-bottom solid 1px var(--faceDivider)
</style>
