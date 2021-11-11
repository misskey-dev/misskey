<template>
<div class="thvuemwp" :class="{ isMe }" v-size="{ max: [400, 500] }">
	<MkAvatar class="avatar" :user="message.user" :show-indicator="true"/>
	<div class="content">
		<div class="balloon" :class="{ noText: message.text == null }" >
			<button class="delete-button" v-if="isMe" :title="$ts.delete" @click="del">
				<img src="/static-assets/client/remove.png" alt="Delete"/>
			</button>
			<div class="content" v-if="!message.isDeleted">
				<Mfm class="text" v-if="message.text" ref="text" :text="message.text" :i="$i"/>
				<div class="file" v-if="message.file">
					<a :href="message.file.url" rel="noopener" target="_blank" :title="message.file.name">
						<img v-if="message.file.type.split('/')[0] == 'image'" :src="message.file.url" :alt="message.file.name"/>
						<p v-else>{{ message.file.name }}</p>
					</a>
				</div>
			</div>
			<div class="content" v-else>
				<p class="is-deleted">{{ $ts.deleted }}</p>
			</div>
		</div>
		<div></div>
		<MkUrlPreview v-for="url in urls" :url="url" :key="url" style="margin: 8px 0;"/>
		<footer>
			<template v-if="isGroup">
				<span class="read" v-if="message.reads.length > 0">{{ $ts.messageRead }} {{ message.reads.length }}</span>
			</template>
			<template v-else>
				<span class="read" v-if="isMe && message.isRead">{{ $ts.messageRead }}</span>
			</template>
			<MkTime :time="message.createdAt"/>
			<template v-if="message.is_edited"><i class="fas fa-pencil-alt"></i></template>
		</footer>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as mfm from 'mfm-js';
import { extractUrlFromMfm } from '@/misc/extract-url-from-mfm';
import MkUrlPreview from '@client/components/url-preview.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		MkUrlPreview
	},
	props: {
		message: {
			required: true
		},
		isGroup: {
			required: false
		}
	},
	computed: {
		isMe(): boolean {
			return this.message.userId === this.$i.id;
		},
		urls(): string[] {
			if (this.message.text) {
				return extractUrlFromMfm(mfm.parse(this.message.text));
			} else {
				return [];
			}
		}
	},
	methods: {
		del() {
			os.api('messaging/messages/delete', {
				messageId: this.message.id
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.thvuemwp {
	$me-balloon-color: var(--accent);

	position: relative;
	background-color: transparent;
	display: flex;

	> .avatar {
		position: sticky;
		top: calc(var(--stickyTop, 0px) + 16px);
		display: block;
		width: 54px;
		height: 54px;
		transition: all 0.1s ease;
	}

	> .content {
		min-width: 0;

		> .balloon {
			position: relative;
			display: inline-flex;
			align-items: center;
			padding: 0;
			min-height: 38px;
			border-radius: 16px;
			max-width: 100%;

			&:before {
				content: "";
				pointer-events: none;
				display: block;
				position: absolute;
				top: 12px;
			}

			& + * {
				clear: both;
			}

			&:hover {
				> .delete-button {
					display: block;
				}
			}

			> .delete-button {
				display: none;
				position: absolute;
				z-index: 1;
				top: -4px;
				right: -4px;
				margin: 0;
				padding: 0;
				cursor: pointer;
				outline: none;
				border: none;
				border-radius: 0;
				box-shadow: none;
				background: transparent;

				> img {
					vertical-align: bottom;
					width: 16px;
					height: 16px;
					cursor: pointer;
				}
			}

			> .content {
				max-width: 100%;

				> .is-deleted {
					display: block;
					margin: 0;
					padding: 0;
					overflow: hidden;
					overflow-wrap: break-word;
					font-size: 1em;
					color: rgba(#000, 0.5);
				}

				> .text {
					display: block;
					margin: 0;
					padding: 12px 18px;
					overflow: hidden;
					overflow-wrap: break-word;
					word-break: break-word;
					font-size: 1em;
					color: rgba(#000, 0.8);

					& + .file {
						> a {
							border-radius: 0 0 16px 16px;
						}
					}
				}

				> .file {
					> a {
						display: block;
						max-width: 100%;
						border-radius: 16px;
						overflow: hidden;
						text-decoration: none;

						&:hover {
							text-decoration: none;

							> p {
								background: #ccc;
							}
						}

						> * {
							display: block;
							margin: 0;
							width: 100%;
							max-height: 512px;
							object-fit: contain;
							box-sizing: border-box;
						}

						> p {
							padding: 30px;
							text-align: center;
							color: #555;
							background: #ddd;
						}
					}
				}
			}
		}

		> footer {
			display: block;
			margin: 2px 0 0 0;
			font-size: 0.65em;

			> .read {
				margin: 0 8px;
			}

			> i {
				margin-left: 4px;
			}
		}
	}

	&:not(.isMe) {
		padding-left: var(--margin);

		> .content {
			padding-left: 16px;
			padding-right: 32px;

			> .balloon {
				$color: var(--messageBg);
				background: $color;

				&.noText {
					background: transparent;
				}

				&:not(.noText):before {
					left: -14px;
					border-top: solid 8px transparent;
					border-right: solid 8px $color;
					border-bottom: solid 8px transparent;
					border-left: solid 8px transparent;
				}

				> .content {
					> .text {
						color: var(--fg);
					}
				}
			}

			> footer {
				text-align: left;
			}
		}
	}

	&.isMe {
		flex-direction: row-reverse;
		padding-right: var(--margin);

		> .content {
			padding-right: 16px;
			padding-left: 32px;
			text-align: right;

			> .balloon {
				background: $me-balloon-color;
				text-align: left;

				::selection {
					color: var(--accent);
					background-color: #fff;
				} 

				&.noText {
					background: transparent;
				}

				&:not(.noText):before {
					right: -14px;
					left: auto;
					border-top: solid 8px transparent;
					border-right: solid 8px transparent;
					border-bottom: solid 8px transparent;
					border-left: solid 8px $me-balloon-color;
				}

				> .content {

					> p.is-deleted {
						color: rgba(#fff, 0.5);
					}

					> .text {
						&, ::v-deep(*) {
							color: var(--fgOnAccent) !important;
						}
					}
				}
			}

			> footer {
				text-align: right;

				> .read {
					user-select: none;
				}
			}
		}
	}

	&.max-width_400px {
		> .avatar {
			width: 48px;
			height: 48px;
		}

		> .content {
			> .balloon {
				> .content {
					> .text {
						font-size: 0.9em;
					}
				}
			}
		}
	}

	&.max-width_500px {
		> .content {
			> .balloon {
				> .content {
					> .text {
						padding: 8px 16px;
					}
				}
			}
		}
	}
}
</style>
