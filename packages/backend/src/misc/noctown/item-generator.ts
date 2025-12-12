/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Procedural Item Name and Flavor Text Generator
 * Generates 10,000+ unique item variations
 */

// Item categories
export type ItemCategory = 'material' | 'equipment' | 'consumable' | 'decoration' | 'tool' | 'seed' | 'special';

// Rarity levels
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface GeneratedItem {
	name: string;
	flavorText: string;
	category: ItemCategory;
	rarity: ItemRarity;
	baseType: string;
}

// Name components for procedural generation
const PREFIXES: Record<ItemRarity, string[]> = {
	common: ['古びた', 'くすんだ', '普通の', '素朴な', '手頃な', 'よくある', '地味な', '質素な'],
	uncommon: ['輝く', '丈夫な', '精巧な', '整った', '磨かれた', '上質な', '良質な', '頼もしい'],
	rare: ['神秘の', '希少な', '秘められた', '魔力の宿る', '星降りの', '黄昏の', '夢幻の', '運命の'],
	epic: ['伝説の', '古代の', '禁断の', '究極の', '至高の', '覚醒の', '超越の', '神聖なる'],
	legendary: ['創世の', '終焉の', '永遠の', '始原の', '世界樹の', '神々の', '運命を紡ぐ', '宇宙の'],
};

const MATERIALS: string[] = [
	// Metals
	'鉄', '銅', '銀', '金', 'ミスリル', 'オリハルコン', '星鉄', '月光石',
	// Natural
	'木', '石', '水晶', '琥珀', '翡翠', '黒曜石', 'ルビー', 'サファイア',
	// Organic
	'骨', '牙', '羽根', '鱗', '革', '絹', '綿', '麻',
	// Magical
	'魔晶石', '精霊石', '竜珠', '妖精の粉', '夢の欠片', '時の砂', '虚無の結晶', '光の粒子',
];

const BASE_ITEMS: Record<ItemCategory, string[]> = {
	material: [
		'の欠片', 'の塊', 'の粉末', 'のインゴット', 'の原石', 'の結晶', 'の繊維', 'の板',
		'のナゲット', 'の粒', 'のかけら', 'の糸', 'の布', 'のエキス', 'の素材', 'の破片',
	],
	equipment: [
		'の剣', 'の盾', 'の杖', 'の弓', 'のローブ', 'の鎧', 'のヘルム', 'のブーツ',
		'のグローブ', 'のリング', 'のアミュレット', 'のマント', 'の腕輪', 'の冠', 'の靴', 'のベルト',
	],
	consumable: [
		'のポーション', 'のエリクサー', 'の薬', 'の丸薬', 'のパン', 'の果実', 'の肉', 'の魚',
		'のスープ', 'のジュース', 'の飴', 'のケーキ', 'のクッキー', 'の茶葉', 'の蜂蜜', 'の酒',
	],
	decoration: [
		'の像', 'の絵画', 'の花瓶', 'のランプ', 'の時計', 'のオルゴール', 'の鏡', 'の額縁',
		'の旗', 'のタペストリー', 'の彫刻', 'の置物', 'のぬいぐるみ', 'の人形', 'のポスター', 'の壁飾り',
	],
	tool: [
		'のハンマー', 'のピッケル', 'のナイフ', 'のノコギリ', 'のシャベル', 'の斧', 'の鍬', 'の釣竿',
		'のコンパス', 'の望遠鏡', 'のランタン', 'の鍵', 'のペン', 'の巻物', 'の地図', 'のロープ',
	],
	seed: [
		'の種', 'の苗', 'の球根', 'の実', 'の芽', 'の根', 'の花びら', 'の葉',
		'の蕾', 'の茎', 'の枝', 'の樹皮', 'のキノコ', 'の胞子', 'の果実', 'のベリー',
	],
	special: [
		'の書', 'の巻物', 'のオーブ', 'のクリスタル', 'のメダル', 'のコイン', 'のチケット', 'の手紙',
		'の日記', 'の写真', 'の記憶', 'の欠片', 'の鍵', 'の紋章', 'のトロフィー', 'の証',
	],
};

const ADJECTIVES: string[] = [
	'きらめく', '不思議な', '謎めいた', '古の', '秘密の', '忘れられた', '眠れる', '目覚めし',
	'歌う', '踊る', '囁く', '微笑む', '泣く', '怒れる', '静かな', '騒がしい',
	'温かな', '冷たい', '熱い', '凍える', '柔らかな', '硬い', '軽い', '重い',
	'甘い', '苦い', '酸っぱい', '辛い', '香る', '光る', '影の', '虹色の',
];

const FLAVOR_TEMPLATES: string[] = [
	'{material}から作られた{adjective}アイテム。{effect}',
	'伝説によれば、{origin}から発見されたという。',
	'{user}が愛用していたと言われる。{feature}',
	'{time}に{place}で生まれた。{mystery}',
	'{creator}の手によって作られた逸品。{quality}',
	'持ち主に{blessing}をもたらすと言われている。',
	'{legend}にまつわる不思議なアイテム。',
	'{element}の力が宿っている。{warning}',
];

const ORIGINS: string[] = [
	'古代の遺跡', '深い森の奥', '高い山の頂', '海の底', '空の彼方', '夢の世界',
	'異界の門', '時の狭間', '忘却の地', '始まりの場所', '終わりの地', '神殿の奥',
];

const USERS: string[] = [
	'偉大な魔法使い', '勇敢な騎士', '賢い学者', '美しい姫', '謎の旅人', '伝説の英雄',
	'古の王', '精霊の守護者', '星読みの占い師', '名もなき冒険者', '天才職人', '放浪の詩人',
];

const EFFECTS: string[] = [
	'使い方次第で大きな力を発揮する',
	'心を落ち着かせる効果がある',
	'持っているだけで幸運が訪れる',
	'不思議な音色を奏でる',
	'月明かりの下で輝く',
	'持ち主の気分で色が変わる',
];

const FEATURES: string[] = [
	'細かな装飾が施されている',
	'独特の模様が刻まれている',
	'微かな香りがする',
	'手触りが心地よい',
	'見る角度で色が変わる',
	'不思議な温もりを感じる',
];

const MYSTERIES: string[] = [
	'その真の力は未だ解明されていない',
	'多くの謎に包まれている',
	'研究者たちを悩ませている',
	'予言に記されている',
	'伝説の一部とされている',
	'特別な条件で力を発揮する',
];

const ELEMENTS: string[] = [
	'炎', '水', '風', '土', '雷', '氷', '光', '闇', '時', '空間', '生命', '精神',
];

const BLESSINGS: string[] = [
	'幸運', '勇気', '知恵', '健康', '富', '愛', '平和', '力', '守護', '癒し', '希望', '夢',
];

const LEGENDS: string[] = [
	'創世神話', '英雄伝説', '竜の物語', '精霊の歌', '星々の記憶', '時の旅人',
	'失われた王国', '封印された魔王', '約束の地', '永遠の愛', '運命の出会い', '最後の戦い',
];

const WARNINGS: string[] = [
	'取り扱いには注意が必要',
	'使い過ぎに注意',
	'正しい心を持つ者のみ使える',
	'悪用すると呪いが降りかかる',
	'満月の夜には力が増す',
	'水に濡らさないこと',
];

const QUALITIES: string[] = [
	'この上ない品質',
	'比類なき完成度',
	'芸術的な仕上がり',
	'実用性と美しさを兼ね備えている',
	'職人技の結晶',
	'見る者を魅了する',
];

const TIMES: string[] = [
	'千年前', '百年前', '遥か昔', '神話の時代', '黄金時代', '暗黒の時代',
	'戦乱の世', '平和な時代', '魔法が栄えた頃', '神々が地上を歩いた時代',
];

const PLACES: string[] = [
	'東の果て', '西の彼方', '北の大地', '南の島々', '天空の城', '地底の王国',
	'精霊の森', '竜の谷', '妖精の国', '夢の都', '忘れられた大陸', '世界樹のふもと',
];

const CREATORS: string[] = [
	'名工', '天才鍛冶師', 'エルフの職人', 'ドワーフの匠', '魔法使い', '錬金術師',
	'神官', '賢者', '芸術家', '発明家', '神々', '精霊',
];

/**
 * Seeded random number generator
 */
class SeededRandom {
	private seed: number;

	constructor(seed: number) {
		this.seed = seed;
	}

	next(): number {
		this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
		return this.seed / 0x7fffffff;
	}

	nextInt(min: number, max: number): number {
		return Math.floor(this.next() * (max - min + 1)) + min;
	}

	pick<T>(array: T[]): T {
		return array[this.nextInt(0, array.length - 1)];
	}
}

/**
 * Generate item name and flavor text from seed
 */
export function generateItem(seed: number): GeneratedItem {
	const rng = new SeededRandom(seed);

	// Determine rarity based on seed distribution
	const rarityRoll = rng.next();
	let rarity: ItemRarity;
	if (rarityRoll < 0.50) rarity = 'common';
	else if (rarityRoll < 0.80) rarity = 'uncommon';
	else if (rarityRoll < 0.94) rarity = 'rare';
	else if (rarityRoll < 0.99) rarity = 'epic';
	else rarity = 'legendary';

	// Determine category
	const categories: ItemCategory[] = ['material', 'equipment', 'consumable', 'decoration', 'tool', 'seed', 'special'];
	const category = rng.pick(categories);

	// Generate name
	const prefix = rng.pick(PREFIXES[rarity]);
	const material = rng.pick(MATERIALS);
	const baseItem = rng.pick(BASE_ITEMS[category]);
	const useAdjective = rng.next() > 0.7;
	const adjective = useAdjective ? rng.pick(ADJECTIVES) : '';

	let name: string;
	if (useAdjective) {
		name = `${prefix}${adjective}${material}${baseItem}`;
	} else {
		name = `${prefix}${material}${baseItem}`;
	}

	// Generate flavor text
	const flavorText = generateFlavorText(rng, material, category, rarity);

	return {
		name,
		flavorText,
		category,
		rarity,
		baseType: `${material}${baseItem}`,
	};
}

/**
 * Generate flavor text
 */
function generateFlavorText(rng: SeededRandom, material: string, category: ItemCategory, rarity: ItemRarity): string {
	const template = rng.pick(FLAVOR_TEMPLATES);

	const replacements: Record<string, string> = {
		'{material}': material,
		'{adjective}': rng.pick(ADJECTIVES),
		'{effect}': rng.pick(EFFECTS),
		'{origin}': rng.pick(ORIGINS),
		'{user}': rng.pick(USERS),
		'{feature}': rng.pick(FEATURES),
		'{time}': rng.pick(TIMES),
		'{place}': rng.pick(PLACES),
		'{creator}': rng.pick(CREATORS),
		'{quality}': rng.pick(QUALITIES),
		'{blessing}': rng.pick(BLESSINGS),
		'{legend}': rng.pick(LEGENDS),
		'{element}': rng.pick(ELEMENTS),
		'{warning}': rng.pick(WARNINGS),
		'{mystery}': rng.pick(MYSTERIES),
	};

	let text = template;
	for (const [key, value] of Object.entries(replacements)) {
		text = text.replace(key, value);
	}

	// Add rarity-specific flavor for rare+ items
	if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
		const extraFlavor = rng.pick([
			`【${rarity === 'legendary' ? '伝説級' : rarity === 'epic' ? '史詩級' : '稀少'}】`,
			'多くの冒険者が探し求めている。',
			'博物館でも見かけることは稀。',
			'その価値は計り知れない。',
		]);
		text = extraFlavor + text;
	}

	return text;
}

/**
 * Generate unique item ID from position and world seed
 */
export function generateItemSeed(worldSeed: number, x: number, z: number, timestamp: number): number {
	// Combine multiple factors for unique seed
	const positionHash = Math.floor(x * 73856093) ^ Math.floor(z * 19349663);
	const timeHash = Math.floor(timestamp / 1000) * 83492791;
	return Math.abs((worldSeed ^ positionHash ^ timeHash) & 0x7fffffff);
}

/**
 * Get item variation count (for display purposes)
 */
export function getVariationCount(): number {
	const prefixCount = Object.values(PREFIXES).reduce((sum, arr) => sum + arr.length, 0);
	const materialCount = MATERIALS.length;
	const baseItemCount = Object.values(BASE_ITEMS).reduce((sum, arr) => sum + arr.length, 0);
	const adjectiveVariation = ADJECTIVES.length + 1; // +1 for no adjective

	// This is a rough estimate of unique combinations
	return prefixCount * materialCount * baseItemCount * adjectiveVariation;
}

/**
 * Batch generate items for testing
 */
export function generateItemBatch(startSeed: number, count: number): GeneratedItem[] {
	const items: GeneratedItem[] = [];
	for (let i = 0; i < count; i++) {
		items.push(generateItem(startSeed + i));
	}
	return items;
}
