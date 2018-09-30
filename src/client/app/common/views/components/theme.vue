<template>
<div class="nicnklzforebnpfgasiypmpdaaglujqm">
	<label>
		<span>%i18n:@light-theme%</span>
		<ui-select v-model="light" placeholder="%i18n:@light-theme%">
			<option v-for="x in themes" :value="x.meta.id" :key="x.meta.id">{{ x.meta.name }}</option>
		</ui-select>
	</label>

	<label>
		<span>%i18n:@dark-theme%</span>
		<ui-select v-model="dark" placeholder="%i18n:@dark-theme%">
			<option v-for="x in themes" :value="x.meta.id" :key="x.meta.id">{{ x.meta.name }}</option>
		</ui-select>
	</label>

	<details class="creator">
		<summary>%i18n:@create-a-theme%</summary>
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
		<ui-button @click="preview()">%i18n:@preview-created-theme%</ui-button>
		<ui-button primary @click="gen()">%i18n:@save-created-theme%</ui-button>
	</details>

	<details>
		<summary>%i18n:@install-a-theme%</summary>
		<ui-textarea v-model="installThemeCode">
			<span>%i18n:@theme-code%</span>
		</ui-textarea>
		<ui-button @click="install()">%i18n:@install%</ui-button>
	</details>

	<details>
		<summary>%i18n:@installed-themes%</summary>
		<ui-select v-model="selectedInstalledTheme" placeholder="%i18n:@select-theme%">
			<option v-for="x in installedThemes" :value="x.meta.id" :key="x.meta.id">{{ x.meta.name }}</option>
		</ui-select>
		<ui-textarea readonly :value="selectedInstalledThemeCode">
			<span>%i18n:@theme-code%</span>
		</ui-textarea>
		<ui-button @click="uninstall()">%i18n:@uninstall%</ui-button>
	</details>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { lightTheme, darkTheme, builtinThemes, applyTheme } from '../../../theme';
import { Chrome } from 'vue-color';
import * as uuid from 'uuid';
import * as tinycolor from 'tinycolor2';

export default Vue.extend({
	components: {
		ColorPicker: Chrome
	},

	data() {
		return {
			installThemeCode: null,
			selectedInstalledTheme: null,
			myThemeBase: 'light',
			myThemeName: '',
			myThemePrimary: lightTheme.meta.vars.primary,
			myThemeSecondary: lightTheme.meta.vars.secondary,
			myThemeText: lightTheme.meta.vars.text
		};
	},

	computed: {
		themes(): any {
			return this.$store.state.device.themes.concat(builtinThemes);
		},

		installedThemes(): any {
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

		selectedInstalledThemeCode() {
			if (this.selectedInstalledTheme == null) return null;
			return JSON.stringify(this.installedThemes.find(x => x.meta.id == this.selectedInstalledTheme));
		},

		myTheme(): any {
			return {
				meta: {
					name: this.myThemeName,
					author: this.$store.state.i.name,
					base: this.myThemeBase,
					vars: {
						primary: tinycolor(typeof this.myThemePrimary == 'string' ? this.myThemePrimary : this.myThemePrimary.rgba).toRgbString(),
						secondary: tinycolor(typeof this.myThemeSecondary == 'string' ? this.myThemeSecondary : this.myThemeSecondary.rgba).toRgbString(),
						text: tinycolor(typeof this.myThemeText == 'string' ? this.myThemeText : this.myThemeText.rgba).toRgbString()
					}
				}
			};
		}
	},

	watch: {
		myThemeBase(v) {
			const theme = v == 'light' ? lightTheme : darkTheme;
			this.myThemePrimary = theme.meta.vars.primary;
			this.myThemeSecondary = theme.meta.vars.secondary;
			this.myThemeText = theme.meta.vars.text;
		}
	},

	methods: {
		install() {
			const theme = JSON.parse(this.installThemeCode);
			if (theme.meta == null || theme.meta.id == null) {
				alert('%i18n:@invalid-theme%');
				return;
			}
			if (this.$store.state.device.themes.some(t => t.meta.id == theme.meta.id)) {
				alert('%i18n:@already-installed%');
				return;
			}
			const themes = this.$store.state.device.themes.concat(theme);
			this.$store.commit('device/set', {
				key: 'themes', value: themes
			});
			alert('%i18n:@installed%'.replace('{}', theme.meta.name));
		},

		uninstall() {
			const theme = this.installedThemes.find(x => x.meta.id == this.selectedInstalledTheme);
			const themes = this.$store.state.device.themes.filter(t => t.meta.id != theme.meta.id);
			this.$store.commit('device/set', {
				key: 'themes', value: themes
			});
			alert('%i18n:@uninstalled%'.replace('{}', theme.meta.name));
		},

		preview() {
			applyTheme(this.myTheme, false);
		},

		gen() {
			const theme = this.myTheme;
			theme.meta.id = uuid();
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
	> .creator
		> div
			padding 16px 0
			border-bottom solid 1px var(--faceDivider)
</style>
