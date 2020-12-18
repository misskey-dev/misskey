<template>
<div class="t9makv94">
	<section class="_section">
		<div class="_content">
			<details>
				<summary>{{ $t('import') }}</summary>
				<MkTextarea v-model:value="themeToImport">
					{{ $t('_theme.importInfo') }}
				</MkTextarea>
				<MkButton :disabled="!themeToImport.trim()" @click="importTheme">{{ $t('import') }}</MkButton>
			</details>
		</div>
	</section>
	<section class="_section">
		<div class="_content _card _vMargin">
			<div class="_content">
				<MkInput v-model:value="name" required><span>{{ $t('name') }}</span></MkInput>
				<MkInput v-model:value="author" required><span>{{ $t('author') }}</span></MkInput>
				<MkTextarea v-model:value="description"><span>{{ $t('description') }}</span></MkTextarea>
				<div class="_inputs">
					<div v-text="$t('_theme.base')" />
					<MkRadio v-model="baseTheme" value="light">{{ $t('light') }}</MkRadio>
					<MkRadio v-model="baseTheme" value="dark">{{ $t('dark') }}</MkRadio>
				</div>
			</div>
		</div>
		<div class="_content _card _vMargin">
			<div class="list-view _content">
				<div class="item" v-for="([ k, v ], i) in theme" :key="k">
					<div class="_inputs">
						<div>
							{{ k.startsWith('$') ? `${k} (${$t('_theme.constant')})` : $t('_theme.keys.' + k) }}
							<button v-if="k.startsWith('$')" class="_button _link" @click="del(i)" v-text="$t('delete')" />
						</div>
						<div>
							<div class="type" @click="chooseType($event, i)">
								{{ getTypeOf(v) }} <Fa :icon="faChevronDown"/>
							</div>
							<!-- default -->
							<div v-if="v === null" v-text="baseProps[k]" class="default-value" />
							<!-- color -->
							<div v-else-if="typeof v === 'string'" class="color">
								<input type="color" :value="v" @input="colorChanged($event.target.value, i)"/>
								<MkInput class="select" :value="v" @update:value="colorChanged($event, i)"/>
							</div>
							<!-- ref const -->
							<MkInput v-else-if="v.type === 'refConst'" v-model:value="v.key">
								<template #prefix>$</template>
								<span>{{ $t('name') }}</span>
							</MkInput>
							<!-- ref props -->
							<MkSelect class="select" v-else-if="v.type === 'refProp'" v-model:value="v.key">
								<option v-for="key in themeProps" :value="key" :key="key">{{ $t('_theme.keys.' + key) }}</option>
							</MkSelect>
							<!-- func -->
							<template v-else-if="v.type === 'func'">
								<MkSelect class="select" v-model:value="v.name">
									<template #label>{{ $t('_theme.funcKind') }}</template>
									<option v-for="n in ['alpha', 'darken', 'lighten']" :value="n" :key="n">{{ $t('_theme.' + n) }}</option>
								</MkSelect>
								<MkInput type="number" v-model:value="v.arg"><span>{{ $t('_theme.argument') }}</span></MkInput>
								<MkSelect class="select" v-model:value="v.value">
									<template #label>{{ $t('_theme.basedProp') }}</template>
									<option v-for="key in themeProps" :value="key" :key="key">{{ $t('_theme.keys.' + key) }}</option>
								</MkSelect>
							</template>
							<!-- CSS -->
							<MkInput v-else-if="v.type === 'css'" v-model:value="v.value">
								<span>CSS</span>
							</MkInput>
						</div>
					</div>
				</div>
				<MkButton primary @click="addConst">{{ $t('_theme.addConstant') }}</MkButton>
			</div>
		</div>
	</section>
	<section class="_section">
		<details class="_content">
			<summary>{{ $t('sample') }}</summary>
			<MkSample/>
		</details>
	</section>
	<section class="_section">
		<div class="_content">
			<MkButton inline @click="preview">{{ $t('preview') }}</MkButton>
			<MkButton inline primary :disabled="!name || !author" @click="save">{{ $t('save') }}</MkButton>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPalette, faChevronDown, faKeyboard } from '@fortawesome/free-solid-svg-icons';
import * as JSON5 from 'json5';
import { toUnicode } from 'punycode';

import MkRadio from '@/components/ui/radio.vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import MkSelect from '@/components/ui/select.vue';
import MkSample from '@/components/sample.vue';

import { convertToMisskeyTheme, ThemeValue, convertToViewModel, ThemeViewModel } from '@/scripts/theme-editor';
import { Theme, applyTheme, lightTheme, darkTheme, themeProps, validateTheme } from '@/scripts/theme';
import { host } from '@/config';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';

export default defineComponent({
	components: {
		MkRadio,
		MkButton,
		MkInput,
		MkTextarea,
		MkSelect,
		MkSample,
	},

	data() {
		return {
			INFO: {
				title: this.$t('themeEditor'),
				icon: faPalette,
			},
			theme: [] as ThemeViewModel,
			name: '',
			description: '',
			baseTheme: 'light' as 'dark' | 'light',
			author: `@${this.$i.username}@${toUnicode(host)}`,
			themeToImport: '',
			changed: false,
			lightTheme, darkTheme, themeProps,
			faPalette, faChevronDown, faKeyboard,
		}
	},

	computed: {
		baseProps() {
			return this.baseTheme === 'light' ? this.lightTheme.props : this.darkTheme.props;
		},
	},

	beforeUnmount() {
		window.removeEventListener('beforeunload', this.beforeunload);
	},

	async beforeRouteLeave(to, from, next) {
		if (this.changed && !(await this.confirm())) {
			next(false);
		} else {
			next();
		}
	},

	mounted() {
		this.init();
		window.addEventListener('beforeunload', this.beforeunload);
		const changed = () => this.changed = true;
		this.$watch('name', changed);
		this.$watch('description', changed);
		this.$watch('baseTheme', changed);
		this.$watch('author', changed);
		this.$watch('theme', changed);
	},

	methods: {
		beforeunload(e: BeforeUnloadEvent) {
			if (this.changed) {
				e.preventDefault();
				e.returnValue = '';
			}
		},

		async confirm(): Promise<boolean> {
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$t('leaveConfirm'),
				showCancelButton: true
			});
			return !canceled;
		},

		init() {
			const t: ThemeViewModel = [];
			for (const key of themeProps) {
				t.push([ key, null ]);
			}
			this.theme = t;
		},
	
		async del(i: number) {
			const { canceled } = await os.dialog({ 
				type: 'warning',
				showCancelButton: true,
				text: this.$t('_theme.deleteConstantConfirm', { const: this.theme[i][0] }),
			});
			if (canceled) return;
			Vue.delete(this.theme, i);
		},
	
		async addConst() {
			const { canceled, result } = await os.dialog({
				title: this.$t('_theme.inputConstantName'),
				input: true
			});
			if (canceled) return;
			this.theme.push([ '$' + result, '#000000']);
		},
	
		save() {
			const theme = convertToMisskeyTheme(this.theme, this.name, this.description, this.author, this.baseTheme);
			const themes = ColdDeviceStorage.get('themes').concat(theme);
			ColdDeviceStorage.set('themes', themes);
			os.dialog({
				type: 'success',
				text: this.$t('_theme.installed', { name: theme.name })
			});
			this.changed = false;
		},
	
		preview() {
			const theme = convertToMisskeyTheme(this.theme, this.name, this.description, this.author, this.baseTheme);
			try {
				applyTheme(theme, false);
			} catch (e) {
				os.dialog({
					type: 'error',
					text: e.message
				});
			}
		},
	
		async importTheme() {
			if (this.changed && (!await this.confirm())) return;

			try {
				const theme = JSON5.parse(this.themeToImport) as Theme;
				if (!validateTheme(theme)) throw new Error(this.$t('_theme.invalid'));

				this.name = theme.name;
				this.description = theme.desc || '';
				this.author = theme.author;
				this.baseTheme = theme.base || 'light';
				this.theme = convertToViewModel(theme);
				this.themeToImport = '';
			} catch (e) {
				os.dialog({
					type: 'error',
					text: e.message
				});
			}
		},
	
		colorChanged(color: string, i: number) {
			this.theme[i] = [this.theme[i][0], color];
		},

		getTypeOf(v: ThemeValue) {
			return v === null
				? this.$t('_theme.defaultValue')
				: typeof v === 'string'
					? this.$t('_theme.color')
					: this.$t('_theme.' + v.type);
		},
	
		async chooseType(e: MouseEvent, i: number) {
			const newValue = await this.showTypeMenu(e);
			this.theme[i] = [ this.theme[i][0], newValue ];
		},
	
		showTypeMenu(e: MouseEvent) {
			return new Promise<ThemeValue>((resolve) => {
				os.modalMenu([{
					text: this.$t('_theme.defaultValue'),
					action: () => resolve(null),
				}, {
					text: this.$t('_theme.color'),
					action: () => resolve('#000000'),
				}, {
					text: this.$t('_theme.func'),
					action: () => resolve({
						type: 'func', name: 'alpha', arg: 1, value: 'accent'
					}),
				}, {
					text: this.$t('_theme.refProp'),
					action: () => resolve({
						type: 'refProp', key: 'accent',
					}),
				}, {
					text: this.$t('_theme.refConst'),
					action: () => resolve({
						type: 'refConst', key: '',
					}),
				}, {
					text: 'CSS',
					action: () => resolve({
						type: 'css', value: '',
					}),
				}], e.currentTarget || e.target);
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.t9makv94 {
	> ._section {
		> ._content {
			> .list-view {
				> .item {
					min-height: 48px;
					word-break: break-all;

					&:not(:last-child) {
						margin-bottom: 8px;
					}

					.select {
						margin: 24px 0;
					}

					.type {
						cursor: pointer;
					}

					.default-value {
						opacity: 0.6;
						pointer-events: none;
						user-select: none;
					}

					.color {
						> input {
							display: inline-block;
							width: 1.5em;
							height: 1.5em;
						}

						> div {
							margin-left: 8px;
							display: inline-block;
						}
					}
				}
			}
		}
	}
}
</style>
