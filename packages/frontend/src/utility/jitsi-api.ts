declare global {
	interface Window {
		JitsiMeetExternalAPI: any;
	}
}

class JitsiApiService {
	private api: any = null;
	private domain = 'call.yami.ski';
	private isScriptLoaded = false;

	async loadScript(): Promise<void> {
		if (this.isScriptLoaded || window.JitsiMeetExternalAPI) {
			this.isScriptLoaded = true;
			return;
		}

		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = `https://${this.domain}/external_api.js`;
			script.onload = () => {
				this.isScriptLoaded = true;
				resolve();
			};
			script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
			document.head.appendChild(script);
		});
	}

	async startMeeting(roomName: string, containerId: string): Promise<void> {
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
			container = document.getElementById(containerId);
			if (container) break;
			await new Promise(resolve => setTimeout(resolve, 200));
		}

		if (!container) {
			throw new Error(`Container with id ${containerId} not found after waiting`);
		}

		const options = {
			roomName: roomName,
			width: '100%',
			height: '100%', // CSSの高さ設定に完全に任せる
			parentNode: container,
			configOverwrite: {
				startWithAudioMuted: true,
				startWithVideoMuted: false,
				enableWelcomePage: false,
				prejoinPageEnabled: false,
				defaultLanguage: 'ja',
				enableLayerSuspension: true,
				// 解像度設定を追加
				resolution: 720, // HD解像度
				constraints: {
					video: {
						aspectRatio: 16/9,
						height: { ideal: 360, max: 720 },
						width: { ideal: 640, max: 1280 }
					}
				}
			},
			interfaceConfigOverwrite: {
				TILE_VIEW_MAX_COLUMNS: 2,
				SHOW_JITSI_WATERMARK: false,
				SHOW_WATERMARK_FOR_GUESTS: false,
				// モバイル向けUI調整
				MOBILE_APP_PROMO: false,
				SHOW_PROMOTIONAL_CLOSE_PAGE: false,
				TOOLBAR_BUTTONS: [
					'microphone', 'camera', 'hangup', 'chat', 'settings'
				],
				// ビデオレイアウトの調整
				VIDEO_LAYOUT_FIT: 'nocrop', // ビデオをクロップしない
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
