declare global {
	interface Window {
		JitsiMeetExternalAPI: any;
	}
}

class JitsiApiService {
	private api: any = null;
	private domain = 'call.yami.ski';
	private isScriptLoaded = false;

	// Misskeyの絵文字を除去する関数
	private removeEmojiFromName(name: string | null): string | null {
		if (!name) return name;

		// :英数字: 形式の絵文字を除去
		const cleanedName = name.replace(/:[\w\d_-]+:/g, '').trim();

		// 空文字列になった場合はnullを返す
		return cleanedName || null;
	}

	async loadScript(): Promise<void> {
		if (this.isScriptLoaded || window.JitsiMeetExternalAPI) {
			this.isScriptLoaded = true;
			return;
		}

		return new Promise((resolve, reject) => {
			const script = window.document.createElement('script');
			script.src = `https://${this.domain}/external_api.js`;
			script.onload = () => {
				this.isScriptLoaded = true;
				resolve();
			};
			script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
			window.document.head.appendChild(script);
		});
	}

	async startMeeting(roomName: string, containerId: string, displayName: string | null, email: string | null): Promise<void> {
		await this.loadScript();

		if (!window.JitsiMeetExternalAPI) {
			throw new Error('JitsiMeetExternalAPI is not available');
		}

		// 既存のAPIインスタンスがある場合は破棄
		if (this.api) {
			this.api.dispose();
			this.api = null;
		}

		// コンテナの存在を確認（最大5回、200msずつ待機）
		let container: HTMLElement | null = null;
		for (let i = 0; i < 5; i++) {
			container = window.document.getElementById(containerId);
			if (container) break;
			await new Promise(resolve => window.setTimeout(resolve, 200));
		}

		if (!container) {
			throw new Error(`Container with id ${containerId} not found after waiting`);
		}

		// 絵文字を除去した名前を生成
		const cleanedDisplayName = this.removeEmojiFromName(displayName);

		console.log('User settings:', {
			originalDisplayName: displayName,
			cleanedDisplayName: cleanedDisplayName,
			email,
		});

		const options = {
			roomName: roomName,
			width: '100%',
			height: '100%',
			parentNode: container,
			userInfo: {
				displayName: cleanedDisplayName || 'Anonymous',
				email: email || undefined, // Gravatarで使用されるメールアドレス
			},
			configOverwrite: {
				startWithAudioMuted: true,
				startWithVideoMuted: false,
				enableWelcomePage: false,
				prejoinPageEnabled: false,
				defaultLanguage: 'ja',
				enableLayerSuspension: true,
				resolution: 720,
				// Gravatarを有効化
				gravatar: {
					baseUrl: 'https://www.gravatar.com/avatar/',
					disabled: false,
				},
				disableThirdPartyRequests: false,
				constraints: {
					video: {
						aspectRatio: 16 / 9,
						height: { ideal: 360, max: 720 },
						width: { ideal: 640, max: 1280 },
					},
				},
			},
			interfaceConfigOverwrite: {
				TILE_VIEW_MAX_COLUMNS: 2,
				SHOW_JITSI_WATERMARK: false,
				SHOW_WATERMARK_FOR_GUESTS: false,
				MOBILE_APP_PROMO: false,
				SHOW_PROMOTIONAL_CLOSE_PAGE: false,
				TOOLBAR_BUTTONS: [
					'microphone', 'camera', 'hangup', 'chat', 'settings',
				],
				VIDEO_LAYOUT_FIT: 'nocrop',
			},
		};

		try {
			this.api = new window.JitsiMeetExternalAPI(this.domain, options);

			// イベントリスナーを追加
			this.api.addEventListener('videoConferenceJoined', () => {
				console.log('Meeting joined successfully');
			});

			this.api.addEventListener('videoConferenceLeft', () => {
				console.log('Meeting left');
			});

			// アバター変更イベントをリッスン（デバッグ用）
			this.api.addEventListener('avatarChanged', (event: any) => {
				console.log('Avatar changed event:', event);
			});

			// 参加者情報変更イベントもリッスン（デバッグ用）
			this.api.addEventListener('displayNameChange', (event: any) => {
				console.log('Display name changed:', event);
			});

		} catch (error) {
			console.error('Failed to create Jitsi meeting:', error);
			throw error;
		}
	}

	dispose(): void {
		if (this.api) {
			try {
				this.api.dispose();
			} catch (error) {
				console.error('Error disposing Jitsi API:', error);
			}
			this.api = null;
		}
	}

	isActive(): boolean {
		return this.api !== null;
	}
}

export const jitsiApi = new JitsiApiService();
