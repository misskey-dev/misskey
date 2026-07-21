# Shared Diagnostics Metric Table Design

## Summary

Heap Snapshot、Backend metrics、Frontend metricsで重複している比較Markdown表の生成処理を`diagnostics-shared`へ集約する。共通rendererはBase/Headのサンプル列と行ごとのvalue selectorを受け取り、独立集計、有意差判定、整形、行の絞り込み、五列のMarkdown生成までを担当する。

この変更では`Result`列とcategoricalな`verdict`を廃止する。有意差はabsolute deltaが行固有のthreshold以上で、かつ観測ノイズの範囲外にあるかだけで判定する。Percentage thresholdは設けない。

## Goals

- Heap Snapshot、Backend metrics、Frontend metricsのMarkdown表生成を1つのgeneric rendererへ共通化する。
- 表を`Metric / @ Base / @ Head / Δ / MAD`の五列に統一する。
- 独立中央値、MAD、combined MAD、ノイズ判定、着色を一箇所で扱う。
- Frontend metrics向けに、有意な変化がある行だけを表示するオプションを提供する。
- Heap SnapshotのTotal行とcategory行の既存レイアウト差を行オプションで表現する。
- 正常なworkflow出力には必要なサンプルが揃う前提とし、nullable分岐やfallback表示を減らす。

## Non-goals

- Requests by resource type、Bundle Stats、visualizer、詳細HTMLなど、対象外の表を共通rendererへ移行しない。
- Workflowのサンプル数や計測方法を変更しない。
- Frontend/Backendのreport JSON schemaを変更しない。
- Percentage thresholdを導入しない。
- 外部入力向けのHTML sanitizationや、壊れたreportを部分的に描画する復旧処理を追加しない。
- 一時設計書・実装計画を最終PR差分へ残さない。

## Existing Preconditions

正常なGitHub Actions実行では、集計に必要なサンプルが固定数生成される。

- Backend metrics: Base/Headそれぞれ15サンプル
- Backend Heap Snapshot: Base/Headそれぞれ3サンプル
- Frontend metricsおよびHeap Snapshot: Base/Headそれぞれ5サンプル

各計測ループはラウンドごとの処理をawaitし、計測やHeap Snapshot取得に失敗した場合は部分的なreportを完成させずjobを失敗させる。Backend Heap Snapshotが未取得のラウンドは設計どおり`null`だが、table wrapperへ渡す前に除外され、正常なworkflowでは各側3件が残る。

したがって、共通集計とrendererは片側2件以上の有効な数値サンプルがあることを契約とする。手動設定や不正なreportによって契約が破られた場合はfail fastし、欠損値を`-`で描画して継続しない。

## Statistics Contract

`IndependentDeltaVerdict`、`verdict`、`inconclusive`、`IndependentDeltaSummaryOptions`、`forceInconclusive`を削除する。`IndependentDeltaSummary`は数値の集計結果だけを持つ。

```ts
export type IndependentDeltaSummary = {
	baseMedian: number;
	headMedian: number;
	delta: number;
	baseMad: number;
	headMad: number;
	combinedMad: number;
	baseSamples: number;
	headSamples: number;
};
```

`independentDeltaSummary`のselectorは`number`だけを返す。

```ts
export function independentDeltaSummary<T>(
	baseSamples: T[],
	headSamples: T[],
	getValue: (sample: T) => number,
): IndependentDeltaSummary;
```

片側2サンプル未満なら、集計の先頭で単純な例外を投げる。

```ts
if (baseValues.length < 2 || headValues.length < 2) {
	throw new Error('At least two samples per side are required');
}
```

この経路ではnullable値や非有限値を救済するためのfilteringを行わない。selectorとreport型が有限の`number`を提供することを呼び出し契約とする。`finiteMedian`や`sampleSpread`はHeap Snapshot summaryなど他用途のnullable集計に使われているため、この変更だけを理由に削除しない。

観測ノイズ外かどうかはcategorical verdictではなく、必要箇所から利用できる単純なpredicateとして表す。

```ts
export function isOutsideObservedNoise(summary: IndependentDeltaSummary) {
	return Math.abs(summary.delta) > summary.combinedMad * 3;
}
```

`3 × combinedMad`ちょうどはノイズ範囲内とする。

## Shared Renderer API

新しいpublic export `diagnostics-shared/metric-table`を追加する。実装は`packages-private/diagnostics-shared/src/metric-table.ts`に置く。

```ts
export type MetricComparisonRow<T> = {
	label: string;
	getValue: (sample: T) => number;
	formatValue: (value: number) => string;
	absoluteThreshold: number;
	showMedianMad?: boolean;
	showDeltaPercentage?: boolean;
	separatorAfter?: boolean;
};

export type MetricComparisonTableOptions = {
	onlySignificantChanges?: boolean;
};

export function renderMetricComparisonTable<T>(
	baseSamples: T[],
	headSamples: T[],
	rows: MetricComparisonRow<T>[],
	options?: MetricComparisonTableOptions,
): string;
```

オプションのdefaultは次のとおり。

- `showMedianMad`: `true`
- `showDeltaPercentage`: `true`
- `separatorAfter`: `false`
- `onlySignificantChanges`: `false`

`label`はリポジトリ内で組み立てた信頼できるMarkdown/HTMLとして無加工で出力する。HTML escapingやMarkdown table cell escapingは行わない。label内でtable delimiterの`|`を使わないことも呼び出し契約とする。

## Significance and Coloring

各行のsummaryはrenderer内部で`independentDeltaSummary`を呼んで作る。有意差は次の条件に統一する。

```ts
const significant =
	Math.abs(summary.delta) > summary.combinedMad * 3 &&
	Math.abs(summary.delta) >= row.absoluteThreshold;
```

- absolute thresholdちょうどは有意とする。
- ノイズ境界`3 × combinedMad`ちょうどは非有意とする。
- Percentage thresholdは存在しない。
- 有意ならabsolute deltaと、表示されるpercentage deltaの両方を同じ方向色で着色する。
- 非有意なら両方とも無着色にする。
- `showDeltaPercentage`は描画だけに影響し、有意差判定には影響しない。
- Base medianが0の場合、percentageは計算不能なため`-`を表示する。この場合も有意差はabsolute deltaだけで既に決定されている。
- `onlySignificantChanges: true`の場合は`significant`でない行を除外する。
- 全行が除外された場合もtable headerとalignment rowは残す。

## Markdown Layout

table headerは全利用箇所で固定する。

```md
| Metric | @ Base | @ Head | Δ | MAD |
| --- | ---: | ---: | ---: | ---: |
```

`showMedianMad`がtrueならBase/Headを次の二段表示にする。

```md
median <br> ± MAD
```

falseならmedianだけを表示する。MAD列には設定にかかわらずcombined MADを表示する。

`showDeltaPercentage`がtrueならDeltaを次の二段表示にする。

```md
absolute delta<br>percentage delta
```

falseならabsolute deltaだけを表示する。

`separatorAfter`がtrueなら、行の直後に五列分の空table rowを挿入する。

```md
| | | | | |
```

Markdownを終了させる実際の空行は挿入しない。

## Consumer Mapping

### Frontend metrics

- Base/HeadのMAD二段表示: enabled
- Delta percentage二段表示: enabled
- Separator: disabled
- `onlySignificantChanges`: enabled
- Count threshold: `1`
- Byte threshold: `10_000`

現行のfrontend-localな集計、着色、row rendererを削除し、行定義とsample selectorだけを残す。

### Backend metrics

- Base/HeadのMAD二段表示: enabled
- Delta percentage二段表示: enabled
- Separator: disabled
- `onlySignificantChanges`: disabled
- Memory threshold: `100 KiB`

全metricを表示し、非有意なdeltaは無着色にする。非収束sampleのwarning自体は残すが、「results are marked inconclusive」という文言と、非収束を理由にtable着色やPSS増加warningを抑制する処理は削除する。

PSS増加warningの5%条件はtableのpercentage thresholdではなく、既存の独立した警告ルールとして維持する。warningはpositive delta、5%超、かつ`isOutsideObservedNoise`を満たす場合に出す。

### Heap Snapshot

`renderHeapSnapshotTable(base, head)`のpublic wrapperは維持し、内部で共通rendererを使う。

Total行:

- Base/HeadのMAD二段表示: enabled
- Delta percentage二段表示: enabled
- Separator: enabled
- Byte threshold: `100_000`

Category行:

- Base/HeadのMAD二段表示: disabled
- Delta percentage二段表示: disabled
- Separator: disabled
- Byte threshold: `100_000`

Category labelからBase/Headの構成比、`<details>`、`<summary>`を削除する。色見本と太字labelだけをraw labelとして渡し、Total summaryへの依存をなくす。

Heap Snapshotは全行を表示する。

## Explanatory Text

BackendとFrontendの説明文からResult/verdictへの言及を削除し、次の事実を記載する。

- Values are median ± MAD.
- Delta is Head - Base.
- Delta is highlighted when its absolute value reaches the metric threshold and exceeds `3 × MAD`.

Frontendには、この条件を満たす行だけを表示する旨も記載する。

## Tests

### Shared statistics

- Base/Headの独立中央値とcombined MAD
- 不均等なサンプル数
- `3 × combinedMad`の内側、境界、外側
- 片側2サンプル未満で例外
- Verdict/inconclusive関連testの削除または置換

### Shared renderer

- 五列headerとalignment
- defaultのmedian ± MADおよびpercentage二段表示
- `showMedianMad: false`
- `showDeltaPercentage: false`
- raw Markdown/HTML label
- `separatorAfter`による空table row
- absolute threshold未満、境界、超過
- ノイズ境界の内側、境界、外側
- 有意時にabsolute/percentageをまとめて着色
- 非有意時に両方を無着色
- `onlySignificantChanges`によるrow filtering
- Base medianが0の場合のpercentage `-`
- 片側2サンプル未満の例外伝播

### Consumer integration

- Heap Snapshot renderer testとgoldenを五列へ更新
- Heap Snapshot categoryから割合とdetails markupが消えること
- Total行だけ二段表示とseparatorを維持すること
- Backend goldenとfocused testsからResult/verdict期待値を削除
- Backendの非収束warning文面とPSS warning条件
- Frontend goldenとfocused testsからResult/verdict期待値を削除
- Frontendだけが非有意行を隠すこと
- Requests by resource type、Bundle Stats、visualizer、詳細HTMLなど対象外sectionが不変であること

## Files and Scope

主な変更対象:

- `packages-private/diagnostics-shared/src/stats.ts`
- `packages-private/diagnostics-shared/src/metric-table.ts` (new)
- `packages-private/diagnostics-shared/package.json`
- `packages-private/diagnostics-shared/src/heap-snapshot/render.ts`
- diagnostics-sharedの関連tests
- `packages-private/diagnostics-backend/src/report/markdown.ts`
- diagnostics-backendの関連tests/golden
- `packages-private/diagnostics-frontend/src/report.ts`
- diagnostics-frontendの関連tests/golden

Workflow、report JSON types、`packages/backend`、`packages/frontend`、locales、CHANGELOGは変更しない。

## Final Cleanup

この設計書と後続の実装計画は作業中の合意・実装指示にだけ使用する。実装と検証後に削除し、最終PRのnet diffへ`docs/superpowers`の一時ファイルを残さない。
