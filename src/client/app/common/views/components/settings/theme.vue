<template>
<ui-card>
	<template #title><fa icon="palette"/> {{ $t('theme') }}</template>
	<section class="nicnklzforebnpfgasiypmpdaaglujqm fit-top">
		<div class="dark">
			<div class="toggleWrapper">
				<input type="checkbox" class="dn" id="dn" v-model="darkmode"/>
				<label for="dn" class="toggle">
					<span class="toggle__handler">
						<span class="crater crater--1"></span>
						<span class="crater crater--2"></span>
						<span class="crater crater--3"></span>
					</span>
					<span class="star star--1"></span>
					<span class="star star--2"></span>
					<span class="star star--3"></span>
					<span class="star star--4"></span>
					<span class="star star--5"></span>
					<span class="star star--6"></span>
				</label>
			</div>
		</div>

		<label>
			<ui-select v-model="light" :placeholder="$t('light-theme')">
				<template #label><fa :icon="faSun"/> {{ $t('light-theme') }}</template>
				<optgroup :label="$t('light-themes')">
					<option v-for="x in lightThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
				</optgroup>
				<optgroup :label="$t('dark-themes')">
					<option v-for="x in darkThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
				</optgroup>
			</ui-select>
		</label>

		<label>
			<ui-select v-model="dark" :placeholder="$t('dark-theme')">
				<template #label><fa :icon="faMoon"/> {{ $t('dark-theme') }}</template>
				<optgroup :label="$t('dark-themes')">
					<option v-for="x in darkThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
				</optgroup>
				<optgroup :label="$t('light-themes')">
					<option v-for="x in lightThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
				</optgroup>
			</ui-select>
		</label>

		<a href="https://assets.msky.cafe/theme/list" target="_blank">{{ $t('find-more-theme') }}</a>

		<details class="creator">
			<summary><fa icon="palette"/> {{ $t('create-a-theme') }}</summary>
			<div>
				<span>{{ $t('base-theme') }}:</span>
				<ui-radio v-model="myThemeBase" value="light">{{ $t('base-theme-light') }}</ui-radio>
				<ui-radio v-model="myThemeBase" value="dark">{{ $t('base-theme-dark') }}</ui-radio>
			</div>
			<div>
				<ui-input v-model="myThemeName">
					<span>{{ $t('theme-name') }}</span>
				</ui-input>
				<ui-textarea v-model="myThemeDesc">
					<span>{{ $t('desc') }}</span>
				</ui-textarea>
			</div>
			<div>
				<div style="padding-bottom:8px;">{{ $t('primary-color') }}:</div>
				<color-picker v-model="myThemePrimary"/>
			</div>
			<div>
				<div style="padding-bottom:8px;">{{ $t('secondary-color') }}:</div>
				<color-picker v-model="myThemeSecondary"/>
			</div>
			<div>
				<div style="padding-bottom:8px;">{{ $t('text-color') }}:</div>
				<color-picker v-model="myThemeText"/>
			</div>
			<ui-button @click="preview()"><fa icon="eye"/> {{ $t('preview-created-theme') }}</ui-button>
			<ui-button primary @click="gen()"><fa :icon="['far', 'save']"/> {{ $t('save-created-theme') }}</ui-button>
		</details>

		<details>
			<summary><fa icon="download"/> {{ $t('install-a-theme') }}</summary>
			<ui-button @click="import_()"><fa icon="file-import"/> {{ $t('import') }}</ui-button>
			<input ref="file" type="file" accept=".misskeytheme" style="display:none;" @change="onUpdateImportFile"/>
			<p>{{ $t('import-by-code') }}:</p>
			<ui-textarea v-model="installThemeCode">
				<span>{{ $t('theme-code') }}</span>
			</ui-textarea>
			<ui-button @click="() => install(this.installThemeCode)"><fa icon="check"/> {{ $t('install') }}</ui-button>
		</details>

		<details>
			<summary><fa icon="folder-open"/> {{ $t('manage-themes') }}</summary>
			<ui-select v-model="selectedThemeId" :placeholder="$t('select-theme')">
				<optgroup :label="$t('builtin-themes')">
					<option v-for="x in builtinThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
				</optgroup>
				<optgroup :label="$t('my-themes')">
					<option v-for="x in installedThemes.filter(t => t.author == this.$store.state.i.username)" :value="x.id" :key="x.id">{{ x.name }}</option>
				</optgroup>
				<optgroup :label="$t('installed-themes')">
					<option v-for="x in installedThemes.filter(t => t.author != this.$store.state.i.username)" :value="x.id" :key="x.id">{{ x.name }}</option>
				</optgroup>
			</ui-select>
			<template v-if="selectedTheme">
				<ui-input readonly :value="selectedTheme.author">
					<span>{{ $t('author') }}</span>
				</ui-input>
				<ui-textarea v-if="selectedTheme.desc" readonly :value="selectedTheme.desc">
					<span>{{ $t('desc') }}</span>
				</ui-textarea>
				<ui-textarea readonly tall :value="selectedThemeCode">
					<span>{{ $t('theme-code') }}</span>
				</ui-textarea>
				<ui-button @click="export_()" link :download="`${selectedTheme.name}.misskeytheme`" ref="export"><fa icon="box"/> {{ $t('export') }}</ui-button>
				<ui-button @click="uninstall()" v-if="!builtinThemes.some(t => t.id == selectedTheme.id)"><fa :icon="['far', 'trash-alt']"/> {{ $t('uninstall') }}</ui-button>
			</template>
		</details>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { lightTheme, darkTheme, builtinThemes, applyTheme, Theme } from '../../../../theme';
import { Chrome } from 'vue-color';
import * as uuid from 'uuid';
import * as tinycolor from 'tinycolor2';
import * as JSON5 from 'json5';
import { faMoon, faSun } from '@fortawesome/free-regular-svg-icons';

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
	i18n: i18n('common/views/components/theme.vue'),
	components: {
		ColorPicker: Chrome
	},

	data() {
		return {
			builtinThemes: builtinThemes,
			installThemeCode: null,
			selectedThemeId: null,
			myThemeBase: 'light',
			myThemeName: '',
			myThemeDesc: '',
			myThemePrimary: lightTheme.vars.primary,
			myThemeSecondary: lightTheme.vars.secondary,
			myThemeText: lightTheme.vars.text,
			faMoon, faSun
		};
	},

	computed: {
		themes(): Theme[] {
			return builtinThemes.concat(this.$store.state.device.themes);
		},

		darkThemes(): Theme[] {
			return this.themes.filter(t => t.base == 'dark' || t.kind == 'dark');
		},

		lightThemes(): Theme[] {
			return this.themes.filter(t => t.base == 'light' || t.kind == 'light');
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

		selectedTheme() {
			if (this.selectedThemeId == null) return null;
			return this.themes.find(x => x.id == this.selectedThemeId);
		},

		selectedThemeCode() {
			if (this.selectedTheme == null) return null;
			return JSON5.stringify(this.selectedTheme, null, '\t');
		},

		myTheme(): any {
			return {
				name: this.myThemeName,
				author: this.$store.state.i.username,
				desc: this.myThemeDesc,
				base: this.myThemeBase,
				vars: {
					primary: tinycolor(typeof this.myThemePrimary == 'string' ? this.myThemePrimary : this.myThemePrimary.rgba).toRgbString(),
					secondary: tinycolor(typeof this.myThemeSecondary == 'string' ? this.myThemeSecondary : this.myThemeSecondary.rgba).toRgbString(),
					text: tinycolor(typeof this.myThemeText == 'string' ? this.myThemeText : this.myThemeText.rgba).toRgbString()
				}
			};
		},

		darkmode: {
			get() { return this.$store.state.device.darkmode; },
			set(value) { this.$store.commit('device/set', { key: 'darkmode', value }); }
		},
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
				this.$root.dialog({
					type: 'error',
					text: this.$t('invalid-theme')
				});
				return;
			}

			// 後方互換性のため
			if (theme.id == null && theme.meta != null) {
				theme = convertOldThemedefinition(theme);
			}

			if (theme.id == null) {
				this.$root.dialog({
					type: 'error',
					text: this.$t('invalid-theme')
				});
				return;
			}

			if (this.$store.state.device.themes.some(t => t.id == theme.id)) {
				this.$root.dialog({
					type: 'info',
					text: this.$t('already-installed')
				});
				return;
			}

			const themes = this.$store.state.device.themes.concat(theme);
			this.$store.commit('device/set', {
				key: 'themes', value: themes
			});

			this.$root.dialog({
				type: 'success',
				text: this.$t('installed').replace('{}', theme.name)
			});
		},

		uninstall() {
			const theme = this.selectedTheme;
			const themes = this.$store.state.device.themes.filter(t => t.id != theme.id);
			this.$store.commit('device/set', {
				key: 'themes', value: themes
			});

			this.$root.dialog({
				type: 'info',
				text: this.$t('uninstalled').replace('{}', theme.name)
			});
		},

		import_() {
			(this.$refs.file as any).click();
		}

		export_() {
			const blob = new Blob([this.selectedThemeCode], {
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

			if (theme.name == null || theme.name.trim() == '') {
				this.$root.dialog({
					type: 'warning',
					text: this.$t('theme-name-required')
				});
				return;
			}

			theme.id = uuid();

			const themes = this.$store.state.device.themes.concat(theme);
			this.$store.commit('device/set', {
				key: 'themes', value: themes
			});

			this.$root.dialog({
				type: 'success',
				text: this.$t('saved')
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.nicnklzforebnpfgasiypmpdaaglujqm
	> .dark
		margin-top 48px
		margin-bottom 110px

		.toggleWrapper {
			position: absolute;
			top: 50%;
			left: 50%;
			overflow: hidden;
			padding: 0 200px;
			transform: translate3d(-50%, -50%, 0);

			input {
				position: absolute;
				left: -99em;
			}
		}

		.toggle {
			cursor: pointer;
			display: inline-block;
			position: relative;
			width: 90px;
			height: 50px;
			background-color: #83D8FF;
			border-radius: 90px - 6;
			transition: background-color 200ms cubic-bezier(0.445, 0.05, 0.55, 0.95);

			&:before {
				content: 'Light';
				position: absolute;
				left: -60px;
				top: 15px;
				font-size: 18px;
				color: var(--primary);
			}

			&:after {
				content: 'Dark';
				position: absolute;
				right: -58px;
				top: 15px;
				font-size: 18px;
				color: var(--text);
			}
		}

		.toggle__handler {
			display: inline-block;
			position: relative;
			z-index: 1;
			top: 3px;
			left: 3px;
			width: 50px - 6;
			height: 50px - 6;
			background-color: #FFCF96;
			border-radius: 50px;
			box-shadow: 0 2px 6px rgba(0,0,0,.3);
			transition: all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
			transform:  rotate(-45deg);

			.crater {
				position: absolute;
				background-color: #E8CDA5;
				opacity: 0;
				transition: opacity 200ms ease-in-out;
				border-radius: 100%;
			}

			.crater--1 {
				top: 18px;
				left: 10px;
				width: 4px;
				height: 4px;
			}

			.crater--2 {
				top: 28px;
				left: 22px;
				width: 6px;
				height: 6px;
			}

			.crater--3 {
				top: 10px;
				left: 25px;
				width: 8px;
				height: 8px;
			}
		}

		.star {
			position: absolute;
			background-color: #ffffff;
			transition: all 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95);
			border-radius: 50%;
		}

		.star--1 {
			top: 10px;
			left: 35px;
			z-index: 0;
			width: 30px;
			height: 3px;
		}

		.star--2 {
			top: 18px;
			left: 28px;
			z-index: 1;
			width: 30px;
			height: 3px;
		}

		.star--3 {
			top: 27px;
			left: 40px;
			z-index: 0;
			width: 30px;
			height: 3px;
		}

		.star--4,
		.star--5,
		.star--6 {
			opacity: 0;
			transition: all 300ms 0 cubic-bezier(0.445, 0.05, 0.55, 0.95);
		}

		.star--4 {
			top: 16px;
			left: 11px;
			z-index: 0;
			width: 2px;
			height: 2px;
			transform: translate3d(3px,0,0);
		}

		.star--5 {
			top: 32px;
			left: 17px;
			z-index: 0;
			width: 3px;
			height: 3px;
			transform: translate3d(3px,0,0);
		}

		.star--6 {
			top: 36px;
			left: 28px;
			z-index: 0;
			width: 2px;
			height: 2px;
			transform: translate3d(3px,0,0);
		}

		input:checked {
			+ .toggle {
				background-color: #749DD6;

				&:before {
					color: var(--text);
				}

				&:after {
					color: var(--primary);
				}

				.toggle__handler {
					background-color: #FFE5B5;
					transform: translate3d(40px, 0, 0) rotate(0);

					.crater { opacity: 1; }
				}

				.star--1 {
					width: 2px;
					height: 2px;
				}

				.star--2 {
					width: 4px;
					height: 4px;
					transform: translate3d(-5px, 0, 0);
				}

				.star--3 {
					width: 2px;
					height: 2px;
					transform: translate3d(-7px, 0, 0);
				}

				.star--4,
				.star--5,
				.star--6 {
					opacity: 1;
					transform: translate3d(0,0,0);
				}
				.star--4 {
					transition: all 300ms 200ms cubic-bezier(0.445, 0.05, 0.55, 0.95);
				}
				.star--5 {
					transition: all 300ms 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95);
				}
				.star--6 {
					transition: all 300ms 400ms cubic-bezier(0.445, 0.05, 0.55, 0.95);
				}
			}
		}

	> a
		display block
		margin-top -16px
		margin-bottom 16px

	> details
		border-top solid var(--lineWidth) var(--faceDivider)

		> summary
			padding 16px 0

		> *:last-child
			margin-bottom 16px

	> .creator
		> div
			padding 16px 0
			border-bottom solid var(--lineWidth) var(--faceDivider)
</style>
