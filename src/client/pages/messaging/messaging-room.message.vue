<template>
<div class="thvuemwp" :data-is-me="isMe">
	<mk-avatar class="avatar" :user="message.user"/>
	<div class="content">
		<div class="balloon" :data-no-text="message.text == null">
			<button class="delete-button" v-if="isMe" :title="$t('delete')" @click="del">
				<img src="/assets/remove.png" alt="Delete"/>
			</button>
			<div class="content" v-if="!message.isDeleted">
				<mfm class="text" v-if="message.text" ref="text" :text="message.text" :i="$store.state.i"/>
				<div class="file" v-if="message.file">
					<a :href="message.file.url" rel="noopener" target="_blank" :title="message.file.name">
						<img v-if="message.file.type.split('/')[0] == 'image'" :src="message.file.url" :alt="message.file.name"/>
						<p v-else>{{ message.file.name }}</p>
					</a>
				</div>
			</div>
			<div class="content" v-else>
				<p class="is-deleted">{{ $t('deleted') }}</p>
			</div>
		</div>
		<div></div>
		<mk-url-preview v-for="url in urls" :url="url" :key="url" style="margin: 8px 0;"/>
		<footer>
			<template v-if="isGroup">
				<span class="read" v-if="message.reads.length > 0">{{ $t('messageRead') }} {{ message.reads.length }}</span>
			</template>
			<template v-else>
				<span class="read" v-if="isMe && message.isRead">{{ $t('messageRead') }}</span>
			</template>
			<mk-time :time="message.createdAt"/>
			<template v-if="message.is_edited"><fa icon="pencil-alt"/></template>
		</footer>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { parse } from '../../../mfm/parse';
import { unique } from '../../../prelude/array';
import MkUrlPreview from '../../components/url-preview.vue';

export default Vue.extend({
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
			return this.message.userId === this.$store.state.i.id;
		},
		urls(): string[] {
			if (this.message.text) {
				const ast = parse(this.message.text);
				return unique(ast
					.filter(t => ((t.node.type === 'url' || t.node.type === 'link') && t.node.props.url && !t.node.props.silent))
					.map(t => t.node.props.url));
			} else {
				return [];
			}
		}
	},
	methods: {
		del() {
			this.$root.api('messaging/messages/delete', {
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
		display: block;
		width: 54px;
		height: 54px;
		transition: all 0.1s ease;

		@media (max-width: 400px) {
			width: 48px;
			height: 48px;
		}
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

					@media (max-width: 500px) {
						padding: 8px 16px;
					}

					@media (max-width: 400px) {
						font-size: 0.9em;
					}

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

			> [data-icon] {
				margin-left: 4px;
			}
		}
	}

	&:not([data-is-me]) {
		padding-left: var(--margin);

		> .content {
			padding-left: 16px;
			padding-right: 32px;

			> .balloon {
				$color: var(--messageBg);
				background: $color;

				&[data-no-text] {
					background: transparent;
				}

				&:not([data-no-text]):before {
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

	&[data-is-me] {
		flex-direction: row-reverse;
		padding-right: var(--margin);

		> .content {
			padding-right: 16px;
			padding-left: 32px;
			text-align: right;

			> .balloon {
				background: $me-balloon-color;
				text-align: left;

				&[data-no-text] {
					background: transparent;
				}

				&:not([data-no-text]):before {
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
						&, ::v-deep * {
							color: #fff !important;
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

	&[data-is-deleted] {
		> .balloon {
			opacity: 0.5;
		}
	}
}
</style>
