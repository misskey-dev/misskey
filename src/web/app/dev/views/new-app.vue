<template>
<div>
	<form @submit="onSubmit" autocomplete="off">
		<section class="name">
			<label>
				<p class="caption">アプリケーション名</p>
				<input v-model="name" type="text" placeholder="ex) Misskey for iOS" autocomplete="off" required/>
			</label>
		</section>
		<section class="nid">
			<label>
				<p class="caption">Named ID</p>
				<input v-model="nid" type="text" pattern="^[a-zA-Z0-9-]{3,30}$" placeholder="ex) misskey-for-ios" autocomplete="off" required/>
				<p class="info" v-if="nidState == 'wait'" style="color:#999">%fa:spinner .pulse .fw%確認しています...</p>
				<p class="info" v-if="nidState == 'ok'" style="color:#3CB7B5">%fa:fw check%利用できます</p>
				<p class="info" v-if="nidState == 'unavailable'" style="color:#FF1161">%fa:fw exclamation-triangle%既に利用されています</p>
				<p class="info" v-if="nidState == 'error'" style="color:#FF1161">%fa:fw exclamation-triangle%通信エラー</p>
				<p class="info" v-if="nidState == 'invalid-format'" style="color:#FF1161">%fa:fw exclamation-triangle%a~z、A~Z、0~9、-(ハイフン)が使えます</p>
				<p class="info" v-if="nidState == 'min-range'" style="color:#FF1161">%fa:fw exclamation-triangle%3文字以上でお願いします！</p>
				<p class="info" v-if="nidState == 'max-range'" style="color:#FF1161">%fa:fw exclamation-triangle%30文字以内でお願いします</p>
			</label>
		</section>
		<section class="description">
			<label>
				<p class="caption">アプリの概要</p>
				<textarea v-model="description" placeholder="ex) Misskey iOSクライアント。" autocomplete="off" required></textarea>
			</label>
		</section>
		<section class="callback">
			<label>
				<p class="caption">コールバックURL (オプション)</p>
				<input v-model="cb" type="url" placeholder="ex) https://your.app.example.com/callback.php" autocomplete="off"/>
			</label>
		</section>
		<section class="permission">
			<p class="caption">権限</p>
			<div ref="permission">
				<label>
					<input type="checkbox" value="account-read"/>
					<p>アカウントの情報を見る。</p>
				</label>
				<label>
					<input type="checkbox" value="account-write"/>
					<p>アカウントの情報を操作する。</p>
				</label>
				<label>
					<input type="checkbox" value="post-write"/>
					<p>投稿する。</p>
				</label>
				<label>
					<input type="checkbox" value="reaction-write"/>
					<p>リアクションしたりリアクションをキャンセルする。</p>
				</label>
				<label>
					<input type="checkbox" value="following-write"/>
					<p>フォローしたりフォロー解除する。</p>
				</label>
				<label>
					<input type="checkbox" value="drive-read"/>
					<p>ドライブを見る。</p>
				</label>
				<label>
					<input type="checkbox" value="drive-write"/>
					<p>ドライブを操作する。</p>
				</label>
				<label>
					<input type="checkbox" value="notification-read"/>
					<p>通知を見る。</p>
				</label>
				<label>
					<input type="checkbox" value="notification-write"/>
					<p>通知を操作する。</p>
				</label>
			</div>
			<p>%fa:exclamation-triangle%アプリ作成後も変更できますが、新たな権限を付与する場合、その時点で関連付けられているユーザーキーはすべて無効になります。</p>
		</section>
		<button type="submit">アプリ作成</button>
	</form>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			name: '',
			nid: '',
			description: '',
			cb: '',
			nidState: null
		};
	},
	watch: {
		nid() {
			if (this.nid == null || this.nid == '') {
				this.nidState = null;
				return;
			}

			const err =
				!this.nid.match(/^[a-zA-Z0-9\-]+$/) ? 'invalid-format' :
				this.nid.length < 3                 ? 'min-range' :
				this.nid.length > 30                ? 'max-range' :
				null;

			if (err) {
				this.nidState = err;
				return;
			}

			this.nidState = 'wait';

			(this as any).api('app/name_id/available', {
				name_id: this.nid
			}).then(result => {
				this.nidState = result.available ? 'ok' : 'unavailable';
			}).catch(err => {
				this.nidState = 'error';
			});
		}
	},
	methods: {
		onSubmit() {
			const permission = [];

			(this.$refs.permission as any).querySelectorAll('input').forEach(el => {
				if (el.checked) permission.push(el.value);
			});

			(this as any).api('app/create', {
				name: this.name,
				name_id: this.nid,
				description: this.description,
				callback_url: this.cb,
				permission: permission
			}).then(() => {
				location.href = '/apps';
			}).catch(() => {
				alert('アプリの作成に失敗しました。再度お試しください。');
			});
		}
	}
});
</script>
