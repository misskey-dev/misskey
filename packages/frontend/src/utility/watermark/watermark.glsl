#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const float PI = 3.141592653589793;

in vec2 in_uv;                       // 0..1
uniform sampler2D in_texture;        // 背景
uniform vec2 in_resolution;          // 出力解像度(px)

uniform sampler2D u_watermark;       // ウォーターマーク
uniform vec2 u_wmResolution;         // ウォーターマーク元解像度(px)

uniform float u_opacity;             // 0..1
uniform float u_scale;               // watermarkのスケール
uniform float u_angle;               // -1..1 (PI倍)
uniform bool u_cover;                // cover基準 or fit基準
uniform bool u_repeat;               // タイル敷き詰め
uniform int u_alignX;                // 0:left 1:center 2:right
uniform int u_alignY;                // 0:top 1:center 2:bottom
uniform float u_margin;              // 余白(比率)
uniform float u_repeatMargin;        // 敷き詰め時の余白(比率)
uniform bool u_noBBoxExpansion;      // 回転時のBounding Box拡張を抑止
uniform bool u_wmEnabled;            // watermark有効

out vec4 out_color;

mat2 rot(float a) {
	float c = cos(a), s = sin(a);
	return mat2(c, -s, s, c);
}

// cover/fitとscaleから、最終的なサイズ(px)を計算
vec2 computeWmSize(vec2 outSize, vec2 wmSize, bool cover, float scale) {
	float wmAspect = wmSize.x / wmSize.y;
	float outAspect = outSize.x / outSize.y;
	vec2 size;
	if (cover) {
		if (wmAspect >= outAspect) {
			size.y = outSize.y * scale;
			size.x = size.y * wmAspect;
		} else {
			size.x = outSize.x * scale;
			size.y = size.x / wmAspect;
		}
	} else {
		if (wmAspect >= outAspect) {
			size.x = outSize.x * scale;
			size.y = size.x / wmAspect;
		} else {
			size.y = outSize.y * scale;
			size.x = size.y * wmAspect;
		}
	}
	return size;
}

void main() {
	vec2 outSize = in_resolution;
	vec2 p = in_uv * outSize; // 出力のピクセル座標
	vec4 base = texture(in_texture, in_uv);

	if (!u_wmEnabled) {
		out_color = base;
		return;
	}

	float theta = u_angle * PI; // ラジアン
	vec2 wmSize = computeWmSize(outSize, u_wmResolution, u_cover, u_scale);
	vec2 margin = u_repeat ? wmSize * u_repeatMargin : outSize * u_margin;

	// アライメントに基づく回転中心を計算
	float rotateX = 0.0;
	float rotateY = 0.0;
	if (abs(theta) > 1e-6 && !u_noBBoxExpansion) {
		rotateX = abs(abs(wmSize.x * cos(theta)) + abs(wmSize.y * sin(theta)) - wmSize.x) * 0.5;
		rotateY = abs(abs(wmSize.x * sin(theta)) + abs(wmSize.y * cos(theta)) - wmSize.y) * 0.5;
	}

	float x;
	if (u_alignX == 1) {
		x = (outSize.x - wmSize.x) * 0.5;
	} else if (u_alignX == 0) {
		x = rotateX + margin.x;
	} else {
		x = outSize.x - wmSize.x - margin.x - rotateX;
	}

	float y;
	if (u_alignY == 1) {
		y = (outSize.y - wmSize.y) * 0.5;
	} else if (u_alignY == 0) {
		y = rotateY + margin.y;
	} else {
		y = outSize.y - wmSize.y - margin.y - rotateY;
	}

	vec2 rectMin = vec2(x, y);
	vec2 rectMax = rectMin + wmSize;
	vec2 rectCenter = (rectMin + rectMax) * 0.5;

	vec4 wmCol = vec4(0.0);

	if (u_repeat) {
		// アライメントに基づく中心で回転
		vec2 q = rectCenter + rot(theta) * (p - rectCenter);

		// タイルグリッドの原点をrectMin（アライメント位置）に設定
		vec2 gridOrigin = rectMin - margin;
		vec2 qFromOrigin = q - gridOrigin;

		// タイルサイズ(ウォーターマーク + マージン)で正規化
		vec2 tile = wmSize + margin * 2.0;
		vec2 tileUv = qFromOrigin / tile;

		// タイル内のローカル座標(0..1)を取得
		vec2 localUv = fract(tileUv);

		// ローカル座標をピクセル単位に変換
		vec2 localPos = localUv * tile;

		// マージン領域内かチェック
		bool inMargin = any(lessThan(localPos, margin)) || any(greaterThanEqual(localPos, margin + wmSize));

		if (!inMargin) {
			// ウォーターマーク領域内: UV座標を計算
			vec2 uvWm = (localPos - margin) / wmSize;
			wmCol = texture(u_watermark, uvWm);
		}
		// マージン領域の場合は透明(wmCol = vec4(0.0))のまま
	} else {
		// アライメントと回転に従い一枚だけ描画
		vec2 q = rectCenter + rot(theta) * (p - rectCenter);
		bool inside = all(greaterThanEqual(q, rectMin)) && all(lessThan(q, rectMax));
		if (inside) {
			vec2 uvWm = (q - rectMin) / wmSize;
			wmCol = texture(u_watermark, uvWm);
		}
	}

	float a = clamp(wmCol.a * u_opacity, 0.0, 1.0);
	out_color = mix(base, vec4(wmCol.rgb, 1.0), a);
}
