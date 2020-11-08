<template>
<div class="mwysmxbg">
	<div class="_section">
		<div class="_content">
			<p>{{ $t('_mfm.intro') }}</p>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.mention') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.mentionDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_mention"/>
				<MkTextarea v-model:value="preview_mention"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.hashtag') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.hashtagDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_hashtag"/>
				<MkTextarea v-model:value="preview_hashtag"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.url') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.urlDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_url"/>
				<MkTextarea v-model:value="preview_url"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.link') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.linkDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_link"/>
				<MkTextarea v-model:value="preview_link"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.emoji') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.emojiDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_emoji"/>
				<MkTextarea v-model:value="preview_emoji"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.bold') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.boldDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_bold"/>
				<MkTextarea v-model:value="preview_bold"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.small') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.smallDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_small"/>
				<MkTextarea v-model:value="preview_small"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.quote') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.quoteDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_quote"/>
				<MkTextarea v-model:value="preview_quote"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.center') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.centerDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_center"/>
				<MkTextarea v-model:value="preview_center"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.inlineCode') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.inlineCodeDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_inlineCode"/>
				<MkTextarea v-model:value="preview_inlineCode"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.blockCode') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.blockCodeDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_blockCode"/>
				<MkTextarea v-model:value="preview_blockCode"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.inlineMath') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.inlineMathDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_inlineMath"/>
				<MkTextarea v-model:value="preview_inlineMath"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.search') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.searchDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_search"/>
				<MkTextarea v-model:value="preview_search"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.flip') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.flipDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_flip"/>
				<MkTextarea v-model:value="preview_flip"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.jelly') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.jellyDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_jelly"/>
				<MkTextarea v-model:value="preview_jelly"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.tada') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.tadaDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_tada"/>
				<MkTextarea v-model:value="preview_tada"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.jump') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.jumpDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_jump"/>
				<MkTextarea v-model:value="preview_jump"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.bounce') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.bounceDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_bounce"/>
				<MkTextarea v-model:value="preview_bounce"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.spin') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.spinDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_spin"/>
				<MkTextarea v-model:value="preview_spin"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.shake') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.shakeDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_shake"/>
				<MkTextarea v-model:value="preview_shake"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
	<div class="_section">
		<div class="_title">{{ $t('_mfm.twitch') }}</div>
		<div class="_content">
			<p>{{ $t('_mfm.twitchDescription') }}</p>
			<div class="preview _panel">
				<Mfm :text="preview_twitch"/>
				<MkTextarea v-model:value="preview_twitch"><span>MFM</span></MkTextarea>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import MkTextarea from '@/components/ui/textarea.vue';

export default defineComponent({
	components: {
		MkTextarea
	},

	data() {
		return {
			INFO: {
				title: this.$t('_mfm.cheatSheet'),
				icon: faQuestionCircle,
			},
			preview_mention: '@example',
			preview_hashtag: '#test',
			preview_url: `https://example.com`,
			preview_link: `[${this.$t('_mfm.dummy')}](https://example.com)`,
			preview_emoji: `:${this.$store.state.instance.meta.emojis[0].name}:`,
			preview_bold: `**${this.$t('_mfm.dummy')}**`,
			preview_small: `<small>${this.$t('_mfm.dummy')}</small>`,
			preview_center: `<center>${this.$t('_mfm.dummy')}</center>`,
			preview_inlineCode: '`<: "Hello, world!"`',
			preview_blockCode: '```\n~ (#i, 100) {\n\t<: ? ((i % 15) = 0) "FizzBuzz"\n\t\t.? ((i % 3) = 0) "Fizz"\n\t\t.? ((i % 5) = 0) "Buzz"\n\t\t. i\n}\n```',
			preview_inlineMath: '\\(x= \\frac{-b\' \\pm \\sqrt{(b\')^2-ac}}{a}\\)',
			preview_quote: `> ${this.$t('_mfm.dummy')}`,
			preview_search: `${this.$t('_mfm.dummy')} 検索`,
			preview_jelly: `[jelly 🍮]`,
			preview_tada: `[tada 🍮]`,
			preview_jump: `[jump 🍮]`,
			preview_bounce: `[bounce 🍮]`,
			preview_shake: `[shake 🍮]`,
			preview_twitch: `[twitch 🍮]`,
			preview_spin: `[spin 🍮] [spin.left 🍮] [spin.alternate 🍮]\n[spin.x 🍮] [spin.x,left 🍮] [spin.x,alternate 🍮]\n[spin.y 🍮] [spin.y,left 🍮] [spin.y,alternate 🍮]`,
			preview_flip: `[flip ${this.$t('_mfm.dummy')}]\n[flip.v ${this.$t('_mfm.dummy')}]\n[flip.h,v ${this.$t('_mfm.dummy')}]`,
		}
	},
});
</script>

<style lang="scss" scoped>
.mwysmxbg {
	.preview {
		padding: 16px;
	}
}
</style>
