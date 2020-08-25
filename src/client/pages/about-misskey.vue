<template>
<div class="znqjceqz">
	<portal to="header">{{ $t('aboutMisskey') }}</portal>

	<section class="_card">
		<div class="_title">{{ $t('aboutMisskey') }}</div>
		<div class="_content" style="text-align: center;">
			<img src="/assets/icons/512.png" alt="" style="display: block; width: 100px; margin: 0 auto; border-radius: 16px;"/>
			<div style="margin-top: 0.75em;">Misskey</div>
			<div style="opacity: 0.5;">v{{ version }}</div>
		</div>
		<div class="_content">
			<div style="margin-bottom: 1em;">{{ $t('aboutMisskeyText') }}</div>
			<div>🛠️ {{ $t('misskeyMembers') }}</div>
			<ul class="members">
				<li><mk-link url="https://github.com/syuilo" class="at">@syuilo</mk-link></li>
				<li><mk-link url="https://github.com/AyaMorisawa" class="at">@AyaMorisawa</mk-link></li>
				<li><mk-link url="https://github.com/mei23" class="at">@mei23</mk-link></li>
				<li><mk-link url="https://github.com/acid-chicken" class="at">@acid-chicken</mk-link></li>
				<li><mk-link url="https://github.com/tamaina" class="at">@tamaina</mk-link></li>
				<li><mk-link url="https://github.com/rinsuki" class="at">@rinsuki</mk-link></li>
				<li><mk-link url="https://github.com/Xeltica" class="at">@Xeltica</mk-link></li>
				<li><mk-link url="https://github.com/u1-liquid" class="at">@u1-liquid</mk-link></li>
			</ul>
			<div style="margin-top: 1em;">📦 {{ $t('misskeySource') }}</div>
			<mk-url url="https://github.com/syuilo/misskey"/>
			<div style="margin-top: 1em;">🌏 {{ $t('misskeyTranslation') }}</div>
			<mk-url url="https://crowdin.com/project/misskey"/>
			<div style="margin-top: 1em;">💴 {{ $t('misskeyDonate') }}</div>
			<mk-url url="https://www.patreon.com/syuilo"/>
		</div>
		<div class="_content">
			<span><mfm text="<motion>❤</motion>"/> {{ $t('patrons') }}</span>
			<ul>
				<li>Gargron</li>
				<li>Satsuki Yanagi</li>
				<li>noellabo</li>
				<li>naga_rus</li>
				<li>Melilot</li>
				<li>AureoleArk</li>
				<li>Peter G.</li>
				<li>motcha</li>
				<li>Atsuko Tominaga</li>
				<li>dansup</li>
				<li>Nokotaro Takeda</li>
				<li>YUKIMOCHI</li>
				<li>nanami kan</li>
				<li>Hekovic</li>
				<li>wara</li>
				<li>Takashi Shibuya</li>
				<li>Noizeman</li>
				<li>mydarkstar</li>
				<li>nenohi</li>
				<li>Eduardo Quiros</li>
			</ul>
			<span>{{ $t('morePatrons') }}</span>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { version } from '../config';
import MkLink from '../components/link.vue';

export default defineComponent({
	components: {
		MkLink
	},

	metaInfo() {
		return {
			title: this.$t('aboutMisskey') as string
		};
	},

	data() {
		return {
			version,
			faInfoCircle
		}
	},
});
</script>
