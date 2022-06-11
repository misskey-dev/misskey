<template>
<div class="_formRoot">
	<div v-adaptive-border class="rfqxtzch _panel _formBlock">
		<div class="toggle">
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
		<div class="sync">
			<FormSwitch v-model="syncDeviceDarkMode">{{ $ts.syncDeviceDarkMode }}</FormSwitch>
		</div>
	</div>

	<template v-if="darkMode">
		<FormSelect v-model="darkThemeId" class="_formBlock">
			<template #label>{{ $ts.themeForDarkMode }}</template>
			<template #prefix><i class="fas fa-moon"></i></template>
			<optgroup :label="$ts.darkThemes">
				<option v-for="x in darkThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="$ts.lightThemes">
				<option v-for="x in lightThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
		</FormSelect>
		<FormSelect v-model="lightThemeId" class="_formBlock">
			<template #label>{{ $ts.themeForLightMode }}</template>
			<template #prefix><i class="fas fa-sun"></i></template>
			<optgroup :label="$ts.lightThemes">
				<option v-for="x in lightThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="$ts.darkThemes">
				<option v-for="x in darkThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
		</FormSelect>
	</template>
	<template v-else>
		<FormSelect v-model="lightThemeId" class="_formBlock">
			<template #label>{{ $ts.themeForLightMode }}</template>
			<template #prefix><i class="fas fa-sun"></i></template>
			<optgroup :label="$ts.lightThemes">
				<option v-for="x in lightThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="$ts.darkThemes">
				<option v-for="x in darkThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
		</FormSelect>
		<FormSelect v-model="darkThemeId" class="_formBlock">
			<template #label>{{ $ts.themeForDarkMode }}</template>
			<template #prefix><i class="fas fa-moon"></i></template>
			<optgroup :label="$ts.darkThemes">
				<option v-for="x in darkThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="$ts.lightThemes">
				<option v-for="x in lightThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
		</FormSelect>
	</template>

	<FormSection>
		<div class="_formLinksGrid">
			<FormLink to="/settings/theme/manage"><template #icon><i class="fas fa-folder-open"></i></template>{{ $ts._theme.manage }}<template #suffix>{{ themesCount }}</template></FormLink>
			<FormLink to="https://assets.misskey.io/theme/list" external><template #icon><i class="fas fa-globe"></i></template>{{ $ts._theme.explore }}</FormLink>
			<FormLink to="/settings/theme/install"><template #icon><i class="fas fa-download"></i></template>{{ $ts._theme.install }}</FormLink>
			<FormLink to="/theme-editor"><template #icon><i class="fas fa-paint-roller"></i></template>{{ $ts._theme.make }}</FormLink>
		</div>
	</FormSection>

	<FormButton v-if="wallpaper == null" class="_formBlock" @click="setWallpaper">{{ $ts.setWallpaper }}</FormButton>
	<FormButton v-else class="_formBlock" @click="wallpaper = null">{{ $ts.removeWallpaper }}</FormButton>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, ref, watch } from 'vue';
import JSON5 from 'json5';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormSection from '@/components/form/section.vue';
import FormLink from '@/components/form/link.vue';
import FormButton from '@/components/ui/button.vue';
import { getBuiltinThemesRef } from '@/scripts/theme';
import { selectFile } from '@/scripts/select-file';
import { isDeviceDarkmode } from '@/scripts/is-device-darkmode';
import { ColdDeviceStorage } from '@/store';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';
import { instance } from '@/instance';
import { uniqueBy } from '@/scripts/array';
import { fetchThemes, getThemes } from '@/theme-store';
import * as symbols from '@/symbols';

const installedThemes = ref(getThemes());
const builtinThemes = getBuiltinThemesRef();
const instanceThemes = [];

if (instance.defaultLightTheme != null) instanceThemes.push(JSON5.parse(instance.defaultLightTheme));
if (instance.defaultDarkTheme != null) instanceThemes.push(JSON5.parse(instance.defaultDarkTheme));

const themes = computed(() => uniqueBy([ ...instanceThemes, ...builtinThemes.value, ...installedThemes.value ], theme => theme.id));
const darkThemes = computed(() => themes.value.filter(t => t.base === 'dark' || t.kind === 'dark'));
const lightThemes = computed(() => themes.value.filter(t => t.base === 'light' || t.kind === 'light'));
const darkTheme = ColdDeviceStorage.ref('darkTheme');
const darkThemeId = computed({
	get() {
		return darkTheme.value.id;
	},
	set(id) {
		ColdDeviceStorage.set('darkTheme', themes.value.find(x => x.id === id));
	}
});
const lightTheme = ColdDeviceStorage.ref('lightTheme');
const lightThemeId = computed({
	get() {
		return lightTheme.value.id;
	},
	set(id) {
		ColdDeviceStorage.set('lightTheme', themes.value.find(x => x.id === id));
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

onActivated(() => {
	fetchThemes().then(() => {
		installedThemes.value = getThemes();
	});
});

fetchThemes().then(() => {
	installedThemes.value = getThemes();
});

function setWallpaper(event) {
	selectFile(event.currentTarget ?? event.target, null).then(file => {
		wallpaper.value = file.url;
	});
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.theme,
		icon: 'fas fa-palette',
		bg: 'var(--bg)',
	}
});
</script>

<style lang="scss" scoped>
.rfqxtzch {
	border-radius: 6px;

	> .toggle {
		position: relative;
		padding: 26px 0;
		text-align: center;

		&.disabled {
			opacity: 0.7;

			&, * {
				cursor: not-allowed !important;
			}
		}

		> .toggleWrapper {
			display: inline-block;
			text-align: left;
			overflow: clip;
			padding: 0 100px;

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

	> .sync {
		padding: 14px 16px;
		border-top: solid 0.5px var(--divider);
	}
}
</style>
