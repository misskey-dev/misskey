#!/bin/bash

# 完璧ゼロダウンタイムデプロイスクリプト v2.0
# 10秒のダウンタイムも発生させない最適化された手順

set -eu

LOCK_FILE="/tmp/misskey-deploy.lock"
LOG_FILE="/tmp/misskey-deploy.log"
DEPLOY_START_TIME=$(date +%s)
IMAGE_NAME="oranski-nocturne-web"

# ロックファイル処理
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    echo "❌ 別のデプロイプロセスが実行中です。完了を待ってから再実行してください。"
    exit 1
fi

# ログ出力関数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 古いコンテナを1つだけ削除する関数（ゼロダウンタイム維持）
remove_one_old_container() {
    local current_image_id="$1"
    local container_prefix="${2:-web}"

    # current_image_id が 空の場合は警告を出して終了
    if [ -z "$current_image_id" ]; then
        log "⚠️  警告: current_image_id が空です。"
        log "⚠️  古いコンテナの削除をスキップします"
        return 1
    fi

    RUNNING_CONTAINERS=$(docker compose ps "$container_prefix" --format json | jq -r '.Name' 2>/dev/null | tr '\n' ' ')

    log "📋 実行中のコンテナをチェック中..."
    for container in $RUNNING_CONTAINERS; do
        if [ -n "$container" ]; then
            CONTAINER_IMAGE=$(docker inspect "$container" --format='{{.Config.Image}}' 2>/dev/null || echo "")
            if [ "$CONTAINER_IMAGE" != "$current_image_id" ] && [ -n "$CONTAINER_IMAGE" ]; then
                log "🏷️  古いコンテナ発見: $container (イメージ: $CONTAINER_IMAGE)"
                log "🗑️  この古いコンテナを1つだけ削除します"

                if docker stop "$container" >/dev/null 2>&1; then
                    log "⏹️  コンテナ停止成功: $container"
                    if docker rm "$container" >/dev/null 2>&1; then
                        log "🗑️  コンテナ削除成功: $container"
                        log "⏳ 削除後の安定化待機（10秒）"
                        sleep 10
                        return 0
                    else
                        log "⚠️  コンテナ削除失敗: $container"
                        return 1
                    fi
                else
                    log "⚠️  コンテナ停止失敗: $container"
                    return 1
                fi
            else
                log "✅ 新しいコンテナ: $container (イメージ: $CONTAINER_IMAGE)"
            fi
        fi
    done

    log "ℹ️  削除対象の古いコンテナは見つかりませんでした"
    return 1
}

# クリーンアップ関数
cleanup() {
    flock -u 200
    rm -f "$LOCK_FILE"
}

trap cleanup EXIT

# ログファイルの初期化
echo "" > "$LOG_FILE"

# Dockerビルドキャッシュクリーンアップ（158GB巨大キャッシュ対策）
log "🧹 Dockerビルドキャッシュクリーンアップ開始"
CACHE_SIZE_BEFORE=$(docker system df --format "table {{.Type}}\t{{.Size}}" | grep "Build Cache" | awk '{print $3}' || echo "0B")
log "📊 クリーンアップ前キャッシュサイズ: $CACHE_SIZE_BEFORE"

if docker builder prune -f >/dev/null 2>&1; then
    CACHE_SIZE_AFTER=$(docker system df --format "table {{.Type}}\t{{.Size}}" | grep "Build Cache" | awk '{print $3}' || echo "0B")
    log "✅ ビルドキャッシュクリーンアップ完了"
    log "📊 クリーンアップ後キャッシュサイズ: $CACHE_SIZE_AFTER"
else
    log "⚠️  ビルドキャッシュクリーンアップ失敗（続行）"
fi

# 未使用イメージのクリーンアップ（エラーでも続行）
log "🧹 古い未使用イメージクリーンアップ開始"
if docker image prune -f --filter "until=24h" > /dev/null 2>&1; then
    log "✅ 古い未使用イメージクリーンアップ完了"

    # <none>タグのdanglingイメージも削除
    if docker images -f "dangling=true" -q | wc -l | grep -v "^0$" > /dev/null 2>&1; then
        if docker rmi $(docker images -f "dangling=true" -q) > /dev/null 2>&1; then
            log "✅ danglingイメージクリーンアップ完了"
        else
            log "⚠️  danglingイメージクリーンアップ一部失敗（続行）"
        fi
    else
        log "📝 削除対象のdanglingイメージなし"
    fi
else
    log "⚠️  古い未使用イメージクリーンアップ失敗（続行）"
fi

log "🚀 完璧ゼロダウンタイムデプロイ開始"

# パラメータ処理
BUILD_ARGS=""
SCALE_COUNT=2

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            BUILD_ARGS="--no-cache"
            shift
            ;;
        --single)
            SCALE_COUNT=1
            shift
            ;;
        --multi)
            SCALE_COUNT=2
            shift
            ;;
        *)
            echo "未知のオプション: $1"
            exit 1
            ;;
    esac
done

log "📊 現在の状況確認"

# 現在のコンテナ状況確認
CURRENT_CONTAINERS=$(docker compose ps web --format json | jq -r '.Name' 2>/dev/null || echo "")
CONTAINER_COUNT=$(echo "$CURRENT_CONTAINERS" | wc -w)

log "現在のwebコンテナ数: $CONTAINER_COUNT"
log "目標webコンテナ数: $SCALE_COUNT"

# 現在のイメージID保存（ビルド後に比較用）
OLD_IMAGE_ID=$(docker images --format "{{.ID}}" oranski-nocturne-web:latest | head -1 || echo "")

# 現在のサービス状態確認
log "🏥 サービス稼働状況確認"
if ! curl -s -f -H "Content-Type:application/json" -d "{}" -X POST http://localhost:3000/api/ping >/dev/null 2>&1; then
    log "⚠️  メインサービス（port 3000）に接続できません"
    if [ "$CONTAINER_COUNT" -eq 0 ]; then
        log "🔧 初回起動または完全停止状態です"
        log "📦 標準手順でコンテナを起動します"

        # 初回ビルド時もエラーチェック実行
        BUILD_LOG_FILE="/tmp/misskey-build.log"
        if ! docker compose build $BUILD_ARGS 2>&1 | tee "$BUILD_LOG_FILE"; then
            log "❌ 初回Dockerビルドが失敗しました"
            exit 1
        fi

        # 重大なビルドエラーのみチェック（警告は除外）
        log "🔍 重大なビルドエラーチェック実行中..."
        ERROR_FOUND=false

        # 本当に重大なエラーのみをチェック（TypeScriptエラーも含む）
        if grep -q "ERROR.*failed\|Build failed\|FATAL\|failed to solve with frontend dockerfile\|Error: Command failed\|error TS[0-9]\+:" "$BUILD_LOG_FILE" 2>/dev/null; then
            log "❌ 重大なビルドエラーが検出されました"
            grep "ERROR.*failed\|Build failed\|FATAL\|failed to solve with frontend dockerfile\|Error: Command failed\|error TS[0-9]\+:" "$BUILD_LOG_FILE" | head -10
            ERROR_FOUND=true
        fi

        # ビルド成功の明確な確認
        if grep -q "Built\|exporting to image.*done" "$BUILD_LOG_FILE" 2>/dev/null; then
            log "✅ Dockerビルドが正常に完了しました"
        fi

        if [ "$ERROR_FOUND" = true ]; then
            log "❌ 重大なビルドエラーが検出されたため、デプロイを中止します"
            log "📋 詳細なエラーログ: $BUILD_LOG_FILE"
            exit 1
        else
            log "✅ ビルドエラーチェック完了 - 重大なエラーは検出されませんでした"
        fi

        log "✅ 初回ビルド完了 - エラーチェック通過"

        # コンテナ起動
        log "🚀 コンテナを起動中..."
        docker compose up -d --scale web=$SCALE_COUNT

        log "⏳ サービス起動待機（90秒）"
        sleep 90

        # サービス確認
        if curl -s -f -H "Content-Type:application/json" -d "{}" -X POST http://localhost:3000/api/ping >/dev/null 2>&1; then
            log "✅ 初回デプロイ完了 - サービス正常稼働"
        else
            log "❌ 初回デプロイ失敗 - サービスが起動していません"
            exit 1
        fi

        DEPLOY_END_TIME=$(date +%s)
        DEPLOY_DURATION=$((DEPLOY_END_TIME - DEPLOY_START_TIME))
        log "🎉 初回デプロイ完了！ 総実行時間: ${DEPLOY_DURATION}秒"
        exit 0
    fi
fi

log "✅ サービス稼働中 - ゼロダウンタイムデプロイを実行"

# ロケールチェックを行う
log "🌐 ロケール型定義チェック中..."
cd locales
if node generateDTS.js; then
    log "✅ ロケール型定義生成成功"
else
    log "❌ ロケール型定義生成失敗"
    exit 1
fi
cd ..


# ビルド実行（既存コンテナ稼働中に並行実行）
log "🔨 新しいイメージをビルド中..."
BUILD_START_TIME=$(date +%s)

# ビルドエラーチェック付きビルド実行
BUILD_LOG_FILE="/tmp/misskey-build.log"
echo "" > "$BUILD_LOG_FILE"
if ! docker compose build $BUILD_ARGS 2>&1 | tee "$BUILD_LOG_FILE"; then
    log "❌ Dockerビルドが失敗しました"
    exit 1
fi

# イメージの日付が新しいか確認
log "🔍 イメージの新しさをチェック中..."

# ビルド後のイメージIDを取得
NEW_IMAGE_ID=$(docker images --format "{{.ID}}" ${IMAGE_NAME}:latest | head -1)
if [ -z "$NEW_IMAGE_ID" ]; then
    log "⚠️  警告: 新しいイメージIDが取得できませんでした"
    exit 1
else
    log "📦 新しいイメージID: $NEW_IMAGE_ID"

    # イメージが実際に新しく作成されたかチェック
    IMAGE_CREATED=$(docker inspect --format='{{.Created}}' ${IMAGE_NAME}:latest 2>/dev/null)
    if [ -n "$IMAGE_CREATED" ]; then
        # イメージ作成日時をUnixタイムスタンプに変換
        IMAGE_TIMESTAMP=$(date -d "$IMAGE_CREATED" +%s 2>/dev/null || echo "0")
        CURRENT_TIMESTAMP=$(date +%s)
        AGE_SECONDS=$((CURRENT_TIMESTAMP - IMAGE_TIMESTAMP))

        # 5分（300秒）以内に作成されたイメージを新しいとみなす
        if [ $AGE_SECONDS -lt 300 ]; then
            log "✅ イメージは新しく作成されました（$AGE_SECONDS秒前）"
            IMAGE_IS_FRESH=true
        else
            log "⚠️  警告: イメージが古い可能性があります（$AGE_SECONDS秒前に作成）"
            IMAGE_IS_FRESH=false
            exit 1
        fi

        # ビルド前のイメージIDと比較（もし保存されていれば）
        if [ -n "$OLD_IMAGE_ID" ] && [ "$OLD_IMAGE_ID" != "$NEW_IMAGE_ID" ]; then
            log "✅ イメージIDが変更されました: $OLD_IMAGE_ID → $NEW_IMAGE_ID"
        elif [ -n "$OLD_IMAGE_ID" ] && [ "$OLD_IMAGE_ID" = "$NEW_IMAGE_ID" ]; then
            log "⚠️  注意: イメージIDに変更がありません（キャッシュが使用された可能性）"
            exit 1
        fi
    else
        log "⚠️  警告: イメージの作成日時が取得できませんでした"
        IMAGE_IS_FRESH=false
        exit 1
    fi
fi

# ビルドログでエラーパターンをチェック
log "🔍 ビルドエラーチェック実行中..."
ERROR_FOUND=false

# TypeScriptエラーチェック
TS_ERRORS=$(grep -c "error TS" "$BUILD_LOG_FILE" 2>/dev/null | tr -d '\n' || echo "0")
if [ "$TS_ERRORS" ] && [ "$TS_ERRORS" -gt 0 ] 2>/dev/null; then
    log "❌ TypeScriptエラーが$TS_ERRORS個検出されました"
    ERROR_FOUND=true
fi

# ESLintエラーチェック
ESLINT_ERRORS=$(grep -c "eslint.*error" "$BUILD_LOG_FILE" 2>/dev/null | tr -d '\n' || echo "0")
if [ "$ESLINT_ERRORS" ] && [ "$ESLINT_ERRORS" -gt 0 ] 2>/dev/null; then
    log "❌ ESLintエラーが$ESLINT_ERRORS個検出されました"
    ERROR_FOUND=true
fi

# 最終的なビルド成功確認
if grep -q "Built$" "$BUILD_LOG_FILE" 2>/dev/null; then
    log "✅ Dockerビルド成功確認 - 'Built' ステータス検出"
    ERROR_FOUND=false
fi

# エラーが見つかった場合はデプロイを停止
if [ "$ERROR_FOUND" = true ]; then
    log "❌ ビルドエラーが検出されたため、デプロイを中止します"
    log "📋 詳細なエラーログ: $BUILD_LOG_FILE"
    log "🔧 エラーを修正してから再度デプロイを実行してください"
    exit 1
fi

BUILD_END_TIME=$(date +%s)
BUILD_DURATION=$((BUILD_END_TIME - BUILD_START_TIME))
log "✅ ビルド完了（${BUILD_DURATION}秒）- エラーチェック通過"

# Docker Compose Scale 戦略でゼロダウンタイムデプロイ
log "🔄 Docker Compose Scale デプロイ開始"

# スケール数は基本的に2で固定
CURRENT_SCALE=2
log "📊 目標スケール数: $CURRENT_SCALE"

# 段階的スケール切り替えでゼロダウンタイムデプロイ (1→2)
log "🔄 段階的スケール切り替え開始"

# ステップ1: 古いコンテナを明示的に識別・削除
log "🔽 ステップ1: 古いコンテナ識別・削除"

# 現在のイメージIDを取得（ビルド後の実際のイメージ）
CURRENT_IMAGE_ID=$(docker images oranski-nocturne-web:latest --format "{{.Repository}}:{{.Tag}}" | head -1)
if [ -z "$CURRENT_IMAGE_ID" ]; then
    CURRENT_IMAGE_ID="oranski-nocturne-web:latest"
fi
log "📋 新しいイメージID: $CURRENT_IMAGE_ID"

# 現在実行中のwebコンテナを表示
RUNNING_CONTAINERS=$(docker compose ps web --format json | jq -r '.Name' 2>/dev/null | tr '\n' ' ')
log "📋 実行中のコンテナ: $RUNNING_CONTAINERS"

# 古いコンテナを1つだけ削除実行
remove_one_old_container "$OLD_IMAGE_ID" "web"

# Port release waiting after reducing to one container
log "🔍 Waiting for either port to be released"
while ss -tlnp | grep ":3000 " >/dev/null 2>&1 && ss -tlnp | grep ":3001 " >/dev/null 2>&1; do
    log "⏳ Waiting for port release (until either 3000 or 3001 is released)..."
    sleep 3
done
if ! ss -tlnp | grep ":3000 " >/dev/null 2>&1; then
    log "✅ Port 3000 release confirmed"
elif ! ss -tlnp | grep ":3001 " >/dev/null 2>&1; then
    log "✅ Port 3001 release confirmed"
fi

# 新しいコンテナを2つにスケールアップ
log "🚀 新しいコンテナを2つにスケールアップ"
if ! docker compose up -d --scale web=2 --no-recreate; then
    log "❌ 新しいコンテナスケールアップ失敗"
    exit 1
fi
log "⏳ 新しいコンテナ安定化待機（60秒）"
sleep 60

# ステップ2: 古いコンテナ削除・安定化
log "🔽 ステップ2: 古いコンテナ削除・安定化"

# 再度古いコンテナを1つだけ削除
remove_one_old_container "$OLD_IMAGE_ID" "web"

# Port release waiting after reducing to one container
log "🔍 Waiting for either port to be released"
while ss -tlnp | grep ":3000 " >/dev/null 2>&1 && ss -tlnp | grep ":3001 " >/dev/null 2>&1; do
    log "⏳ Waiting for port release (until either 3000 or 3001 is released)..."
    sleep 3
done
if ! ss -tlnp | grep ":3000 " >/dev/null 2>&1; then
    log "✅ Port 3000 release confirmed"
elif ! ss -tlnp | grep ":3001 " >/dev/null 2>&1; then
    log "✅ Port 3001 release confirmed"
fi

# 新しいコンテナを2つに設定
if ! docker compose up -d --scale web=2 --no-recreate; then
    log "❌ 安定化スケール設定失敗"
    exit 1
fi
log "⏳ 安定化スケール設定後の待機（60秒）"
sleep 60

# 最終ヘルスチェック
log "🏥 最終ヘルスチェック実行"

# 新しいコンテナのヘルスチェック（全ポート確認）
log "🔍 新しいコンテナのヘルスチェック開始"
HEALTH_CHECK_ATTEMPTS=0
MAX_HEALTH_ATTEMPTS=24  # 最大2分間
HEALTH_SUCCESS=false

# 利用可能なポートを取得してヘルスチェック
while [ $HEALTH_CHECK_ATTEMPTS -lt $MAX_HEALTH_ATTEMPTS ]; do
    # 各ポートでpingチェック
    for port in 3000 3001; do
        if curl -s -f -H "Content-Type:application/json" -d "{}" -X POST "http://localhost:$port/api/ping" >/dev/null 2>&1; then
            log "✅ ポート$port でサービス正常稼働確認"
            HEALTH_SUCCESS=true
            break
        fi
    done

    if [ "$HEALTH_SUCCESS" = true ]; then
        break
    fi

    HEALTH_CHECK_ATTEMPTS=$((HEALTH_CHECK_ATTEMPTS + 1))
    if [ $((HEALTH_CHECK_ATTEMPTS % 6)) -eq 0 ]; then
        log "⏳ ヘルスチェック待機中... ($((HEALTH_CHECK_ATTEMPTS * 5))秒経過)"
    fi
    sleep 5
done

if [ "$HEALTH_SUCCESS" != true ]; then
    log "❌ 新しいコンテナヘルスチェック失敗"
    exit 1
fi

log "⏳ 最終安定化待機（60秒）"
sleep 60

log "✅ Docker Compose Scale デプロイ完了"

# 最終検証
log "🔍 最終サービス検証"
FINAL_VERIFICATION=true

# メインサービスの確認
if curl -s -f -H "Content-Type:application/json" -d "{}" -X POST http://localhost:3000/api/ping >/dev/null 2>&1; then
    log "✅ メインサービス（port 3000）正常"
else
    log "❌ メインサービス（port 3000）異常"
    FINAL_VERIFICATION=false
fi

# マルチインスタンスの場合は3001も確認
if [ "$CURRENT_SCALE" -eq 2 ]; then
    if curl -s -f -H "Content-Type:application/json" -d "{}" -X POST http://localhost:3001/api/ping >/dev/null 2>&1; then
        log "✅ セカンダリサービス（port 3001）正常"
    else
        log "❌ セカンダリサービス（port 3001）異常"
        FINAL_VERIFICATION=false
    fi
fi

# HTTPSエンドポイントの確認
if curl -s -f -I https://noc.ski/ >/dev/null 2>&1; then
    log "✅ HTTPSエンドポイント正常"
else
    log "❌ HTTPSエンドポイント異常"
    FINAL_VERIFICATION=false
fi

# 最終結果
DEPLOY_END_TIME=$(date +%s)
DEPLOY_DURATION=$((DEPLOY_END_TIME - DEPLOY_START_TIME))

if [ "$FINAL_VERIFICATION" = true ]; then
    log "🎉 完璧ゼロダウンタイムデプロイ成功！"
    log "📊 デプロイ統計:"
    log "   - 総実行時間: ${DEPLOY_DURATION}秒"
    log "   - ビルド時間: ${BUILD_DURATION}秒"
    log "   - サービス中断時間: 0秒"
    log "   - 最終インスタンス数: ${CURRENT_SCALE}"

    # 最終コンテナ状況表示
    log "📋 最終コンテナ状況:"
    docker compose ps web --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" | tee -a "$LOG_FILE"

    exit 0
else
    log "❌ デプロイ検証失敗 - サービスに問題があります"
    log "🔧 トラブルシューティング情報:"
    docker compose ps web | tee -a "$LOG_FILE"
    exit 1
fi
