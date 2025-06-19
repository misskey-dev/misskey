declare global {
	interface Window {
		JitsiMeetExternalAPI: any;
	}
}

class JitsiApiService {
	private api: any = null;
	private isScriptLoaded: Record<string, boolean> = {};

	// Misskeyの絵文字を除去する関数
	private removeEmojiFromName(name: string | null): string | null {
		if (!name) return name;

		// :英数字: 形式の絵文字を除去
		const cleanedName = name.replace(/:[\w\d_-]+:/g, '').trim();

		// 空文字列になった場合はnullを返す
		return cleanedName || null;
	}

	async loadScript(domain: string): Promise<void> {
		if (this.isScriptLoaded[domain] ||
			(window.JitsiMeetExternalAPI && this.api?.getIFrame()?.src.includes(domain))) {
			this.isScriptLoaded[domain] = true;
			return;
		}

		return new Promise((resolve, reject) => {
			const script = window.document.createElement('script');
			script.src = `https://${domain}/external_api.js`;
			script.onload = () => {
				this.isScriptLoaded[domain] = true;
				resolve();
			};
			script.onerror = () => reject(new Error(`Failed to load Jitsi Meet API from ${domain}`));
			window.document.head.appendChild(script);
		});
	}

	async startMeeting(
		domain: string,
		roomName: string,
		containerId: string,
		displayName: string | null,
		email: string | null,
		config?: {
			// 音声・ビデオ設定
			startWithAudioMuted?: boolean;
			startWithVideoMuted?: boolean;
			startAudioOnly?: boolean;
			requestAudioPermission?: boolean;
			requestVideoPermission?: boolean;

			// インターフェース設定
			useThemeColor?: boolean;
			customBackgroundColor?: string;
			verticalFilmstrip?: boolean;
			tileViewMaxColumns?: number;
			videoLayoutFit?: string;

			// 参加・表示設定
			skipPrejoinPage?: boolean;
			enableFaceCentering?: boolean;
			disableTileEnlargement?: boolean;

			// パフォーマンス設定
			disableNotifications?: boolean;
			resolution?: number;
			enableLayerSuspension?: boolean;
		},
	): Promise<void> {
		await this.loadScript(domain);

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

		// 設定のデフォルト値を設定
		const configWithDefaults = {
			startWithAudioMuted: false, // 音声はデフォルトで有効
			startWithVideoMuted: true, // ビデオはデフォルトで無効
			requestAudioPermission: true, // 音声権限はリクエスト
			requestVideoPermission: false, // ビデオ権限はリクエストしない
			useThemeColor: true, // テーマカラーを使用
			customBackgroundColor: '#966BFF', // デフォルトの背景色
			...config,
		};

		console.log('Jitsi meeting options:', configWithDefaults);

		const options = {
			roomName: roomName,
			width: '100%',
			height: '100%',
			parentNode: container,
			userInfo: {
				displayName: cleanedDisplayName || 'Anonymous',
				email: email || undefined,
			},
			configOverwrite: {
				// 音声・ビデオの初期状態
				startWithAudioMuted: configWithDefaults.startWithAudioMuted,
				startWithVideoMuted: configWithDefaults.startWithVideoMuted,
				startAudioOnly: false,

				// 参加前設定
				enableWelcomePage: false,
				prejoinPageEnabled: false,
				defaultLanguage: 'ja',

				// パフォーマンス設定
				enableLayerSuspension: true,
				resolution: 720,

				// 顔検出と表示の最適化
				faceLandmarks: {
					enableFaceCentering: false,
				},
				disableTileEnlargement: true,

				// メディア権限設定
				disableInitialGUM: !(configWithDefaults.requestAudioPermission || configWithDefaults.requestVideoPermission),

				// 通知設定
				notifications: [],

				// メディア制約
				constraints: {
					video: configWithDefaults.requestVideoPermission ? {
						aspectRatio: 16 / 9,
						height: { ideal: 360, max: 720 },
						width: { ideal: 640, max: 1280 },
					} : false,
					audio: configWithDefaults.requestAudioPermission,
				},
			},
			interfaceConfigOverwrite: {
				TILE_VIEW_MAX_COLUMNS: 2,
				SHOW_JITSI_WATERMARK: false,
				SHOW_WATERMARK_FOR_GUESTS: false,
				MOBILE_APP_PROMO: false,
				SHOW_PROMOTIONAL_CLOSE_PAGE: false,
				VERTICAL_FILMSTRIP: false,

				// 背景色設定
				DEFAULT_BACKGROUND: configWithDefaults.useThemeColor
					? 'var(--MI_THEME-accent)'
					: configWithDefaults.customBackgroundColor,

				TOOLBAR_BUTTONS: [
					'microphone', 'camera', 'hangup', 'chat', 'settings',
				],
				VIDEO_LAYOUT_FIT: 'nocrop',
			},
		};

		try {
			this.api = new window.JitsiMeetExternalAPI(domain, options);
			console.log('Jitsi Meet API initialized with domain:', domain);
		} catch (error) {
			console.error(`Failed to initialize Jitsi Meet API for domain ${domain}:`, error);
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
