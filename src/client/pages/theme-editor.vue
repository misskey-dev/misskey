<template>
<FormBase class="cwepdizn">
	<div class="_formItem colorPicker">
		<div class="_formLabel">{{ $ts.backgroundColor }}</div>
		<div class="_formPanel colors">
			<div class="row">
				<button v-for="color in bgColors.filter(x => x.kind === 'light')" :key="color.color" @click="setBgColor(color)" class="color _button" :class="{ active: theme.props.bg === color.color }">
					<div class="preview" :style="{ background: color.forPreview }"></div>
				</button>
			</div>
			<div class="row">
				<button v-for="color in bgColors.filter(x => x.kind === 'dark')" :key="color.color" @click="setBgColor(color)" class="color _button" :class="{ active: theme.props.bg === color.color }">
					<div class="preview" :style="{ background: color.forPreview }"></div>
				</button>
			</div>
		</div>
	</div>
	<div class="_formItem colorPicker">
		<div class="_formLabel">{{ $ts.accentColor }}</div>
		<div class="_formPanel colors">
			<div class="row">
				<button v-for="color in accentColors" :key="color" @click="setAccentColor(color)" class="color rounded _button" :class="{ active: theme.props.accent === color }">
					<div class="preview" :style="{ background: color }"></div>
				</button>
			</div>
		</div>
	</div>
	<div class="_formItem colorPicker">
		<div class="_formLabel">{{ $ts.textColor }}</div>
		<div class="_formPanel colors">
			<div class="row">
				<button v-for="color in fgColors" :key="color" @click="setFgColor(color)" class="color char _button" :class="{ active: (theme.props.fg === color.forLight) || (theme.props.fg === color.forDark) }">
					<div class="preview" :style="{ color: color.forPreview ? color.forPreview : theme.base === 'light' ? '#5f5f5f' : '#dadada' }">A</div>
				</button>
			</div>
		</div>
	</div>
	<FormGroup v-if="codeEnabled">
		<FormTextarea v-model:value="themeCode" tall>
			<span>{{ $ts._theme.code }}</span>
		</FormTextarea>
		<FormButton @click="applyThemeCode" primary>{{ $ts.apply }}</FormButton>
	</FormGroup>
	<FormButton v-else @click="codeEnabled = true"><Fa :icon="faCode"/> {{ $ts.editCode }}</FormButton>
	<FormGroup>
		<FormButton @click="showPreview"><Fa :icon="faEye"/> {{ $ts.preview }}</FormButton>
		<FormButton @click="saveAs" primary><Fa :icon="faSave"/> {{ $ts.saveAs }}</FormButton>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPalette, faSave, faEye, faCode } from '@fortawesome/free-solid-svg-icons';
import { toUnicode } from 'punycode/';
import * as tinycolor from 'tinycolor2';
import { v4 as uuid} from 'uuid';
import * as JSON5 from 'json5';

import FormBase from '@client/components/form/base.vue';
import FormButton from '@client/components/form/button.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormGroup from '@client/components/form/group.vue';

import { Theme, applyTheme, validateTheme, darkTheme, lightTheme } from '@client/scripts/theme';
import { host } from '@client/config';
import * as os from '@client/os';
import { ColdDeviceStorage } from '@client/store';
import { addTheme } from '@client/theme-store';

export default defineComponent({
	components: {
		FormBase,
		FormButton,
		FormTextarea,
		FormGroup,
	},

	data() {
		return {
			INFO: {
				title: this.$ts.themeEditor,
				icon: faPalette,
			},
			theme: {
				base: 'light',
				props: lightTheme.props
			} as Theme,
			codeEnabled: false,
			themeCode: null,
			bgColors: [
				{ color: '#f5f5f5', kind: 'light', forPreview: '#f5f5f5' },
				{ color: '#f0eee9', kind: 'light', forPreview: '#f3e2b9' },
				{ color: '#e9eff0', kind: 'light', forPreview: '#bfe3e8' },
				{ color: '#f0e9ee', kind: 'light', forPreview: '#f1d1e8' },
				{ color: '#dce2e0', kind: 'light', forPreview: '#a4dccc' },
				{ color: '#e2e0dc', kind: 'light', forPreview: '#d8c7a5' },
				{ color: '#d5dbe0', kind: 'light', forPreview: '#b0cae0' },
				{ color: '#dad5d5', kind: 'light', forPreview: '#d6afaf' },
				{ color: '#2b2b2b', kind: 'dark', forPreview: '#444444' },
				{ color: '#362e29', kind: 'dark', forPreview: '#735c4d' },
				{ color: '#303629', kind: 'dark', forPreview: '#506d2f' },
				{ color: '#293436', kind: 'dark', forPreview: '#258192' },
				{ color: '#2e2936', kind: 'dark', forPreview: '#504069' },
				{ color: '#252722', kind: 'dark', forPreview: '#3c462f' },
				{ color: '#212525', kind: 'dark', forPreview: '#303e3e' },
				{ color: '#191919', kind: 'dark', forPreview: '#272727' },
			],
			accentColors: ['#e36749', '#f29924', '#98c934', '#34c9a9', '#34a1c9', '#606df7', '#8d34c9', '#e84d83'],
			fgColors: [
				{ color: 'none', forLight: '#5f5f5f', forDark: '#dadada', forPreview: null },
				{ color: 'red', forLight: '#7f6666', forDark: '#e4d1d1', forPreview: '#ca4343' },
				{ color: 'yellow', forLight: '#736955', forDark: '#e0d5c0', forPreview: '#d49923' },
				{ color: 'green', forLight: '#586d5b', forDark: '#d1e4d4', forPreview: '#4cbd5c' },
				{ color: 'cyan', forLight: '#5d7475', forDark: '#d1e3e4', forPreview: '#2abdc3' },
				{ color: 'blue', forLight: '#676880', forDark: '#d1d2e4', forPreview: '#7275d8' },
				{ color: 'pink', forLight: '#84667d', forDark: '#e4d1e0', forPreview: '#b12390' },
			],
			changed: false,
			faPalette, faSave, faEye, faCode,
		}
	},

	created() {
		this.$watch('theme', this.apply, { deep: true });
		window.addEventListener('beforeunload', this.beforeunload);
	},

	beforeUnmount() {
		window.removeEventListener('beforeunload', this.beforeunload);
	},

	async beforeRouteLeave(to, from) {
		if (this.changed && !(await this.leaveConfirm())) {
			return false;
		}
	},

	methods: {
		beforeunload(e: BeforeUnloadEvent) {
			if (this.changed) {
				e.preventDefault();
				e.returnValue = '';
			}
		},

		async leaveConfirm(): Promise<boolean> {
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$ts.leaveConfirm,
				showCancelButton: true
			});
			return !canceled;
		},

		showPreview() {
			os.pageWindow('preview');
		},

		setBgColor(color) {
			if (this.theme.base != color.kind) {
				const base = color.kind === 'dark' ? darkTheme : lightTheme;
				for (const prop of Object.keys(base.props)) {
					if (prop === 'accent') continue;
					if (prop === 'fg') continue;
					this.theme.props[prop] = base.props[prop];
				}
			}
			this.theme.base = color.kind;
			this.theme.props.bg = color.color;

			if (this.theme.props.fg) {
				const matchedFgColor = this.fgColors.find(x => [tinycolor(x.forLight).toRgbString(), tinycolor(x.forDark).toRgbString()].includes(tinycolor(this.theme.props.fg).toRgbString()));
				if (matchedFgColor) this.setFgColor(matchedFgColor);
			}
		},

		setAccentColor(color) {
			this.theme.props.accent = color;
		},

		setFgColor(color) {
			this.theme.props.fg = this.theme.base === 'light' ? color.forLight : color.forDark;
		},

		apply() {
			this.themeCode = JSON5.stringify(this.theme, null, '\t');
			applyTheme(this.theme, false);
			this.changed = true;
		},

		applyThemeCode() {
			let parsed;

			try {
				parsed = JSON5.parse(this.themeCode);
			} catch (e) {
				os.dialog({
					type: 'error',
					text: this.$ts._theme.invalid
				});
				return;
			}

			this.theme = parsed;
		},

		async saveAs() {
			const { canceled, result: name } = await os.dialog({
				title: this.$ts.name,
				input: {
					allowEmpty: false
				}
			});
			if (canceled) return;

			this.theme.id = uuid();
			this.theme.name = name;
			this.theme.author = `@${this.$i.username}@${toUnicode(host)}`;
			addTheme(this.theme);
			applyTheme(this.theme);
			if (this.$store.state.darkMode) {
				ColdDeviceStorage.set('darkTheme', this.theme.id);
			} else {
				ColdDeviceStorage.set('lightTheme', this.theme.id);
			}
			this.changed = false;
			os.dialog({
				type: 'success',
				text: this.$t('_theme.installed', { name: this.theme.name })
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.cwepdizn {
	max-width: 800px;
	margin: 0 auto;

	> .colorPicker {
		> .colors {
			padding: 32px;
			text-align: center;

			> .row {
				> .color {
					display: inline-block;
					position: relative;
					width: 64px;
					height: 64px;
					border-radius: 8px;

					> .preview {
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						bottom: 0;
						margin: auto;
						width: 42px;
						height: 42px;
						border-radius: 4px;
						box-shadow: 0 2px 4px rgb(0 0 0 / 30%);
						transition: transform 0.15s ease;
					}

					&:hover {
						> .preview {
							transform: scale(1.1);
						}
					}

					&.active {
						box-shadow: 0 0 0 2px var(--divider) inset;
					}

					&.rounded {
						border-radius: 999px;

						> .preview {
							border-radius: 999px;
						}
					}

					&.char {
						line-height: 42px;
					}
				}
			}
		}
	}
}
</style>
