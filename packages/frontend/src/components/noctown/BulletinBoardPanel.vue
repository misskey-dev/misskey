<script setup lang="ts">
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, computed, onMounted, watch } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkButton from '@/components/MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkTextarea from '@/components/MkTextarea.vue';

interface BulletinPost {
	id: string;
	content: string;
	playerId: string;
	playerName: string;
	avatarUrl: string | null;
	attachedItemId: string | null;
	likeCount: number;
	isLiked: boolean;
	isPinned: boolean;
	createdAt: string;
}

interface BulletinBoard {
	id: string;
	worldId: string;
	positionX: number;
	positionZ: number;
	name: string | null;
	boardType: number;
	createdAt: string;
}

const props = defineProps<{
	boardId: string;
	boardName?: string;
	playerId: string;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
}>();

const isLoading = ref(true);
const posts = ref<BulletinPost[]>([]);
const newPostContent = ref('');
const isPosting = ref(false);
const error = ref<string | null>(null);

// Board type labels
const boardTypeLabels: Record<number, string> = {
	0: 'General',
	1: 'Trade',
	2: 'Quest',
};

onMounted(async () => {
	await loadPosts();
});

async function loadPosts() {
	isLoading.value = true;
	error.value = null;

	try {
		const result = await misskeyApi('noctown/bulletin/posts', {
			boardId: props.boardId,
			limit: 50,
		});
		posts.value = (result as { posts: BulletinPost[] }).posts;
	} catch (err) {
		error.value = 'Failed to load posts';
		console.error('Failed to load bulletin posts:', err);
	} finally {
		isLoading.value = false;
	}
}

async function createPost() {
	if (!newPostContent.value.trim() || isPosting.value) return;

	isPosting.value = true;
	error.value = null;

	try {
		await misskeyApi('noctown/bulletin/create-post', {
			boardId: props.boardId,
			content: newPostContent.value.trim(),
		});

		newPostContent.value = '';
		await loadPosts();
	} catch (err: any) {
		if (err.code === 'CONTENT_TOO_LONG') {
			error.value = 'Post content is too long (max 500 characters)';
		} else {
			error.value = 'Failed to create post';
		}
		console.error('Failed to create post:', err);
	} finally {
		isPosting.value = false;
	}
}

async function deletePost(postId: string) {
	if (!confirm('Delete this post?')) return;

	try {
		await misskeyApi('noctown/bulletin/delete-post', { postId });
		await loadPosts();
	} catch (err) {
		error.value = 'Failed to delete post';
		console.error('Failed to delete post:', err);
	}
}

async function toggleLike(post: BulletinPost) {
	try {
		if (post.isLiked) {
			const result = await misskeyApi('noctown/bulletin/unlike', { postId: post.id });
			post.isLiked = false;
			post.likeCount = (result as { likeCount: number }).likeCount;
		} else {
			const result = await misskeyApi('noctown/bulletin/like', { postId: post.id });
			post.isLiked = true;
			post.likeCount = (result as { likeCount: number }).likeCount;
		}
	} catch (err: any) {
		if (err.code === 'ALREADY_LIKED') {
			post.isLiked = true;
		} else if (err.code === 'NOT_LIKED') {
			post.isLiked = false;
		} else {
			console.error('Failed to toggle like:', err);
		}
	}
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - date.getTime();

	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;

	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;

	return date.toLocaleDateString();
}

function close() {
	emit('close');
}

const characterCount = computed(() => newPostContent.value.length);
const isOverLimit = computed(() => characterCount.value > 500);
</script>

<template>
	<MkModalWindow
		:width="550"
		:height="650"
		@close="close"
		@closed="close"
	>
		<template #header>
			<span class="header-title">{{ boardName || 'Bulletin Board' }}</span>
		</template>

		<div class="bulletin-panel">
			<!-- New Post Form -->
			<section class="new-post-section">
				<MkTextarea
					v-model="newPostContent"
					:placeholder="'Write a message...'"
					:max="500"
					class="post-input"
				/>
				<div class="post-actions">
					<span class="char-count" :class="{ over: isOverLimit }">
						{{ characterCount }}/500
					</span>
					<MkButton
						primary
						:disabled="!newPostContent.trim() || isPosting || isOverLimit"
						@click="createPost"
					>
						{{ isPosting ? 'Posting...' : 'Post' }}
					</MkButton>
				</div>
			</section>

			<!-- Error Message -->
			<div v-if="error" class="error-message">
				{{ error }}
			</div>

			<!-- Posts List -->
			<section class="posts-section">
				<div v-if="isLoading" class="loading">
					Loading posts...
				</div>

				<div v-else-if="posts.length === 0" class="no-posts">
					<span>No posts yet</span>
					<p class="hint">Be the first to post something!</p>
				</div>

				<div v-else class="posts-list">
					<div
						v-for="post in posts"
						:key="post.id"
						class="post-item"
						:class="{ pinned: post.isPinned }"
					>
						<!-- Post Header -->
						<div class="post-header">
							<div class="author-info">
								<img
									v-if="post.avatarUrl"
									:src="post.avatarUrl"
									class="avatar"
									alt=""
								/>
								<div v-else class="avatar-placeholder">?</div>
								<span class="author-name">{{ post.playerName }}</span>
								<span v-if="post.isPinned" class="pinned-badge">Pinned</span>
							</div>
							<span class="post-time">{{ formatDate(post.createdAt) }}</span>
						</div>

						<!-- Post Content -->
						<div class="post-content">
							{{ post.content }}
						</div>

						<!-- Attached Item -->
						<div v-if="post.attachedItemId" class="attached-item">
							<span class="item-icon">I</span>
							<span class="item-label">Item attached</span>
						</div>

						<!-- Post Actions -->
						<div class="post-footer">
							<button
								class="like-button"
								:class="{ liked: post.isLiked }"
								@click="toggleLike(post)"
							>
								<span class="like-icon">{{ post.isLiked ? '&hearts;' : '&hearts;' }}</span>
								<span class="like-count">{{ post.likeCount }}</span>
							</button>

							<button
								v-if="post.playerId === playerId"
								class="delete-button"
								@click="deletePost(post.id)"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			</section>

			<!-- Close Button -->
			<div class="actions">
				<MkButton @click="close">
					Close
				</MkButton>
			</div>
		</div>
	</MkModalWindow>
</template>

<style lang="scss" scoped>
.bulletin-panel {
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	height: 100%;
	overflow: hidden;
}

.new-post-section {
	.post-input {
		width: 100%;
	}

	.post-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 8px;
	}

	.char-count {
		font-size: 12px;
		color: var(--fgTransparent);

		&.over {
			color: #ff4444;
		}
	}
}

.error-message {
	padding: 12px;
	background: rgba(255, 0, 0, 0.1);
	color: #ff4444;
	border-radius: 8px;
	text-align: center;
}

.posts-section {
	flex: 1;
	overflow-y: auto;
	min-height: 0;

	.loading,
	.no-posts {
		padding: 24px;
		text-align: center;
		color: var(--fgTransparent);
	}

	.hint {
		margin-top: 8px;
		font-size: 12px;
		opacity: 0.7;
	}
}

.posts-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.post-item {
	padding: 12px;
	background: var(--panel);
	border-radius: 8px;

	&.pinned {
		border: 2px solid var(--accent);
		background: var(--accentedBg);
	}
}

.post-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.author-info {
	display: flex;
	align-items: center;
	gap: 8px;
}

.avatar {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	object-fit: cover;
}

.avatar-placeholder {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: var(--accentedBg);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	color: var(--accent);
}

.author-name {
	font-weight: bold;
	font-size: 14px;
}

.pinned-badge {
	padding: 2px 6px;
	background: var(--accent);
	color: white;
	font-size: 10px;
	border-radius: 4px;
}

.post-time {
	font-size: 12px;
	color: var(--fgTransparent);
}

.post-content {
	font-size: 14px;
	line-height: 1.5;
	white-space: pre-wrap;
	word-break: break-word;
}

.attached-item {
	margin-top: 8px;
	padding: 8px;
	background: var(--accentedBg);
	border-radius: 4px;
	display: flex;
	align-items: center;
	gap: 8px;

	.item-icon {
		width: 24px;
		height: 24px;
		background: var(--accent);
		color: white;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 12px;
	}

	.item-label {
		font-size: 12px;
		color: var(--fg);
	}
}

.post-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 12px;
	padding-top: 8px;
	border-top: 1px solid var(--divider);
}

.like-button {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px 12px;
	background: transparent;
	border: 1px solid var(--divider);
	border-radius: 16px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: var(--accentedBg);
	}

	&.liked {
		background: rgba(255, 100, 100, 0.1);
		border-color: #ff6464;
		color: #ff6464;

		.like-icon {
			color: #ff6464;
		}
	}

	.like-icon {
		font-size: 14px;
	}

	.like-count {
		font-size: 12px;
	}
}

.delete-button {
	padding: 4px 12px;
	background: transparent;
	border: 1px solid rgba(255, 0, 0, 0.3);
	border-radius: 4px;
	color: #ff4444;
	font-size: 12px;
	cursor: pointer;

	&:hover {
		background: rgba(255, 0, 0, 0.1);
	}
}

.actions {
	display: flex;
	justify-content: flex-end;
	padding-top: 12px;
	border-top: 1px solid var(--divider);
}
</style>
