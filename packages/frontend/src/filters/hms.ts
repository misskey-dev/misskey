export default (ms: number) => {
    const res: string[] = [];

    // ミリ秒を秒に変換
    let seconds = Math.floor(ms / 1000);

    // 時間を計算
    let hours = Math.floor(seconds / 3600);
    if (hours > 0) res.push(format(hours));
    seconds %= 3600;

    // 分を計算
    let minutes = Math.floor(seconds / 60);
    res.push(format(minutes));
    seconds %= 60;

    // 残った秒数を取得
    seconds = seconds % 60;
    res.push(format(seconds));

    // 結果を返す
    return res.join(':');
};

function format(n: number) {
    return n.toString().padStart(2, '0');
}
