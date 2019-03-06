<template>
<div class="mk-autocomplete" @contextmenu.prevent="() => {}">
	<ol class="users" ref="suggests" v-if="users.length > 0">
		<li v-for="user in users" @click="complete(type, user)" @keydown="onKeydown" tabindex="-1">
			<img class="avatar" :src="user.avatarUrl" alt=""/>
			<span class="name">
				<mk-user-name :user="user" :key="user.id"/>
			</span>
			<span class="username">@{{ user | acct }}</span>
		</li>
	</ol>
	<ol class="hashtags" ref="suggests" v-if="hashtags.length > 0">
		<li v-for="hashtag in hashtags" @click="complete(type, hashtag)" @keydown="onKeydown" tabindex="-1">
			<span class="name">{{ hashtag }}</span>
		</li>
	</ol>
	<ol class="emojis" ref="suggests" v-if="emojis.length > 0">
		<li v-for="emoji in emojis" @click="complete(type, emoji.emoji)" @keydown="onKeydown" tabindex="-1">
			<span class="emoji" v-if="emoji.isCustomEmoji"><img :src="emoji.url" :alt="emoji.emoji"/></span>
			<span class="emoji" v-else-if="!useOsDefaultEmojis"><img :src="emoji.url" :alt="emoji.emoji"/></span>
			<span class="emoji" v-else>{{ emoji.emoji }}</span>
			<span class="name" v-html="emoji.name.replace(q, `<b>${q}</b>`)"></span>
			<span class="alias" v-if="emoji.aliasOf">({{ emoji.aliasOf }})</span>
		</li>
	</ol>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as emojilib from 'emojilib';
import contains from '../../../common/scripts/contains';

type EmojiDef = {
	emoji: string;
	name: string;
	aliasOf?: string;
	url?: string;
	isCustomEmoji?: boolean;
};

const lib = Object.entries(emojilib.lib).filter((x: any) => {
	return x[1].category != 'flags';
});

const char2file = (char: string) => {
	let codes = Array.from(char).map(x => x.codePointAt(0).toString(16));
	if (!codes.includes('200d')) codes = codes.filter(x => x != 'fe0f');
	codes = codes.filter(x => x && x.length);
	return codes.join('-');
};

const emjdb: EmojiDef[] = lib.map((x: any) => ({
	emoji: x[1].char,
	name: x[0],
	aliasOf: null,
	url: `https://twemoji.maxcdn.com/2/svg/${char2file(x[1].char)}.svg`
}));

for (const x of lib as any) {
	if (x[1].keywords) {
		for (const k of x[1].keywords) {
			emjdb.push({
				emoji: x[1].char,
				name: k,
				aliasOf: x[0],
				url: `https://twemoji.maxcdn.com/2/svg/${char2file(x[1].char)}.svg`
			});
		}
	}
}

emjdb.sort((a, b) => a.name.length - b.name.length);

export default Vue.extend({
	props: ['type', 'q', 'textarea', 'complete', 'close', 'x', 'y'],

	data() {
		return {
			fetching: true,
			users: [],
			hashtags: [],
			emojis: [],
			select: -1,
			emojilib,
			emojiDb: [] as EmojiDef[]
		}
	},

	computed: {
		items(): HTMLCollection {
			return (this.$refs.suggests as Element).children;
		},

		useOsDefaultEmojis(): boolean {
			return this.$store.state.device.useOsDefaultEmojis;
		}
	},

	updated() {
		//#region 位置調整
		if (this.x + this.$el.offsetWidth > window.innerWidth) {
			this.$el.style.left = (window.innerWidth - this.$el.offsetWidth) + 'px';
		} else {
			this.$el.style.left = this.x + 'px';
		}

		if (this.y + this.$el.offsetHeight > window.innerHeight) {
			this.$el.style.top = (this.y - this.$el.offsetHeight) + 'px';
			this.$el.style.marginTop = '0';
		} else {
			this.$el.style.top = this.y + 'px';
			this.$el.style.marginTop = 'calc(1em + 8px)';
		}
		//#endregion
	},

	mounted() {
		//#region Construct Emoji DB
		const customEmojis = (this.$root.getMetaSync() || { emojis: [] }).emojis || [];
		const emojiDefinitions: EmojiDef[] = [];

		for (const x of customEmojis) {
			emojiDefinitions.push({
				name: x.name,
				emoji: `:${x.name}:`,
				url: x.url,
				isCustomEmoji: true
			});

			if (x.aliases) {
				for (const alias of x.aliases) {
					emojiDefinitions.push({
						name: alias,
						aliasOf: x.name,
						emoji: `:${x.name}:`,
						url: x.url,
						isCustomEmoji: true
					});
				}
			}
		}

		emojiDefinitions.sort((a, b) => a.name.length - b.name.length);

		this.emojiDb = emojiDefinitions.concat(emjdb);
		//#endregion

		this.textarea.addEventListener('keydown', this.onKeydown);

		for (const el of Array.from(document.querySelectorAll('body *'))) {
			el.addEventListener('mousedown', this.onMousedown);
		}

		this.$nextTick(() => {
			this.exec();

			this.$watch('q', () => {
				this.$nextTick(() => {
					this.exec();
				});
			});
		});
	},

	beforeDestroy() {
		this.textarea.removeEventListener('keydown', this.onKeydown);

		for (const el of Array.from(document.querySelectorAll('body *'))) {
			el.removeEventListener('mousedown', this.onMousedown);
		}
	},

	methods: {
		exec() {
			this.select = -1;
			if (this.$refs.suggests) {
				for (const el of Array.from(this.items)) {
					el.removeAttribute('data-selected');
				}
			}

			if (this.type == 'user') {
				const cacheKey = `autocomplete:user:${this.q}`;
				const cache = sessionStorage.getItem(cacheKey);
				if (cache) {
					const users = JSON.parse(cache);
					this.users = users;
					this.fetching = false;
				} else {
					this.$root.api('users/search', {
						query: this.q,
						limit: 10,
						detail: false
					}).then(users => {
						this.users = users;
						this.fetching = false;

						// キャッシュ
						sessionStorage.setItem(cacheKey, JSON.stringify(users));
					});
				}
			} else if (this.type == 'hashtag') {
				if (this.q == null || this.q == '') {
					this.hashtags = JSON.parse(localStorage.getItem('hashtags') || '[]');
					this.fetching = false;
				} else {
					const cacheKey = `autocomplete:hashtag:${this.q}`;
					const cache = sessionStorage.getItem(cacheKey);
					if (cache) {
						const hashtags = JSON.parse(cache);
						this.hashtags = hashtags;
						this.fetching = false;
					} else {
						this.$root.api('hashtags/search', {
							query: this.q,
							limit: 30
						}).then(hashtags => {
							this.hashtags = hashtags;
							this.fetching = false;

							// キャッシュ
							sessionStorage.setItem(cacheKey, JSON.stringify(hashtags));
						});
					}
				}
			} else if (this.type == 'emoji') {
				if (this.q == null || this.q == '') {
					this.emojis = this.emojiDb.filter(x => x.isCustomEmoji && !x.aliasOf).sort((a, b) => {
						var textA = a.name.toUpperCase();
						var textB = b.name.toUpperCase();
						return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
					});
					return;
				}

				const matched = [];
				const max = 30;

				this.emojiDb.some(x => {
					if (x.name.startsWith(this.q) && !x.aliasOf && !matched.some(y => y.emoji == x.emoji)) matched.push(x);
					return matched.length == max;
				});
				if (matched.length < max) {
					this.emojiDb.some(x => {
						if (x.name.startsWith(this.q) && !matched.some(y => y.emoji == x.emoji)) matched.push(x);
						return matched.length == max;
					});
				}
				if (matched.length < max) {
					this.emojiDb.some(x => {
						if (x.name.includes(this.q) && !matched.some(y => y.emoji == x.emoji)) matched.push(x);
						return matched.length == max;
					});
				}

				this.emojis = matched;
			}
		},

		onMousedown(e) {
			if (!contains(this.$el, e.target) && (this.$el != e.target)) this.close();
		},

		onKeydown(e) {
			const cancel = () => {
				e.preventDefault();
				e.stopPropagation();
			};

			switch (e.which) {
				case 10: // [ENTER]
				case 13: // [ENTER]
					if (this.select !== -1) {
						cancel();
						(this.items[this.select] as any).click();
					} else {
						this.close();
					}
					break;

				case 27: // [ESC]
					cancel();
					this.close();
					break;

				case 38: // [↑]
					if (this.select !== -1) {
						cancel();
						this.selectPrev();
					} else {
						this.close();
					}
					break;

				case 9: // [TAB]
				case 40: // [↓]
					cancel();
					this.selectNext();
					break;

				default:
					e.stopPropagation();
					this.textarea.focus();
			}
		},

		selectNext() {
			if (++this.select >= this.items.length) this.select = 0;
			this.applySelect();
		},

		selectPrev() {
			if (--this.select < 0) this.select = this.items.length - 1;
			this.applySelect();
		},

		applySelect() {
			for (const el of Array.from(this.items)) {
				el.removeAttribute('data-selected');
			}

			this.items[this.select].setAttribute('data-selected', 'true');
			(this.items[this.select] as any).focus();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-autocomplete
	position fixed
	z-index 65535
	max-width 100%
	margin-top calc(1em + 8px)
	overflow hidden
	background var(--faceHeader)
	border solid 1px rgba(#000, 0.1)
	border-radius 4px
	transition top 0.1s ease, left 0.1s ease

	> ol
		display block
		margin 0
		padding 4px 0
		max-height 190px
		max-width 500px
		overflow auto
		list-style none

		> li
			display flex
			align-items center
			padding 4px 12px
			white-space nowrap
			overflow hidden
			font-size 0.9em
			color rgba(#000, 0.8)
			cursor default

			&, *
				user-select none

			*
				overflow hidden
				text-overflow ellipsis

			&:hover
				background var(--autocompleteItemHoverBg)

			&[data-selected='true']
				background var(--primary)

				&, *
					color #fff !important

			&:active
				background var(--primaryDarken10)

				&, *
					color #fff !important

	> .users > li

		.avatar
			min-width 28px
			min-height 28px
			max-width 28px
			max-height 28px
			margin 0 8px 0 0
			border-radius 100%

		.name
			margin 0 8px 0 0
			color var(--autocompleteItemText)

		.username
			color var(--autocompleteItemTextSub)

	> .hashtags > li

		.name
			color var(--autocompleteItemText)

	> .emojis > li

		.emoji
			display inline-block
			margin 0 4px 0 0
			width 24px

			> img
				width 24px
				vertical-align bottom

		.name
			color var(--autocompleteItemText)

		.alias
			margin 0 0 0 8px
			color var(--autocompleteItemTextSub)
</style>
