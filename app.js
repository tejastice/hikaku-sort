// グローバル変数
let items = [];           // 未ソートの要素リスト
let ranking = [];         // ソート済みランキング

// 現在比較中の要素と二分探索の範囲
let currentItem = null;
let left = 0;
let right = 0;
let mid = 0;

// 進捗管理
let totalComparisons = 0;      // 総比較回数（予測）
let currentComparisons = 0;    // 現在の比較回数

/**
 * ソート開始処理
 */
function start() {
  const inputText = document.getElementById("input").value;

  // 入力テキストを行ごとに分割し、空白をトリミング、空行を除外
  items = inputText
    .split("\n")
    .map(s => s.trim())
    .filter(s => s);

  // 入力チェック
  if (items.length === 0) {
    alert("要素を入力してください");
    return;
  }

  // ランキングをリセット
  ranking = [];

  // 進捗カウンターをリセット
  currentComparisons = 0;
  totalComparisons = calculateTotalComparisons(items.length);

  // 最初の要素から処理開始
  nextItem();
}

/**
 * 総比較回数を計算（二分探索つき挿入ソート）
 * n個の要素をソートする場合、最悪ケースでΣ(log2(i))回の比較が必要
 * @param {number} n - 要素数
 * @returns {number} 予測される総比較回数
 */
function calculateTotalComparisons(n) {
  let total = 0;
  for (let i = 2; i <= n; i++) {
    total += Math.ceil(Math.log2(i));
  }
  return total;
}

/**
 * 次の要素を処理
 */
function nextItem() {
  // すべての要素を処理完了
  if (items.length === 0) {
    document.getElementById("textA").textContent = "✓ 完了しました！";
    document.getElementById("textB").textContent = "";
    disableButtons(true);
    updateStatus(`完了 - 比較回数: ${currentComparisons}/${totalComparisons} (100%) | 確定済み: ${ranking.length}件`);
    return;
  }

  // 次の要素を取得
  currentItem = items.shift();

  // ランキングが空の場合は最初の要素として追加
  if (ranking.length === 0) {
    ranking.push(currentItem);
    render();
    nextItem();
    return;
  }

  // 二分探索の範囲を初期化
  left = 0;
  right = ranking.length - 1;

  // 比較開始
  ask();
}

/**
 * ユーザーに比較を要求
 */
function ask() {
  // 二分探索の中間位置を計算
  mid = Math.floor((left + right) / 2);

  // 比較する2要素を表示
  document.getElementById("textA").innerHTML = `<strong>${escapeHtml(currentItem)}</strong>`;
  document.getElementById("textB").innerHTML = `<strong>${escapeHtml(ranking[mid])}</strong>`;

  // ボタンを有効化
  disableButtons(false);

  // ステータス更新（進捗率を含む）
  updateProgressStatus();
}

/**
 * ユーザーの選択を処理
 * @param {string} result - 'better'（上位）, 'equal'（同位）, 'worse'（下位）
 */
function vote(result) {
  // 比較回数をカウント
  currentComparisons++;

  // 引き分けの場合はその位置に挿入
  if (result === "equal") {
    ranking.splice(mid, 0, currentItem);
    finishInsert();
    return;
  }

  // 二分探索の範囲を更新
  if (result === "better") {
    // 新しい要素の方が上位 → 探索範囲を上半分に
    right = mid - 1;
  } else {
    // 新しい要素の方が下位 → 探索範囲を下半分に
    left = mid + 1;
  }

  // 探索範囲が交差したら挿入位置が確定
  if (left > right) {
    ranking.splice(left, 0, currentItem);
    finishInsert();
  } else {
    // まだ探索範囲がある場合は次の比較へ
    ask();
  }
}

/**
 * 挿入完了処理
 */
function finishInsert() {
  disableButtons(true);
  render();
  nextItem();
}

/**
 * ランキング表示を更新
 */
function render() {
  const tbody = document.getElementById("rank");

  if (ranking.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #999;">まだデータがありません</td></tr>';
  } else {
    tbody.innerHTML = ranking
      .map((item, index) =>
        `<tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item)}</td>
        </tr>`
      )
      .join("");
  }

  // ステータス更新
  updateStatus(`確定済み: ${ranking.length}件`);
}

/**
 * ボタンの有効/無効を切り替え
 * @param {boolean} disabled - true: 無効化, false: 有効化
 */
function disableButtons(disabled) {
  document.getElementById("btnBetter").disabled = disabled;
  document.getElementById("btnEqual").disabled = disabled;
  document.getElementById("btnWorse").disabled = disabled;
}

/**
 * ステータス表示を更新
 * @param {string} message - 表示するメッセージ
 */
function updateStatus(message) {
  document.getElementById("status").textContent = message;
}

/**
 * 進捗状況を更新（比較回数と進捗率）
 */
function updateProgressStatus() {
  const progress = totalComparisons > 0
    ? Math.floor((currentComparisons / totalComparisons) * 100)
    : 0;

  const message = `比較回数: ${currentComparisons}/${totalComparisons} (${progress}%) | 確定済み: ${ranking.length}件`;
  updateStatus(message);
}

/**
 * HTMLエスケープ（XSS対策）
 * @param {string} str - エスケープする文字列
 * @returns {string} エスケープされた文字列
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 初期表示
render();
