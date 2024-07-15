const imageUrl = ref<string>('path_to_your_image.gif'); // または '.apng'

// 1秒あたりの色変化数を保持するリアクティブ変数
const colorChangesPerSecond = ref<number | null>(null);

// コンポーネントがマウントされたときに画像を取得して解析する
onMounted(() => {
	fetchImage(imageUrl.value);
});

// 画像を取得する関数
async function fetchImage(url: string) {
	try {
		const response = await fetch(url);
		const blob = await response.blob();
		const arrayBuffer = await blob.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);

		if (url.endsWith('.gif')) {
			analyzeGif(bytes);
		} else if (url.endsWith('.apng')) {
			analyzeApng(bytes);
		}
	} catch (error) {
		console.error('Error fetching the image:', error);
	}
}

// GIFの解析関数
function analyzeGif(bytes: Uint8Array) {
	const frames = extractGifFrames(bytes);
	calculateColorChanges(frames);
}

// APNGの解析関数
function analyzeApng(bytes: Uint8Array) {
	const frames = extractApngFrames(bytes);
	calculateColorChanges(frames);
}

// GIFフレーム抽出関数
function extractGifFrames(bytes: Uint8Array) {
	const frames = [];
	let i = 0;
	while (i < bytes.length) {
		// GIFのヘッダーとロジカルスクリーンディスクリプタをスキップ
		if (i === 0) i += 13;
		// グローバルカラーテーブルのスキップ
		if (i === 13) i += (bytes[10] & 0x80 ? 3 * (2 ** ((bytes[10] & 0x07) + 1)) : 0);

		// イメージディスクリプタを探す
		if (bytes[i] === 0x2C) {
			const imageLeft = bytes[i + 1] + (bytes[i + 2] << 8);
			const imageTop = bytes[i + 3] + (bytes[i + 4] << 8);
			const imageWidth = bytes[i + 5] + (bytes[i + 6] << 8);
			const imageHeight = bytes[i + 7] + (bytes[i + 8] << 8);
			const localColorTableFlag = bytes[i + 9] & 0x80;
			const localColorTableSize = 2 ** ((bytes[i + 9] & 0x07) + 1);

			i += 10;

			if (localColorTableFlag) {
				i += 3 * localColorTableSize;
			}

			while (bytes[i] !== 0x00) {
				const blockSize = bytes[i];
				i += blockSize + 1;
			}

			i++;
			const frame = extractPixelColor(bytes, imageLeft, imageTop, imageWidth, imageHeight);
			frames.push(frame);
		} else {
			i++;
		}
	}

	return frames;
}

// APNGフレーム抽出関数
function extractApngFrames(bytes: Uint8Array) {
	const frames = [];
	let i = 8; // PNGシグネチャをスキップ

	while (i < bytes.length) {
		const length = (bytes[i] << 24) + (bytes[i + 1] << 16) + (bytes[i + 2] << 8) + bytes[i + 3];
		const type = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);

		if (type === 'IDAT' || type === 'fdAT') {
			const imageLeft = 0;
			const imageTop = 0;
			const imageWidth = 0;
			const imageHeight = 0;

			const frame = extractPixelColor(bytes, imageLeft, imageTop, imageWidth, imageHeight);
			frames.push(frame);
		}

		i += length + 12;
	}

	return frames;
}

// 中央ピクセルの色を抽出する関数
function extractPixelColor(bytes: Uint8Array, left: number, top: number, width: number, height: number) {
	const centerX = left + Math.floor(width / 2);
	const centerY = top + Math.floor(height / 2);
	const index = (centerY * width + centerX) * 4;

	return {
		r: bytes[index],
		g: bytes[index + 1],
		b: bytes[index + 2],
	};
}

// 色の変化を計算する関数
function calculateColorChanges(frames: { r: number; g: number; b: number }[]) {
	let colorChangeCount = 0;
	for (let i = 1; i < frames.length; i++) {
		const prevFrame = frames[i - 1];
		const currFrame = frames[i];
		if (prevFrame.r !== currFrame.r || prevFrame.g !== currFrame.g || prevFrame.b !== currFrame.b) {
			colorChangeCount++;
		}
	}

	// 仮にFPSが30と仮定し、1秒あたりの色変化回数を計算
	const fps = 30;
	const durationInSeconds = frames.length / fps;
	colorChangesPerSecond.value = colorChangeCount / durationInSeconds;
}
