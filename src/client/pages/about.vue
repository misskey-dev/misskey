<template>
<div class="mmnnbwxb">
	<portal to="icon"><fa :icon="faInfoCircle"/></portal>
	<portal to="title">{{ $t('about') }}</portal>

	<section class="_card info" v-if="meta">
		<div class="_title"><fa :icon="faInfoCircle"/> {{ $t('instanceInfo') }}</div>
		<div class="_content" v-if="meta.description">
			<div v-html="meta.description"></div>
		</div>
		<div class="_content table">
			<div><b>{{ $t('administrator') }}</b><span>{{ meta.maintainerName }}</span></div>
			<div><b></b><span>{{ meta.maintainerEmail }}</span></div>
		</div>
		<div class="_content table" v-if="stats">
			<div><b>{{ $t('users') }}</b><span>{{ stats.originalUsersCount | number }}</span></div>
			<div><b>{{ $t('notes') }}</b><span>{{ stats.originalNotesCount | number }}</span></div>
		</div>
		<div class="_content table">
			<div><b>Misskey</b><span>v{{ version }}</span></div>
		</div>
	</section>

	<section class="_card aboutMisskey">
		<div class="_title"><fa :icon="faInfoCircle"/> {{ $t('aboutMisskey') }}</div>
		<div class="_content">
			<div style="margin-bottom: 1em;">{{ $t('aboutMisskeyText') }}</div>
			<div>{{ $t('misskeyMembers') }}</div>
			<span class="members">
				<a href="https://github.com/syuilo" target="_blank" class="_link">@syuilo</a>
				<a href="https://github.com/AyaMorisawa" target="_blank" class="_link">@AyaMorisawa</a>
				<a href="https://github.com/mei23" target="_blank" class="_link">@mei23</a>
				<a href="https://github.com/acid-chicken" target="_blank" class="_link">@acid-chicken</a>
				<a href="https://github.com/tamaina" target="_blank" class="_link">@tamaina</a>
				<a href="https://github.com/rinsuki" target="_blank" class="_link">@rinsuki</a>
			</span>
			<div style="margin-top: 1em;">{{ $t('misskeySource') }}</div>
			<mk-url url="https://github.com/syuilo/misskey"/>
			<div style="margin-top: 1em;">{{ $t('misskeyTranslation') }}</div>
			<mk-url url="https://crowdin.com/project/misskey"/>
			<div style="margin-top: 1em;">{{ $t('misskeyDonate') }}</div>
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
			</ul>
			<span>{{ $t('morePatrons') }}</span>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { version } from '../config';
import i18n from '../i18n';

export default Vue.extend({
	i18n,

	metaInfo() {
		return {
			title: this.$t('instance') as string
		};
	},

	data() {
		return {
			version,
			stats: null,
			serverInfo: null,
			faInfoCircle
		}
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},
	},

	created() {
		this.$root.api('stats').then(res => {
			this.stats = res;
		});
	},
});
</script>

<style lang="scss" scoped>
.mmnnbwxb {
	> .info {
		> .table {
			> div {
				display: flex;

				> * {
					flex: 1;
				}
			}
		}
	}

	> .aboutMisskey {
		> ._content {
			> .members {
				> a {
					margin-right: 0.5em;
				}
			}
		}
	}
}
</style>
