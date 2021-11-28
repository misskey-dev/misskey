<template>
<div style="overflow: clip;">
	<MkSpacer :content-max="600" :margin-min="20">
		<div class="_formRoot znqjceqz">
			<div id="debug"></div>
			<div ref="about" v-panel class="_formBlock about" :class="{ playing: easterEggEngine != null }">
				<img src="/client-assets/about-icon.png" alt="" class="icon" draggable="false" @load="iconLoaded" @click="gravity"/>
				<div class="misskey">Misskey</div>
				<div class="version">v{{ version }}</div>
				<span v-for="emoji in easterEggEmojis" :key="emoji.id" class="emoji" :data-physics-x="emoji.left" :data-physics-y="emoji.top" :class="{ _physics_circle_: !emoji.emoji.startsWith(':') }"><MkEmoji class="emoji" :emoji="emoji.emoji" :custom-emojis="$instance.emojis" :is-reaction="false" :normal="true" :no-style="true"/></span>
			</div>
			<div class="_formBlock" style="text-align: center;">
				{{ $ts._aboutMisskey.about }}<br><a href="https://misskey-hub.net/docs/misskey.html" target="_blank" class="_link">{{ $ts.learnMore }}</a>
			</div>
			<FormSection>
				<div class="_formLinks">
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
				</div>
			</FormSection>
			<FormSection>
				<template #label>{{ $ts._aboutMisskey.contributors }}</template>
				<div class="_formLinks">
					<FormLink to="https://github.com/syuilo" external>@syuilo</FormLink>
					<FormLink to="https://github.com/AyaMorisawa" external>@AyaMorisawa</FormLink>
					<FormLink to="https://github.com/mei23" external>@mei23</FormLink>
					<FormLink to="https://github.com/acid-chicken" external>@acid-chicken</FormLink>
					<FormLink to="https://github.com/tamaina" external>@tamaina</FormLink>
					<FormLink to="https://github.com/rinsuki" external>@rinsuki</FormLink>
					<FormLink to="https://github.com/Xeltica" external>@Xeltica</FormLink>
					<FormLink to="https://github.com/u1-liquid" external>@u1-liquid</FormLink>
					<FormLink to="https://github.com/marihachi" external>@marihachi</FormLink>
				</div>
				<template #caption><MkLink url="https://github.com/misskey-dev/misskey/graphs/contributors">{{ $ts._aboutMisskey.allContributors }}</MkLink></template>
			</FormSection>
			<FormSection>
				<template #label><Mfm text="$[jelly ❤]"/> {{ $ts._aboutMisskey.patrons }}</template>
				<div v-for="patron in patrons" :key="patron">{{ patron }}</div>
				<template #caption>{{ $ts._aboutMisskey.morePatrons }}</template>
			</FormSection>
		</div>
	</MkSpacer>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { version } from '@/config';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkKeyValue from '@/components/key-value.vue';
import MkLink from '@/components/link.vue';
import { physics } from '@/scripts/physics';
import * as symbols from '@/symbols';

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
		FormSection,
		FormLink,
		MkKeyValue,
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
			this.easterEggEngine = physics(this.$refs.about);
		}
	}
});
</script>

<style lang="scss" scoped>
.znqjceqz {
	> .about {
		position: relative;
		text-align: center;
		padding: 16px;
		border-radius: var(--radius);

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
</style>
