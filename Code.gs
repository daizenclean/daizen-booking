/**
 * DAIZEN Web予約 受付スクリプト（Google Apps Script）
 * - 予約フォームの内容をスプレッドシートに1行ずつ保存
 * - お客様に確認メール、DAIZENに通知メールを送信
 * - Google口コミの評価・件数を毎日自動で取得（ファイル後半）
 * 設定手順は README.md を参照してください。
 */
const NOTIFY_TO = "daizen.clean@gmail.com";   // 予約通知を受け取るアドレス
const SHOP_NAME = "DAIZEN（株式会社大善）";
const SHOP_TEL  = "03-3442-5646／080-9544-3951";
const SHEET_NAME = "予約";

const COLUMNS = [
  ["submittedAt", "受付日時"], ["name", "お名前"], ["kana", "フリガナ"], ["company", "法人名"],
  ["tel", "電話番号"], ["email", "メール"], ["zip", "郵便番号"], ["pref", "都道府県"], ["address", "住所"],
  ["house", "建物"], ["layout", "間取り・広さ"],
  ["date1", "第1希望日"], ["time1", "第1希望時間"], ["date2", "第2希望日"], ["time2", "第2希望時間"],
  ["date3", "第3希望日"], ["time3", "第3希望時間"],
  ["items", "ご依頼内容"], ["total", "概算金額(税込)"],
  ["payment", "支払い"], ["parking", "駐車場"], ["presence", "立会い"],
  ["memo", "ご要望"], ["source", "きっかけ"], ["coupon", "クーポン"], ["status", "対応状況"],
];

function doPost(e) {
  const d = e.parameter || {};
  d.status = "未対応";
  const sheet = getSheet_();
  sheet.appendRow(COLUMNS.map(([k]) => k === "submittedAt" ? new Date() : (d[k] || "")));

  const yen = n => Number(n || 0).toLocaleString("ja-JP") + "円";
  const wishes = [1, 2, 3].map(i => d["date" + i] ? `第${i}希望：${d["date" + i]} ${d["time" + i] || ""}` : "").filter(String).join("\n");
  const body =
`${d.name} 様

このたびは${SHOP_NAME}にご予約いただき、誠にありがとうございます。
以下の内容で受け付けいたしました。担当者より日程確定のご連絡を差し上げます。

■ ご依頼内容
${d.items || "（ご要望欄をご確認します）"}

■ 概算金額（税込）：${yen(d.total)}
※現地確認のうえ確定します。駐車場代は別途実費です。

■ ご希望日時
${wishes}

■ ご住所
${d.pref || ""}${d.address || ""}

■ ご要望
${d.memo || "なし"}

ご不明な点はお気軽にお問い合わせください。
${SHOP_NAME}
TEL ${SHOP_TEL}（8:00〜19:00 年中無休）
`;

  if (d.email) {
    MailApp.sendEmail({ to: d.email, subject: `【${SHOP_NAME}】ご予約を受け付けました`, body, replyTo: NOTIFY_TO, name: SHOP_NAME });
  }
  MailApp.sendEmail({
    to: NOTIFY_TO,
    subject: `【Web予約】${d.name} 様／${yen(d.total)}`,
    body: `新しいWeb予約が入りました。\n電話：${d.tel}\nメール：${d.email}\n\n` + body + `\nスプレッドシート：${sheet.getParent().getUrl()}`,
  });
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(COLUMNS.map(([, label]) => label));
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold").setBackground("#0d1a26").setFontColor("#ffffff");
  }
  return sh;
}

/* ============================================================
 * Google口コミ（評価・件数）の自動更新
 * - updateReviews：Google Places API から最新の評価と件数を取得して保存
 * - setupDailyTrigger：updateReviews を毎朝6時台に自動実行する設定（最初に1回だけ実行）
 * - doGet(?reviews=1)：サイトが保存済みの数字を読みに来る窓口
 * APIキーは「プロジェクトの設定 → スクリプト プロパティ」に
 *   PLACES_API_KEY = （Google Cloud で作成したキー）
 * として保存してください（コードには書かないこと）。
 * ============================================================ */
const PLACE_QUERY = "ハウスクリーニングDAIZEN 東京都港区白金台5-22-11";

function updateReviews() {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty("PLACES_API_KEY");
  if (!key) throw new Error("スクリプト プロパティに PLACES_API_KEY を設定してください");

  let placeId = props.getProperty("PLACE_ID");
  let place;
  if (placeId) {
    place = placesFetch_("https://places.googleapis.com/v1/places/" + placeId, "get", key, "id,displayName,rating,userRatingCount");
  } else {
    // 初回だけ店名で検索して Place ID を覚える
    const res = placesFetch_("https://places.googleapis.com/v1/places:searchText", "post", key,
      "places.id,places.displayName,places.rating,places.userRatingCount",
      { textQuery: PLACE_QUERY, languageCode: "ja" });
    const list = res.places || [];
    place = list.find(p => /DAIZEN|大善/i.test((p.displayName || {}).text || "")) || list[0];
    if (!place) throw new Error("お店が見つかりませんでした：" + PLACE_QUERY);
    props.setProperty("PLACE_ID", place.id);
  }
  if (!place.rating || !place.userRatingCount) throw new Error("評価・件数が取得できませんでした");

  const data = { rating: place.rating, count: place.userRatingCount, name: (place.displayName || {}).text, updated: new Date().toISOString() };
  props.setProperty("REVIEWS", JSON.stringify(data));
  console.log("口コミを更新しました", data);
  return data;
}

function placesFetch_(url, method, key, fieldMask, body) {
  const res = UrlFetchApp.fetch(url, {
    method: method,
    contentType: "application/json",
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": fieldMask },
    payload: body ? JSON.stringify(body) : undefined,
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error("Places API エラー " + res.getResponseCode() + "：" + res.getContentText());
  return JSON.parse(res.getContentText());
}

function setupDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "updateReviews")
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("updateReviews").timeBased().everyDays(1).atHour(6).create();
  return updateReviews();   // 設定と同時に1回取得しておく
}

function doGet(e) {
  if (e && e.parameter && e.parameter.reviews) {
    const saved = PropertiesService.getScriptProperties().getProperty("REVIEWS") || "{}";
    return ContentService.createTextOutput(saved).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("DAIZEN 予約受付は稼働中です").setMimeType(ContentService.MimeType.TEXT);
}
