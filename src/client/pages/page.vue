<template>
<div class="xcukqgmh _root" v-if="page" :key="page.id" v-size="{ max: [450] }">
	<div class="_block main">
		<!--
		<div class="header">
			<h1>{{ page.title }}</h1>
		</div>
		-->
		<div class="banner">
			<img :src="page.eyeCatchingImage.url" v-if="page.eyeCatchingImageId"/>
		</div>
		<div class="content">
			<XPage :page="page"/>
			<small style="display: block; opacity: 0.7; margin-top: 1em;">@{{ page.user.username }}</small>
		</div>
		<div class="like">
			<MkButton class="button" @click="unlike()" v-if="page.isLiked" v-tooltip="$ts._pages.unlike" primary><i class="fas fa-heart"></i><span class="count" v-if="page.likedCount > 0">{{ page.likedCount }}</span></MkButton>
			<MkButton class="button" @click="like()" v-else v-tooltip="$ts._pages.like"><i class="far fa-heart"></i><span class="count" v-if="page.likedCount > 0">{{ page.likedCount }}</span></MkButton>
		</div>
		<div class="links">
			<MkA :to="`/@${username}/pages/${pageName}/view-source`" class="link">{{ $ts._pages.viewSource }}</MkA>
			<template v-if="$i && $i.id === page.userId">
				<MkA :to="`/pages/edit/${page.id}`" class="link">{{ $ts._pages.editThisPage }}</MkA>
				<button v-if="$i.pinnedPageId === page.id" @click="pin(false)" class="link _textButton">{{ $ts.unpin }}</button>
				<button v-else @click="pin(true)" class="link _textButton">{{ $ts.pin }}</button>
			</template>
		</div>
	</div>
	<div class="footer">
		<div><i class="far fa-clock"></i> {{ $ts.createdAt }}: <MkTime :time="page.createdAt" mode="detail"/></div>
		<div v-if="page.createdAt != page.updatedAt"><i class="far fa-clock"></i> {{ $ts.updatedAt }}: <MkTime :time="page.updatedAt" mode="detail"/></div>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import XPage from '@client/components/page/page.vue';
import MkButton from '@client/components/ui/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		XPage,
		MkButton,
	},

	props: {
		pageName: {
			type: String,
			required: true
		},
		username: {
			type: String,
			required: true
		},
	},

	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => this.page ? {
				title: computed(() => this.page.title || this.page.name),
				avatar: this.page.user,
				path: `/@${this.page.user.username}/pages/${this.page.name}`,
				share: {
					title: this.page.title || this.page.name,
					text: this.page.summary,
				},
			} : null),
			page: null,
		};
	},

	computed: {
		path(): string {
			return this.username + '/' + this.pageName;
		}
	},

	watch: {
		path() {
			this.fetch();
		}
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			os.api('pages/show', {
				name: this.pageName,
				username: this.username,
			}).then(page => {
				this.page = page;
			});
		},

		like() {
			os.apiWithDialog('pages/like', {
				pageId: this.page.id,
			}).then(() => {
				this.page.isLiked = true;
				this.page.likedCount++;
			});
		},

		async unlike() {
			const confirm = await os.dialog({
				type: 'warning',
				showCancelButton: true,
				text: this.$ts.unlikeConfirm,
			});
			if (confirm.canceled) return;
			os.apiWithDialog('pages/unlike', {
				pageId: this.page.id,
			}).then(() => {
				this.page.isLiked = false;
				this.page.likedCount--;
			});
		},

		pin(pin) {
			os.apiWithDialog('i/update', {
				pinnedPageId: pin ? this.page.id : null,
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.xcukqgmh {
	--padding: 32px;

	&.max-width_450px {
		--padding: 16px;
	}

	> .main {
		> .header {
			padding: 16px;

			> h1 {
				margin: 0;
			}
		}

		> .banner {
			> img {
				display: block;
				width: 100%;
				height: 120px;
				object-fit: cover;
			}
		}

		> .content {
			padding: var(--padding);
		}

		> .like {
			padding: var(--padding);
			border-top: solid 0.5px var(--divider);

			> .button {
				--accent: rgb(216 71 106);
				--X8: rgb(241 92 128);
				--buttonBg: rgb(216 71 106 / 5%);
				--buttonHoverBg: rgb(216 71 106 / 10%);

				::v-deep(.count) {
					margin-left: 0.5em;
				}
			}
		}

		> .links {
			padding: var(--padding);
			border-top: solid 0.5px var(--divider);

			> .link {
				margin-right: 0.75em;
			}
		}
	}

	> .footer {
		margin: var(--padding);
		font-size: 85%;
		opacity: 0.75;
	}
}
</style>
