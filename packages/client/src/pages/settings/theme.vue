<template>
<FormBase>
	<FormGroup>
		<div class="rfqxtzch _debobigegoItem _debobigegoPanel">
			<div class="darkMode">
				<div class="toggleWrapper">
					<input id="dn" v-model="darkMode" type="checkbox" class="dn"/>
					<label for="dn" class="toggle">
						<span class="before">{{ $ts.light }}</span>
						<span class="after">{{ $ts.dark }}</span>
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
		</div>
		<FormSwitch v-model="syncDeviceDarkMode">{{ $ts.syncDeviceDarkMode }}</FormSwitch>
	</FormGroup>

	<template v-if="darkMode">
		<FormSelect v-model="darkThemeId">
			<template #label>{{ $ts.themeForDarkMode }}</template>
			<optgroup :label="$ts.darkThemes">
				<option v-for="x in darkThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="$ts.lightThemes">
				<option v-for="x in lightThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
		</FormSelect>
		<FormSelect v-model="lightThemeId">
			<template #label>{{ $ts.themeForLightMode }}</template>
			<optgroup :label="$ts.lightThemes">
				<option v-for="x in lightThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="$ts.darkThemes">
				<option v-for="x in darkThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
		</FormSelect>
	</template>
	<template v-else>
		<FormSelect v-model="lightThemeId">
			<template #label>{{ $ts.themeForLightMode }}</template>
			<optgroup :label="$ts.lightThemes">
				<option v-for="x in lightThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="$ts.darkThemes">
				<option v-for="x in darkThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
		</FormSelect>
		<FormSelect v-model="darkThemeId">
			<template #label>{{ $ts.themeForDarkMode }}</template>
			<optgroup :label="$ts.darkThemes">
				<option v-for="x in darkThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="$ts.lightThemes">
				<option v-for="x in lightThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
		</FormSelect>
	</template>

	<FormButton v-if="wallpaper == null" primary @click="setWallpaper">{{ $ts.setWallpaper }}</FormButton>
	<FormButton v-else primary @click="wallpaper = null">{{ $ts.removeWallpaper }}</FormButton>

	<FormGroup>
		<FormLink to="https://assets.misskey.io/theme/list" external><template #icon><i class="fas fa-globe"></i></template>{{ $ts._theme.explore }}</FormLink>
		<FormLink to="/settings/theme/install"><template #icon><i class="fas fa-download"></i></template>{{ $ts._theme.install }}</FormLink>
	</FormGroup>

	<FormGroup>
		<FormLink to="/theme-editor"><template #icon><i class="fas fa-paint-roller"></i></template>{{ $ts._theme.make }}</FormLink>
		<!--<FormLink to="/advanced-theme-editor"><template #icon><i class="fas fa-paint-roller"></i></template>{{ $ts._theme.make }} ({{ $ts.advanced }})</FormLink>-->
	</FormGroup>

	<FormLink to="/settings/theme/manage"><template #icon><i class="fas fa-folder-open"></i></template>{{ $ts._theme.manage }}<template #suffix>{{ themesCount }}</template></FormLink>
</FormBase>
</template>

<script lang="ts">
import { computed, defineComponent, onActivated, onMounted, ref, watch } from 'vue';
import FormSwitch from '@/components/debobigego/switch.vue';
import FormSelect from '@/components/debobigego/select.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormButton from '@/components/debobigego/button.vue';
import { builtinThemes } from '@/scripts/theme';
import { selectFile } from '@/scripts/select-file';
import { isDeviceDarkmode } from '@/scripts/is-device-darkmode';
import { ColdDeviceStorage } from '@/store';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';
import { fetchThemes, getThemes } from '@/theme-store';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormSwitch,
		FormSelect,
		FormBase,
		FormGroup,
		FormLink,
		FormButton,
	},

	emits: ['info'],

	setup(props, { emit }) {
		const INFO = {
			title: i18n.locale.theme,
			icon: 'fas fa-palette',
				bg: 'var(--bg)',
		};

		const installedThemes = ref(getThemes());
		const themes = computed(() => builtinThemes.concat(installedThemes.value));
		const darkThemes = computed(() => themes.value.filter(t => t.base == 'dark' || t.kind == 'dark'));
		const lightThemes = computed(() => themes.value.filter(t => t.base == 'light' || t.kind == 'light'));
		const darkTheme = ColdDeviceStorage.ref('darkTheme');
		const darkThemeId = computed({
			get() {
				return darkTheme.value.id;
			},
			set(id) {
				ColdDeviceStorage.set('darkTheme', themes.value.find(x => x.id === id))
			}
		});
		const lightTheme = ColdDeviceStorage.ref('lightTheme');
		const lightThemeId = computed({
			get() {
				return lightTheme.value.id;
			},
			set(id) {
				ColdDeviceStorage.set('lightTheme', themes.value.find(x => x.id === id))
			}
		});
		const darkMode = computed(defaultStore.makeGetterSetter('darkMode'));
		const syncDeviceDarkMode = computed(ColdDeviceStorage.makeGetterSetter('syncDeviceDarkMode'));
		const wallpaper = ref(localStorage.getItem('wallpaper'));
		const themesCount = installedThemes.value.length;

		watch(syncDeviceDarkMode, () => {
			if (syncDeviceDarkMode.value) {
				defaultStore.set('darkMode', isDeviceDarkmode());
			}
		});

		watch(wallpaper, () => {
			if (wallpaper.value == null) {
				localStorage.removeItem('wallpaper');
			} else {
				localStorage.setItem('wallpaper', wallpaper.value);
			}
			location.reload();
		});

		onMounted(() => {
			emit('info', INFO);
		});

		onActivated(() => {
			fetchThemes().then(() => {
				installedThemes.value = getThemes();
			});
		});

		fetchThemes().then(() => {
			installedThemes.value = getThemes();
		});

		return {
			[symbols.PAGE_INFO]: INFO,
			darkThemes,
			lightThemes,
			darkThemeId,
			lightThemeId,
			darkMode,
			syncDeviceDarkMode,
			themesCount,
			wallpaper,
			setWallpaper(e) {
				selectFile(e.currentTarget || e.target, null, false).then(file => {
					wallpaper.value = file.url;
				});
			},
		};
	}
});
</script>

<style lang="scss" scoped>
.rfqxtzch {
	padding: 16px;

	> .darkMode {
		position: relative;
		padding: 32px 0;

		&.disabled {
			opacity: 0.7;

			&, * {
				cursor: not-allowed !important;
			}
		}

		.toggleWrapper {
			position: absolute;
			top: 50%;
			left: 50%;
			overflow: hidden;
			padding: 0 100px;
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
			transition: background-color 200ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;

			> .before, > .after {
				position: absolute;
				top: 15px;
				font-size: 18px;
				transition: color 1s ease;
			}

			> .before {
				left: -70px;
				color: var(--accent);
			}

			> .after {
				right: -68px;
				color: var(--fg);
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
			transition: all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
			transform:  rotate(-45deg);

			.crater {
				position: absolute;
				background-color: #E8CDA5;
				opacity: 0;
				transition: opacity 200ms ease-in-out !important;
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
			transition: all 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
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
			transition: all 300ms 0 cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
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

				> .before {
					color: var(--fg);
				}

				> .after {
					color: var(--accent);
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
					transition: all 300ms 200ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}

				.star--5 {
					transition: all 300ms 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}

				.star--6 {
					transition: all 300ms 400ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}
			}
		}
	}
}
</style>
