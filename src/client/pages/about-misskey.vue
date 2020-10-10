<template>
<div class="znqjceqz">
	<section class="_section">
		<div class="_content" style="text-align: center;">
			<img src="/assets/icons/512.png" alt="" style="display: block; width: 100px; margin: 0 auto; border-radius: 16px;"/>
			<div style="margin-top: 0.75em;">Misskey</div>
			<div style="opacity: 0.5;">v{{ version }}</div>
		</div>
	</section>
	<section class="_section">
		<div class="_content">
			<div style="text-align: center;">{{ $t('aboutMisskeyText') }}</div>
		</div>
	</section>
	<section class="_section">
		<div class="_content" style="text-align: center;">
			<div>📦 {{ $t('misskeySource') }}</div>
			<MkUrl url="https://github.com/syuilo/misskey"/>
			<div style="margin-top: 1em;">🌏 {{ $t('misskeyTranslation') }}</div>
			<MkUrl url="https://crowdin.com/project/misskey"/>
			<div style="margin-top: 1em;">💴 {{ $t('misskeyDonate') }}</div>
			<MkUrl url="https://www.patreon.com/syuilo"/>
		</div>
	</section>
	<section class="_section">
		<div class="_content" style="text-align: center;">
			<div>🛠️ {{ $t('misskeyMembers') }}</div>
			<ul class="members" style="list-style: none; padding: 0; margin: 1em 0 0 0;">
				<li><MkLink url="https://github.com/syuilo" class="at">@syuilo</MkLink></li>
				<li><MkLink url="https://github.com/AyaMorisawa" class="at">@AyaMorisawa</MkLink></li>
				<li><MkLink url="https://github.com/mei23" class="at">@mei23</MkLink></li>
				<li><MkLink url="https://github.com/acid-chicken" class="at">@acid-chicken</MkLink></li>
				<li><MkLink url="https://github.com/tamaina" class="at">@tamaina</MkLink></li>
				<li><MkLink url="https://github.com/rinsuki" class="at">@rinsuki</MkLink></li>
				<li><MkLink url="https://github.com/Xeltica" class="at">@Xeltica</MkLink></li>
				<li><MkLink url="https://github.com/u1-liquid" class="at">@u1-liquid</MkLink></li>
			</ul>
		</div>
	</section>
	<section class="_section">
		<div class="_content">
			<div class="_card">
				<div class="_title"><Mfm text="<motion>❤</motion>"/> {{ $t('patrons') }}</div>
				<div class="_content">
					<ul style="margin: 0;">
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
				</div>
				<div class="_footer">{{ $t('morePatrons') }}</div>
			</div>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { version } from '@/config';
import MkLink from '@/components/link.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkLink
	},

	data() {
		return {
			info: {
				header: [{
					title: this.$t('aboutMisskey'),
					icon: null
				}]
			},
			version,
			faInfoCircle
		}
	},
});
</script>
