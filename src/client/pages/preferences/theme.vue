<template>
<section class="rfqxtzch _card">
	<div class="_title"><fa :icon="faPalette"/> {{ $t('theme') }}</div>
	<div class="_content">
		<div class="darkMode" :class="{ disabled: syncDeviceDarkMode }">
			<div class="toggleWrapper">
				<input type="checkbox" class="dn" id="dn" v-model="darkMode" :disabled="syncDeviceDarkMode"/>
				<label for="dn" class="toggle">
					<span class="before">{{ $t('light') }}</span>
					<span class="after">{{ $t('dark') }}</span>
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
	<div class="_content">
		<mk-select v-model="lightTheme">
			<template #label>{{ $t('themeForLightMode') }}</template>
			<optgroup :label="$t('lightThemes')">
				<option v-for="x in lightThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="$t('darkThemes')">
				<option v-for="x in darkThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
			</optgroup>
		</mk-select>
		<mk-select v-model="darkTheme">
			<template #label>{{ $t('themeForDarkMode') }}</template>
			<optgroup :label="$t('darkThemes')">
				<option v-for="x in darkThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="$t('lightThemes')">
				<option v-for="x in lightThemes" :value="x.id" :key="x.id">{{ x.name }}</option>
			</optgroup>
		</mk-select>
	</div>
	<div class="_content">
		<mk-switch v-model="syncDeviceDarkMode">{{ $t('syncDeviceDarkMode') }}</mk-switch>
	</div>
	<div class="_content">
		<mk-button primary v-if="wallpaper == null" @click="setWallpaper">{{ $t('setWallpaper') }}</mk-button>
		<mk-button primary v-else @click="wallpaper = null">{{ $t('removeWallpaper') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPalette } from '@fortawesome/free-solid-svg-icons';
import MkInput from '../../components/ui/input.vue';
import MkButton from '../../components/ui/button.vue';
import MkSelect from '../../components/ui/select.vue';
import MkSwitch from '../../components/ui/switch.vue';
import i18n from '../../i18n';
import { Theme, builtinThemes, applyTheme } from '../../theme';
import { selectFile } from '../../scripts/select-file';
import { isDeviceDarkmode } from '../../scripts/is-device-darkmode';

export default Vue.extend({
	i18n,

	components: {
		MkInput,
		MkButton,
		MkSelect,
		MkSwitch,
	},
	
	data() {
		return {
			wallpaper: localStorage.getItem('wallpaper'),
			faPalette
		}
	},

	computed: {
		themes(): Theme[] {
			return builtinThemes.concat(this.$store.state.device.themes);
		},

		installedThemes(): Theme[] {
			return this.$store.state.device.themes;
		},
	
		darkThemes(): Theme[] {
			return this.themes.filter(t => t.base == 'dark' || t.kind == 'dark');
		},

		lightThemes(): Theme[] {
			return this.themes.filter(t => t.base == 'light' || t.kind == 'light');
		},
		
		darkTheme: {
			get() { return this.$store.state.device.darkTheme; },
			set(value) { this.$store.commit('device/set', { key: 'darkTheme', value }); }
		},

		lightTheme: {
			get() { return this.$store.state.device.lightTheme; },
			set(value) { this.$store.commit('device/set', { key: 'lightTheme', value }); }
		},

		darkMode: {
			get() { return this.$store.state.device.darkMode; },
			set(value) { this.$store.commit('device/set', { key: 'darkMode', value }); }
		},

		syncDeviceDarkMode: {
			get() { return this.$store.state.device.syncDeviceDarkMode; },
			set(value) { this.$store.commit('device/set', { key: 'syncDeviceDarkMode', value }); }
		},
	},

	watch: {
		darkTheme() {
			if (this.$store.state.device.darkMode) {
				applyTheme(this.themes.find(x => x.id === this.darkTheme));
			}
		},

		lightTheme() {
			if (!this.$store.state.device.darkMode) {
				applyTheme(this.themes.find(x => x.id === this.lightTheme));
			}
		},

		syncDeviceDarkMode() {
			if (this.$store.state.device.syncDeviceDarkMode) {
				this.$store.commit('device/set', { key: 'darkMode', value: isDeviceDarkmode() });
			}
		},

		wallpaper() {
			if (this.wallpaper == null) {
				localStorage.removeItem('wallpaper');
			} else {
				localStorage.setItem('wallpaper', this.wallpaper);
			}
			location.reload();
		}
	},

	methods: {
		setWallpaper(e) {
			selectFile(this, e.currentTarget || e.target, null, false).then(file => {
				this.wallpaper = file.url;
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.rfqxtzch {
	> ._content {
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
}
</style>
