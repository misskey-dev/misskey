<template>
<div style="overflow: clip;">
	<FormBase class="znqjceqz">
		<div id="debug"></div>
		<section class="_formItem about">
			<div class="_formPanel panel" :class="{ playing: easterEggEngine != null }" ref="about">
				<img src="/static-assets/client/about-icon.png" alt="" class="icon" ref="icon" @load="iconLoaded" draggable="false"/>
				<div class="misskey">Misskey</div>
				<div class="version">v{{ version }}</div>
				<span class="emoji" v-for="emoji in easterEggEmojis" :key="emoji.id" :data-physics-x="emoji.left" :data-physics-y="emoji.top" :class="{ _physics_circle_: !emoji.emoji.startsWith(':') }"><MkEmoji class="emoji" :emoji="emoji.emoji" :custom-emojis="$instance.emojis" :is-reaction="false" :normal="true" :no-style="true"/></span>
			</div>
		</section>
		<section class="_formItem" style="text-align: center; padding: 0 16px;" @click="gravity">
			{{ $ts._aboutMisskey.about }}
		</section>
		<FormGroup>
			<FormLink to="https://github.com/misskey-dev/misskey" external>
				<template #icon><i class="fas fa-code"></i></template>
				{{ $ts._aboutMisskey.source }}
				<template #suffix>GitHub</template>
			</FormLink>
			<FormLink to="https://crowdin.com/project/misskey" external>
				<template #icon><i class="fas fa-language"></i></template>
				{{ $ts._aboutMisskey.translation }}
				<template #suffix>Crowdin</template>
			</FormLink>
			<FormLink to="https://www.patreon.com/syuilo" external>
				<template #icon><i class="fas fa-hand-holding-medical"></i></template>
				{{ $ts._aboutMisskey.donate }}
				<template #suffix>Patreon</template>
			</FormLink>
		</FormGroup>
		<FormGroup>
			<template #label>{{ $ts._aboutMisskey.contributors }}</template>
			<FormLink to="https://github.com/syuilo" external>@syuilo</FormLink>
			<FormLink to="https://github.com/AyaMorisawa" external>@AyaMorisawa</FormLink>
			<FormLink to="https://github.com/mei23" external>@mei23</FormLink>
			<FormLink to="https://github.com/acid-chicken" external>@acid-chicken</FormLink>
			<FormLink to="https://github.com/tamaina" external>@tamaina</FormLink>
			<FormLink to="https://github.com/rinsuki" external>@rinsuki</FormLink>
			<FormLink to="https://github.com/Xeltica" external>@Xeltica</FormLink>
			<FormLink to="https://github.com/u1-liquid" external>@u1-liquid</FormLink>
			<FormLink to="https://github.com/marihachi" external>@marihachi</FormLink>
			<template #caption><MkLink url="https://github.com/misskey-dev/misskey/graphs/contributors">{{ $ts._aboutMisskey.allContributors }}</MkLink></template>
		</FormGroup>
		<FormGroup>
			<template #label><Mfm text="[jelly ❤]"/> {{ $ts._aboutMisskey.patrons }}</template>
			<FormKeyValueView v-for="patron in patrons" :key="patron"><template #key>{{ patron }}</template></FormKeyValueView>
			<template #caption>{{ $ts._aboutMisskey.morePatrons }}</template>
		</FormGroup>
	</FormBase>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VanillaTilt from 'vanilla-tilt';
import { version } from '@client/config';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormKeyValueView from '@client/components/form/key-value-view.vue';
import MkLink from '@client/components/link.vue';
import { physics } from '@client/scripts/physics.ts';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

const patrons = [
	'Satsuki Yanagi',
	'noellabo',
	'mametsuko',
	'AureoleArk',
	'Gargron',
	'Nokotaro Takeda',
	'Suji Yan',
	'Hekovic',
	'Gitmo Life Services',
	'nenohi',
	'naga_rus',
	'Melilot',
	'Efertone',
	'oi_yekssim',
	'nanami kan',
	'motcha',
	'dansup',
	'Quinton Macejkovic',
	'YUKIMOCHI',
	'mewl hayabusa',
	'makokunsan',
	'Peter G.',
	'Nesakko',
	'regtan',
	'見当かなみ',
	'natalie',
	'Jerry',
	'takimura',
	'sikyosyounin',
	'YuzuRyo61',
	'sheeta.s',
	'osapon',
	'mkatze',
	'CG',
	'nafuchoco',
	'Takumi Sugita',
	'chidori ninokura',
	'mydarkstar',
	'kiritan',
	'kabo2468y',
	'weepjp',
	'Liaizon Wakest',
	'Steffen K9',
	'Roujo',
	'uroco @99',
	'totokoro',
	'public_yusuke',
	'wara',
	'S Y',
	'Denshi',
	'Osushimaru',
	'吴浥',
	'DignifiedSilence',
	't_w',
];

export default defineComponent({
	components: {
		FormBase,
		FormGroup,
		FormLink,
		FormKeyValueView,
		MkLink,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.aboutMisskey,
				icon: null
			},
			version,
			patrons,
			easterEggReady: false,
			easterEggEmojis: [],
			easterEggEngine: null,
		}
	},

	mounted() {
		VanillaTilt.init(this.$refs.icon, {
			max: 30,
			perspective: 500,
			scale: 1.125,
			speed: 1000,
		});
	},

	beforeUnmount() {
		if (this.easterEggEngine) {
			this.easterEggEngine.stop();
		}
	},

	methods: {
		iconLoaded() {
			const emojis = this.$store.state.reactions;
			const containerWidth = this.$refs.about.offsetWidth;
			for (let i = 0; i < 32; i++) {
				this.easterEggEmojis.push({
					id: i.toString(),
					top: -(128 + (Math.random() * 256)),
					left: (Math.random() * containerWidth),
					emoji: emojis[Math.floor(Math.random() * emojis.length)],
				});
			}

			this.$nextTick(() => {
				this.easterEggReady = true;
			});
		},

		gravity() {
			if (!this.easterEggReady) return;
			this.easterEggReady = false;
			this.$refs.icon.vanillaTilt.destroy();
			this.easterEggEngine = physics(this.$refs.about);
		}
	}
});
</script>

<style lang="scss" scoped>
.znqjceqz {
	max-width: 800px;
	box-sizing: border-box;
	margin: 0 auto;

	> .about {
		> .panel {
			position: relative;
			text-align: center;
			padding: 16px;

			&.playing {
				&, * {
					user-select: none;
				}

				* {
					will-change: transform;
				}

				> .emoji {
					visibility: visible;
				}
			}

			> .icon {
				display: block;
				width: 100px;
				margin: 0 auto;
				border-radius: 16px;
			}

			> .misskey {
				margin: 0.75em auto 0 auto;
				width: max-content;
			}

			> .version {
				margin: 0 auto;
				width: max-content;
				opacity: 0.5;
			}

			> .emoji {
				position: absolute;
				top: 0;
				left: 0;
				visibility: hidden;

				> .emoji {
					pointer-events: none;
					font-size: 24px;
					width: 24px;
				}
			}
		}
	}
}
</style>
