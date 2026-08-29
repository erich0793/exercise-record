# 每週運動達標換算網頁

單檔、可離線執行的網頁應用，用於記錄每週運動並自動判定是否達成 WHO 2020 / US PAG 2nd ed. 之身體活動建議量。同時涵蓋**有氧運動**（中／高強度分鐘數、等效換算、MET-minutes）與**肌力訓練**（訓練天數、7 大主要肌群覆蓋率）。

---

## 0. 證據分級系統宣告

**分級系統**：GRADE（Grading of Recommendations, Assessment, Development and Evaluation）

**參考依據**：GRADE Working Group 方法論；WHO 2020 指引本身即以 GRADE 標示各條建議之強度與證據確定性。

### 層級完整定義

| GRADE 等級 | 定義 |
|---|---|
| **High** | 對效果估計值有高度信心；真實效果極可能接近估計值 |
| **Moderate** | 對效果估計值有中度信心；真實效果可能接近估計值，但仍有實質不同之可能 |
| **Low** | 對效果估計值信心有限；真實效果可能與估計值有實質差異 |
| **Very Low** | 對效果估計值幾無信心；真實效果極可能與估計值有實質差異 |

### 建議強度標示（WHO 用法）

| 標示 | 意義 |
|---|---|
| **Strong recommendation** | 期望效益明確大於不良後果，多數人在多數情境下應採行（用語：should） |
| **Conditional recommendation** | 效益與代價之平衡較不確定，需視個別情境調整（用語：may） |

### 適用範圍與額外標籤

除 GRADE 外，本文件對**非建議性質**之參考數值另加標籤：

- `[參考測量值]` — 測量學參考資料（如 MET 查表值），性質為 reference data 而非 recommendation，不適用 GRADE
- `[公式推導]` — 由實驗室代謝方程式推算所得
- `[指引慣例]` — 指引採用之換算約定，非獨立實證結論

---

## 1. 安裝與使用

**無需安裝、無 build step、無外部 API 呼叫。**

```
git clone <repo>
open index.html          # 或直接以瀏覽器開啟檔案
```

或以任意靜態伺服器提供（手機使用時較方便）：

```
npx http-server . -p 8080
```

- 環境需求：現代瀏覽器（iOS Safari / Android Chrome / 桌機瀏覽器）
- 資料儲存於該瀏覽器的 `localStorage`，不上傳、不同步；清除瀏覽器資料會一併移除，建議定期由「設定 → 匯出 JSON」備份
- 深色模式依系統偏好（`prefers-color-scheme`）自動切換
- 技術實作：vanilla JS，主體為單一 `index.html`（HTML + CSS + JS 全內嵌），趨勢圖以純 SVG 繪製
- **例外**：跑步機數字辨識（OCR）需要 `vendor/ocr/` 內的資源（約 13 MB，Tesseract 開源引擎，自行託管、不呼叫外部 API）。這是全專案唯一的外部相依，且**僅在使用者主動按下辨識時才載入**；`index.html` 單獨存在時所有其他功能完全正常，辨識則會顯示提示並可改為手動輸入

---

## 2. 功能說明

### ① 本週儀表板（預設首頁）

- **有氧進度條**：MEM 數值，同時標出 **150** 與 **300** 兩條刻度線，並明確區分「基本達標」（substantial health benefits，Strong recommendation, Moderate certainty）與「額外效益」（additional health benefits，**Conditional** recommendation, Moderate certainty）
- **高強度單獨計進度條**：75 / 150 分鐘刻度
- **MET-minutes**：附 500–1000 參考帶（輔助指標，非達標判準）與本週估計熱量
- **肌力訓練天數**：本週 X 天 / 目標 ≥2 天
- **7 大肌群覆蓋圖**：未覆蓋者以灰階顯示，並列出缺漏肌群
- **綜合達標燈號**：🟢 / 🟡 / 🔴
- 可切換檢視上週／下週

### ② 新增紀錄

- 日期、活動類別、時長（分鐘）
- 依類別動態顯示欄位：
  - **跑步** → 速度（km/hr）／配速（min/km）雙向連動，即時顯示由 ACSM 方程式算出的 MET
  - **跑步機讀數**（跑步專屬）→ 可拍照或匯入跑步機螢幕照片，填入**距離 + 時間**後自動換算速度、配速、時長與 MET；時間支援 `mm:ss`、`h:mm:ss` 與純分鐘數
  - **自動辨識（OCR）** → 框選照片上的數字即可自動讀出距離與時間，結果先顯示供確認才套用（見第 3.9 節）
  - **游泳** → 12 種泳姿佔比輸入的混合泳姿加權計算器 + 強制顯示的技術經濟性警語（可摺疊）
  - **肌力** → 7 大肌群多選 + 「強度 moderate 以上」勾選
- **主觀強度覆寫**：talk test / RPE Borg 6–20 / RPE CR10；覆寫後之紀錄標註來源為「主觀判定」
- 即時顯示本次計算之 MET、強度分級、MEM 貢獻、MET-min、估計熱量

### ③ 歷史紀錄

- **達標軌跡（近 12 週）**：一眼掌握跨週達標狀況
  - 三格統計：目前連續、近 12 週雙軌達標次數、最長連續
  - 12 週狀態格：每欄一週，分別顯示有氧／肌力／綜合燈號；達標為實心、未達標為淺色、無紀錄為虛線框（不僅靠顏色區分）
  - 點選任一週可跳至該週儀表板
  - **連續週數排除進行中的當週**，否則每週一打開 App 連續數都會被尚未完成的一週歸零
- 依週分組列表，可編輯／刪除；每週標題以「有氧達標／肌力達標」兩個標籤呈現，避免窄螢幕折行
- 近 12 週趨勢圖（MEM 柱狀走左軸、MET-min 折線走右軸，虛線為 150 / 300 MEM），純 SVG 繪製

### ④ 說明

App 內建的說明頁，可由「新增紀錄」各欄位旁的 **?** 按鈕直接跳轉至對應段落。內容依本文件第 0 節之 GRADE 宣告標示等級與出處，並置於實質內容之前。涵蓋：

- **整體運動建議與醫學理論**（10 小節）：指引建議全貌、MET 的定義與物理基礎、`1 MET = 3.5` 約定的系統性偏誤、高強度計 2 倍的理論根據、absolute vs relative intensity、劑量-反應曲線形狀、有氧與肌力不可折抵的生理學理由、MET-minutes 的角色、心率公式基礎、以及本工具能與不能回答什麼
- **各欄位怎麼填**：活動項目、時長、跑步機讀數、主觀強度覆寫、計入肌力訓練、主要肌群、強度 moderate 以上、備註
- **抱石／攀岩怎麼記**：MET 該填多少、算不算肌力訓練、該怎麼計次才知道達標
- **重量訓練需要計算 MET 嗎**
- **一週兩次重量訓練就夠了嗎**
- **證據缺口與限制**

選擇抱石／攀岩項目時，「新增紀錄」頁會另外顯示肌群勾選提示（見第 4.3 節）。

### ⑤ 設定

- 體重、年齡、靜息心率、週起始日（預設週一）
- 心率模組（選用，**預設摺疊**）：Tanaka HRmax、水中修正、Karvonen 目標心率
- 自訂活動項目管理（名稱 + MET 值，存入 localStorage）
- 資料匯出（JSON / CSV）、匯入（JSON）、清除
- 驗收測試（TC-1 ~ TC-13）一鍵執行
- 來源、GRADE 說明與免責聲明固定區塊

---

## 3. 核心計算邏輯

### 3.1 強度分級（absolute intensity, MET-based）`[參考測量值]`

| 分級 | MET 範圍 |
|---|---|
| Light | 1.6 – 2.9 |
| Moderate | 3.0 – 5.9 |
| Vigorous | ≥ 6.0 |

分級由 MET 值自動判定，邊界為 `MET >= 6.0` 判為 vigorous。

### 3.2 等效換算 `[指引慣例]`

```
MEM (moderate-equivalent minutes) = moderate_minutes + 2 × vigorous_minutes
```

出處：US PAG 2nd ed. (2018) 之 moderate-intensity equivalent 概念；WHO 2020 亦採同一約定。

### 3.3 有氧達標判定

| 等級 | MEM 條件 | 對應高強度單獨計 | 標籤 | GRADE |
|---|---|---|---|---|
| 未達標 | < 150 | < 75 min | — | — |
| 基本達標 | 150 – 300 | 75 – 150 min | substantial health benefits | Strong recommendation, Moderate certainty |
| 額外效益 | > 300 | > 150 min | additional health benefits | **Conditional** recommendation, Moderate certainty |

### 3.4 MET-minutes

```
MET-min = Σ (MET_i × duration_minutes_i)
```

參考帶：每週 500 – 1000 MET-min（輔助指標，非主要達標判準）。

### 3.5 肌力訓練達標判定

`GRADE: Strong recommendation, Moderate certainty evidence`

兩者皆須滿足：

1. 每週 ≥ 2 個不同日執行肌力訓練
2. 涵蓋全部 7 組主要肌群，強度為 moderate 或以上

主要肌群：腿部 (legs) / 髖部 (hips) / 背部 (back) / 腹部 (abdomen) / 胸部 (chest) / 肩部 (shoulders) / 手臂 (arms)

### 3.6 綜合達標燈號

| 燈號 | 條件 |
|---|---|
| 🟢 綠 | 有氧達標 **且** 肌力達標 |
| 🟡 黃 | 僅其中一項達標 |
| 🔴 紅 | 兩項皆未達標 |

綠燈**不得**因有氧超量而在肌力未達標時亮起；兩者為獨立且不可互相取代的建議。

### 3.7 跑步 MET `[公式推導]`

ACSM 跑步代謝方程式（平地）：

```javascript
function runningMET(speedKmh) {
  const speedMPerMin = speedKmh * 1000 / 60;
  const vo2 = 0.2 * speedMPerMin + 3.5;   // mL/kg/min
  return vo2 / 3.5;
}
// runningMET(9) → 9.57
```

**適用範圍檢查**：此方程式適用於約 **8 km/hr 以上**的真實跑步。速度低於此值時，App 會在即時預覽處顯示警示並提供「改用快走項目」一鍵切換，但**不阻擋儲存**——真正的慢跑仍可套用此公式，只是準確度下降；若實際上是步行則會高估（例：5 km/hr 套跑步公式得 MET 5.76，而快走 5.6 km/hr 查表值僅 4.3，高估約 34%）。

```javascript
runningSpeedCheck(9)    // → null（適用）
runningSpeedCheck(8.0)  // → null（邊界含 8.0）
runningSpeedCheck(7.9)  // → { belowRange: true, minSpeedKmh: 8.0, minPaceMinPerKm: 7.5 }
```

### 3.8 跑步機讀數換算 `[實作約定]`

```javascript
parseDurationToMinutes('17:12')      // → 17.2（mm:ss）
parseDurationToMinutes('1:17:12')    // → 77.2（h:mm:ss）
parseDurationToMinutes('30')         // → 30（純分鐘）
parseDurationToMinutes('abc')        // → null（無法解析時提示使用者）
speedFromDistanceTime(2.8, 17.2)     // → 9.767 km/hr
```

換算採**全程平均速度**（距離 ÷ 時間），再由 ACSM 方程式推得 MET。若課表含大量走路休息或間歇衝刺，平均速度會低估或高估實際強度，此時應改用主觀強度覆寫。

**照片處理**：照片僅存於本機 `localStorage`，不上傳、不辨識。存檔前以 canvas 縮圖至最長邊 `CONFIG.photo.maxDimPx`（1200 px）並轉為 JPEG（品質 0.72）；實測 2.9 MB 的手機照片壓縮後約 106 KB（縮減 96%）。若 `localStorage` 配額不足，程式會**捨棄照片後重試儲存**，確保運動紀錄本身不會遺失，並以提示告知使用者。

### 3.9 跑步機數字自動辨識（OCR）`[實作約定]`

引擎為 Tesseract（開源），資源自行託管於 `vendor/ocr/`，**不呼叫任何外部 API，照片不會離開使用者裝置**。

**必須框選，不做整張辨識**

整張照片直接辨識實測失敗：信心度僅 19–26，輸出為亂碼。縮小到單一數字區域後才可靠：

| 方式 | 距離 | 時間 |
|---|---|---|
| 整張原圖 | ✗ 亂碼 | ✗ 亂碼 |
| 裁切數字帶（全寬） | ✗ `2.` | ✓ `17:12` |
| **分區裁切（單一數字）** | **✓ `2.8`** | **✓ `17:12`** |

因此介面設計為：使用者先選欄位（距離／時間），再框住照片上對應的數字。

**投票機制**

單一組參數不可靠，故對選取區域執行 `CONFIG.ocr.thresholds`（4 組二值化門檻）× `CONFIG.ocr.psmModes`（2 種版面模式）共 8 個回合，再由 `pickOcrCandidate()` 依「出現次數優先、信心度次之」投票，並以 `isValidOcrValue()` 做格式把關（距離須為 `\d{1,3}(.\d{1,2})?` 且 0 < n < 200；時間須為 `mm:ss` 或 `h:mm:ss` 且秒數合法）。無合格候選時回傳 `null`。

**安全設計**

- **結果一律先顯示於可編輯欄位，按下「套用到表單」才進入紀錄**，不會靜默寫入
- 顯示「8 回合中有幾回合得到同一結果」；**票數 ≤ 1 時以紅字警示並將欄位邊框標紅**，明講可靠度低、請核對照片
- 同時列出其他候選值
- 實測本專案樣本照片：距離 `2.8`（3/8 票）、時間 `17:12`（**1/8 票，觸發警示**）

**載入與降級**

- 僅在使用者按下辨識時才載入，首次約 **8.9 MB**（`tesseract.min.js` 65 KB、`worker.min.js` 121 KB、`tesseract-core-simd-lstm.wasm.js` 3.8 MB、`eng.traineddata` 5.0 MB），之後由瀏覽器快取
- 以 `file://` 開啟時瀏覽器同源限制會使 worker 無法啟動，程式會**立即明確告知**而非空等
- 載入與辨識均有 120 秒逾時保護
- 任何失敗都只影響辨識，手動輸入與其餘功能不受影響

### 3.10 游泳混合泳姿加權

```
weighted_MET = Σ (proportion_i × MET_i)
```

佔比總和非 100% 時自動正規化。

### 3.11 熱量估算

```javascript
kcal = MET × weightKg × (durationMinutes / 60);
```

MET 基礎之熱量計算對多數個體的準確度約 **±15–20%**，且為 **gross（總）消耗**而非 net（淨）消耗，不應作為體重管理之精確依據。

### 3.12 心率模組

```javascript
const hrMaxLand = 208 - 0.7 * age;              // Tanaka
const hrMaxSwim = hrMaxLand - 12;               // 預設；可調整 -13 至 -10
const targetHR  = hrRest + intensityPercent * (hrMax - hrRest);   // Karvonen
```

---

## 3.13 肌力訓練的計量方式與抱石歸屬（文獻查證）

以下為針對「重量訓練是否需計算 MET」「一週兩次是否足夠」「抱石如何計次」三問題之查證結果，文獻均取自 PubMed。

### 肌力訓練不以 MET 或分鐘計量

指引對肌力訓練的計量單位為 **天數 × 肌群 × 強度**，未設定 MET 或時長門檻。本工具的肌力達標判定因此完全不參照 MET；MET 僅用於熱量估算，以及讓 moderate 以上的重訓分鐘數計入有氧 MEM。大型世代研究在量化肌力訓練時，採用的單位同樣是**每週次數**而非 MET。

`Strong recommendation, Moderate certainty` — WHO 2020；US PAG 2nd ed. 2018

### 每週次數：不同結果指標給出不同答案（不予合併）

| 結果指標 | 發現 | 等級 |
|---|---|---|
| 全因死亡率 | 在已有有氧運動基礎上，肌力訓練每週 1 次即帶來額外風險下降（HR 0.89, 95% CI 0.81–0.97），最小有效劑量 1–2 次；每週 7 次時效益已不復存在（HR 0.99, 95% CI 0.94–1.04） | `GRADE: Low`（觀察性世代研究，n=416,420） |
| 肌肉肥大 | 總訓練量相等下，每肌群每週 2 次優於 1 次（ES 0.49 ± 0.08 vs 0.30 ± 0.07, P = 0.002）；3 次是否優於 2 次尚無定論 | `GRADE: Moderate`（統合分析，10 篇） |
| 肌力增長 | 效果量隨頻率上升（1/2/3/4+ 次為 0.74/0.82/0.93/1.08, P = 0.003），但**訓練量對等後頻率效果不再顯著**（P = 0.421） | `GRADE: Moderate`（統合分析，22 篇） |

三者回答的是不同問題，**本工具不對這些數值取平均或合併**。達標門檻採指引的 2 天，屬公共衛生最低標準，非訓練學最佳解；本工具只判定前者。

### 抱石／攀岩

| 面向 | 發現 | 等級 |
|---|---|---|
| 心肺需求 | 菁英抱石者模擬競賽中峰值攝氧量 35.8 ± 7.3 mL/kg/min（約跑步機最大值 75%）、峰值心率 162 ± 14 bpm（約 88%），22.9% 攀爬時間超過氣體交換閾值 | `GRADE: Low`（單一橫斷研究，n=11 菁英） |
| 肌力適應 | 攀岩訓練可提升最大握力、上肢肌力與上肢肌耐力 | `GRADE: Moderate`（系統性回顧，12 篇） |
| 肌群參與 | 攀爬時所測 12 條肩部肌群全部呈現高活化，有經驗者亦然 | `GRADE: Low`（單一實驗研究，n=30） |

峰值換算約 10 METs，遠高於 Compendium 查表值 5.8。兩者不衝突：查表值為整場（含組間休息）平均，實測為攀爬當下峰值，落差源於抱石的高度間歇性。

**實作約定（非官方分類）**：抱石對應肌群建議勾選背部、手臂、肩部、腹部，路線需大量蹬踏時加上腿部、髖部，**胸部不勾**（攀爬幾乎均為拉的動作）。計次方式為一天算一次，不論時長。WHO 2020 與 US PAG 2018 均未提供攀岩之官方肌群對應表。

---

## 4. 實作約定（對應規格第 10 節）

1. **絕對強度 vs 相對強度**：所有分級皆為 absolute MET-based。UI 於「新增紀錄」頁與免責聲明兩處說明此限制，並提示可用 talk test / RPE 覆寫校正為 relative intensity。
2. **無最小時長門檻**：2018 PAG 已取消「單次至少 10 分鐘」限制，程式未設任何最小時長門檻（見 TC-9）。
3. **conditional recommendation 不呈現為目標**：>300 MEM 標示為「額外效益」，未達 300 不顯示為「未達成」，亦不以紅色警示。
4. **無安全上限**：程式對高活動量不給出任何負面提示，UI 明示「指引未設活動量上限」。
5. **肌力與有氧不可互相折抵**：兩者獨立判定，UI 明文標示。
6. **週界處理**：跨日活動歸屬於開始日所在之週（記錄僅存開始日）。

---

## 5. CONFIG 更新指引

所有常數（MET 值、閾值、肌群清單、公式係數、GRADE 字串）集中於 `index.html` 中的**單一 `CONFIG` 物件**（位於 `CORE:START` 區塊開頭）。更新時只需修改此物件，不需更動任何邏輯或 UI 程式碼。

| CONFIG 鍵 | 內容 | 更新時機 |
|---|---|---|
| `meta` | 版本字串（app 版本、各來源之版本年份、建議查核週期） | 任何來源改版時同步更新 |
| `intensity` | `lightMin` / `moderateMin` / `vigorousMin` MET 邊界 | Compendium 或指引調整分級邊界 |
| `vigorousMultiplier` | 高強度換算倍率（現為 2） | 指引更改等效換算約定 |
| `aerobic` | `memBasic` / `memAdditional` / `vigBasic` / `vigAdditional` 與 GRADE 字串 | WHO / PAG 改版 |
| `metMinutesBand` | MET-min 參考帶 `low` / `high` | 參考帶依據更新 |
| `strength` | `minDays`、`muscleGroups`（7 組，含 id / 中文 / 英文）、GRADE 字串 | 肌群定義或天數建議調整 |
| `running` | `minValidSpeedKmh`（ACSM 跑步方程式適用下限，現為 8.0） | ACSM 指引改版 |
| `photo` | `maxDimPx` / `jpegQuality`（跑步機照片縮圖參數） | 需調整儲存空間與畫質的取捨時 |
| `ocr` | `basePath` / `thresholds` / `psmModes` / `upscale`（辨識資源路徑與投票參數） | 辨識率不佳時可增減門檻組合 |
| `hr` | Tanaka 係數、水中修正預設值與可調範圍 | 新證據出現時 |
| `subjective` | talk test / RPE 對應之預設 MET 與區間 | 校正建議更新 |
| `swimStrokes` | 12 筆游泳 Compendium 項目（code / MET / 中英文描述） | Compendium 改版 |
| `activities` | 其他活動項目（含 `kind: 'run' | 'swim'` 特殊模組標記、`strengthDefault`） | Compendium 改版或新增項目 |

新增一般活動只需在 `CONFIG.activities` 加入一筆 `{ id, name, met, group }`；`group` 會自動成為下拉選單的分組。加入 `strengthDefault: true` 可讓選取時自動勾選「計入肌力訓練」。使用者亦可直接在「設定 → 自訂活動項目」新增，不需改碼。

**時效性**：指引與 Compendium 均會改版，`CONFIG.meta` 已註記各來源版本年份，建議每 2 年重新查核（`CONFIG.meta.reviewCycleYears`）。

---

## 6. 資料格式說明

### localStorage 鍵

| 鍵 | 內容 |
|---|---|
| `wex.records.v1` | 運動紀錄陣列 |
| `wex.settings.v1` | 個人設定 |
| `wex.custom.v1` | 自訂活動項目 |

### 紀錄物件（record）

```jsonc
{
  "id": "r1755446400000ab12x",     // 唯一鍵
  "date": "2026-08-17",            // 活動開始日（YYYY-MM-DD），週界依此判定
  "activityId": "run",             // 對應 CONFIG.activities / 自訂項目之 id
  "name": "跑步（依速度動態計算 MET）",
  "met": 9.571428571428571,        // 完整精度保存，僅顯示時四捨五入
  "metSource": "formula",          // table | formula | weighted | subjective
  "minutes": 20,
  "isStrength": false,             // 是否計入肌力訓練
  "strengthModerate": true,        // 強度是否達 moderate 以上（false 則不計入覆蓋與天數）
  "muscles": [],                   // ['legs','hips','back','abdomen','chest','shoulders','arms'] 之子集
  "note": "",
  "meta": {
    "speedKmh": 9,                 // 跑步：速度
    "swimPct": { "18240": 60, "18265": 40 },   // 游泳：泳姿 code → 佔比 %
    "subjective": { "mode": "talk", "talk": "vigorous", "rpe": null }  // 主觀覆寫來源
  }
}
```

`metSource` 語意：

| 值 | 意義 |
|---|---|
| `table` | Compendium 查表值 |
| `formula` | ACSM 跑步方程式推導 |
| `weighted` | 混合泳姿線性加權 |
| `subjective` | 主觀判定（talk test / RPE）覆寫，歷史紀錄中標註為「主觀判定」 |

### 設定物件（settings）

```jsonc
{ "weightKg": 65, "age": 35, "restHR": 60, "weekStart": 1, "hrSwimOffset": -12 }
// weekStart: 1 = 週一, 0 = 週日
```

### 自訂活動（custom）

```jsonc
{ "id": "c1755446400000", "name": "壺鈴擺盪", "met": 6.5, "strength": true }
```

### 匯出格式

**JSON**（可匯入還原，會覆蓋現有資料）：

```jsonc
{
  "schema": "weekly-exercise-tracker",
  "version": "1.0.0",
  "exportedAt": "2026-08-17T00:00:00.000Z",
  "settings": { },
  "custom": [ ],
  "records": [ ]
}
```

**CSV**（含 UTF-8 BOM，Excel 可直接開啟；為衍生輸出，不支援匯入）欄位：

```
id, date, weekStart, activity, met, metSource, minutes, intensity,
mem, metMin, kcal, isStrength, strengthModerate, muscles, note
```

`muscles` 以 `|` 分隔（例：`legs|hips|back`）。

---

## 7. 驗收測試結果（第 11 節逐項對照）

測試套件實作於 `index.html` 之 `runSelfTests()`（`CORE:START` / `CORE:END` 區塊內，無 DOM 依賴）。

**執行方式（二擇一）**：

- **App 內**：開啟 `index.html` → 設定 → 「執行自我測試」，結果以表格呈現
- **Node**：抽出 `CORE` 區塊後呼叫 `runSelfTests()`（無需任何相依套件）

**執行結果：13 / 13 通過**（於 Node 22 與 Chromium 兩種環境執行，結果一致）

| 案例 | 說明 | 期望值 | 實際執行結果 | 判定 |
|---|---|---|---|---|
| **TC-1** | 跑步 MET 計算（9 km/hr，20 分鐘） | MET = 9.57、Vigorous、MEM = 40、MET-min = 191.4 | MET = **9.57**、**vigorous**、MEM = **40**、MET-min = **191.4** | ✅ PASS |
| **TC-2** | 跑步達標判定（9 km/hr × 20 分 × 4 次） | MEM = 160 → 基本達標；MET-min ≈ 766 | MEM = **160**、**基本達標**、MET-min = **766** | ✅ PASS |
| **TC-3** | 游泳混合泳姿加權（40 分，自由式 60% + 蛙式 40%） | 加權 MET = 5.60、Moderate、MEM = 40、MET-min = 224 | 加權 MET = **5.60**、**moderate**、MEM = **40**、MET-min = **224** | ✅ PASS |
| **TC-4** | 綜合計算（TC-2 + TC-3） | MEM = 200（基本達標）；MET-min ≈ 990（落在 500–1000 參考帶內） | MEM = **200**、**基本達標**、MET-min = **990**（參考帶內：**是**） | ✅ PASS |
| **TC-5** | 燈號邏輯（TC-4 有氧紀錄 + 肌力 0 天） | 🟡 黃燈（不得為綠燈） | **🟡 僅其中一項達標**（有氧：達標、肌力：未達標） | ✅ PASS |
| **TC-6** | MET 分級邊界 | 5.9 → Moderate；6.0 → Vigorous | 5.9 → **moderate**；6.0 → **vigorous** | ✅ PASS |
| **TC-7** | MEM 閾值邊界 | 149 → 未達標；150 → 基本達標；300 → 基本達標；301 → 額外效益 | **未達標 / 基本達標 / 基本達標 / 額外效益** | ✅ PASS |
| **TC-8** | 肌群覆蓋（週一腿髖背、週四胸肩臂） | 天數達標（2 天）但腹部未覆蓋 → 肌力未達標，UI 標示缺漏肌群 | 天數 = **2**（達標）、缺漏肌群 = **腹部** → 肌力**未達標**；儀表板 7 格覆蓋圖中腹部呈灰階，並顯示「缺漏肌群：腹部（訓練天數已達標）」 | ✅ PASS |
| **TC-9** | 短時長活動（快走 6.4 km/hr，MET 5.0，7 分鐘） | 正常計入，MEM 貢獻 = 7（不得因 <10 分鐘而排除） | MEM 貢獻 = **7**（moderate，MET-min = 35） | ✅ PASS |
| **TC-13** | OCR 候選值投票與格式把關 | 距離 → 2.8（2 票）；時間 → 17:12（2 票）；全為雜訊 → null；跨格式與非法值一律拒絕 | 距離 → **2.8**（2/5 票）；時間 → **17:12**（2/4 票）；雜訊 → **null**；把關**通過** | ✅ PASS |
| **TC-12** | 跑步機讀數換算（實際畫面 2.8 km / 17:12） | 時間 17.2 分、速度 9.77 km/hr、MET 10.30、Vigorous、MEM 34.4、MET-min 177.2；時間格式 mm:ss／h:mm:ss／純分鐘／無效字串皆正確處理 | 時間 **17.2** 分、速度 **9.77** km/hr、MET **10.30**、**vigorous**、MEM **34.4**、MET-min **177.2**（70 kg 估計 **207 kcal**，跑步機自身顯示 **206 kcal**） | ✅ PASS |
| **TC-11** | 達標軌跡統計（進行中當週不計入連續） | 4 週序列、雙軌達標 3 週、目前連續 3、最長連續 3；若不排除進行中當週則連續為 0 | **4 週 / 雙軌達標 3 週 / 目前連續 3 / 最長連續 3**；不排除時連續 = **0** | ✅ PASS |
| **TC-10** | 跑步速度適用範圍（ACSM 方程式下限 8 km/hr） | 9 → 適用；8.0 → 適用（邊界含）；7.9 → 警示；5 → 警示 | 9 → **適用**；8.0 → **適用**；7.9 → **警示**；5 → **警示**（5 km/hr 誤用跑步公式得 MET **5.76**，高於快走 5.6 km/hr 查表值 4.3） | ✅ PASS |

### 補充驗證（Chromium 端對端）

於 Chromium（行動 390×844 淺色 / 桌機 1024×900 深色）實際操作驗證：

- 無 console error、無 pageerror、無水平捲動溢出
- 新增跑步紀錄（9 km/hr、20 分）→ 即時預覽顯示 MET 9.57、Vigorous、MEM 40、MET-min 191.4，與 TC-1 一致
- 依 TC-8 情境新增兩筆肌力紀錄 → 儀表板顯示「2 天 / 未達標」，7 格覆蓋圖中僅腹部呈灰階（未覆蓋數 = 1）
- 歷史頁趨勢圖正常繪出 SVG

### 其他數值驗證

```
runningMET(9)                = 9.571428571428571
Tanaka HRmax(35 歲)          = 183.5 bpm；水中（−12）= 171.5 bpm
Karvonen(rest 60, 60% HRR)   = 134.1 bpm
週界 2026-08-17（週一起始）   = 2026-08-17；（週日起始）= 2026-08-16
```

---

## 8. 來源

**建議量來源**

- WHO. *Guidelines on Physical Activity and Sedentary Behaviour.* Geneva: World Health Organization; 2020.
- U.S. Department of Health and Human Services. *Physical Activity Guidelines for Americans*, 2nd edition. 2018.

**MET 值來源**

- 2024 Adult Compendium of Physical Activities (ages 19–59), Arizona State University.

**MET 約定之效度**（取自 PubMed，附原始文章 DOI）

- Cunha FA, Midgley AW, Montenegro R, Oliveira RB, Farinatti PTV. Metabolic equivalent concept in apparently healthy men: a re-examination of the standard oxygen uptake value of 3.5 mL·kg⁻¹·min⁻¹. *Appl Physiol Nutr Metab.* 2013;38(11):1115-9. [DOI: 10.1139/apnm-2012-0492](https://doi.org/10.1139/apnm-2012-0492)

- Byrne NM, Hills AP, Hunter GR, Weinsier RL, Schutz Y. Metabolic equivalent: one size does not fit all. *J Appl Physiol.* 2005;99(3):1112-9. [DOI: 10.1152/japplphysiol.00023.2004](https://doi.org/10.1152/japplphysiol.00023.2004)
- McMurray RG, Soares J, Caspersen CJ, McCurdy T. Examining variations of resting metabolic rate of adults: a public health perspective. *Med Sci Sports Exerc.* 2014;46(7):1352-8. [DOI: 10.1249/MSS.0000000000000232](https://doi.org/10.1249/MSS.0000000000000232)
- Kwan M, Woo J, Kwok T. The standard oxygen consumption value equivalent to one metabolic equivalent (3.5 ml/min/kg) is not appropriate for elderly people. *Int J Food Sci Nutr.* 2004;55(3):179-82. [DOI: 10.1080/09637480410001725201](https://doi.org/10.1080/09637480410001725201)

**心率公式之準確度**

- Nes BM, Janszky I, Wisløff U, Støylen A, Karlsen T. Age-predicted maximal heart rate in healthy subjects: The HUNT fitness study. *Scand J Med Sci Sports.* 2013;23(6):697-704. [DOI: 10.1111/j.1600-0838.2012.01445.x](https://doi.org/10.1111/j.1600-0838.2012.01445.x)
- Martin J, Lindsey B, Gerrity C, Ambegaonkar J. Exploratory analysis of the accuracy of age-based maximal heart rate equations across cardiorespiratory fitness levels. *PLoS One.* 2025;20(10):e0335842. [DOI: 10.1371/journal.pone.0335842](https://doi.org/10.1371/journal.pone.0335842)

**有氧與肌力不可折抵之證據**

- López-Bueno R, Ahmadi M, Stamatakis E, Yang L, Del Pozo Cruz B. Prospective Associations of Different Combinations of Aerobic and Muscle-Strengthening Activity With All-Cause, Cardiovascular, and Cancer Mortality. *JAMA Intern Med.* 2023;183(9):982-990. [DOI: 10.1001/jamainternmed.2023.3093](https://doi.org/10.1001/jamainternmed.2023.3093)
- Tarasenko YN, Linder DF, Miller EA. Muscle-strengthening and aerobic activities and mortality among 3+ year cancer survivors in the U.S. *Cancer Causes Control.* 2018;29(4-5):475-484. [DOI: 10.1007/s10552-018-1017-0](https://doi.org/10.1007/s10552-018-1017-0)

**肌力訓練計量與抱石歸屬之文獻**（取自 PubMed，附原始文章 DOI）

- Coleman CJ, McDonough DJ, Pope ZC, Pope CA. Dose-response association of aerobic and muscle-strengthening physical activity with mortality: a national cohort study of 416 420 US adults. *Br J Sports Med.* 2022. [DOI: 10.1136/bjsports-2022-105519](https://doi.org/10.1136/bjsports-2022-105519)
- Schoenfeld BJ, Ogborn D, Krieger JW. Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis. *Sports Med.* 2016;46(11):1689-1697. [DOI: 10.1007/s40279-016-0543-8](https://doi.org/10.1007/s40279-016-0543-8)
- Grgic J, Schoenfeld BJ, Davies TB, Lazinica B, Krieger JW, Pedisic Z. Effect of Resistance Training Frequency on Gains in Muscular Strength: A Systematic Review and Meta-Analysis. *Sports Med.* 2018;48(5):1207-1220. [DOI: 10.1007/s40279-018-0872-x](https://doi.org/10.1007/s40279-018-0872-x)
- Callender NA, Hayes TN, Tiller NB. Cardiorespiratory demands of competitive rock climbing. *Appl Physiol Nutr Metab.* 2021;46(2):161-168. [DOI: 10.1139/apnm-2020-0566](https://doi.org/10.1139/apnm-2020-0566)
- Langer K, Simon C, Wiemeyer J. Strength Training in Climbing: A Systematic Review. *J Strength Cond Res.* 2023;37(3):751-767. [DOI: 10.1519/JSC.0000000000004286](https://doi.org/10.1519/JSC.0000000000004286)
- MacLean KFE, Dickerson CR. Kinematic and EMG analysis of horizontal bimanual climbing in humans. *J Biomech.* 2019;92:11-18. [DOI: 10.1016/j.jbiomech.2019.05.023](https://doi.org/10.1016/j.jbiomech.2019.05.023)

**公式來源**

- ACSM's Guidelines for Exercise Testing and Prescription（跑步代謝方程式）
- Tanaka H, et al. *J Am Coll Cardiol.* 2001（HRmax 公式）
- DiCarlo LJ, Sparling PB, Millard-Stafford ML, Rupp JC. Peak heart rates during maximal running and swimming: implications for exercise prescription. *Int J Sports Med.* 1991;12(3):309-12（水中心率修正，`GRADE: Low`，單一橫斷性研究 n=34）

---

## 9. 免責聲明

> 本工具提供之數值為族群平均之估算，個體實際能量消耗差異可達 ±20% 以上。MET 為 absolute intensity 指標，未反映個人心肺適能所決定的 relative intensity；心肺適能良好者的實際相對強度可能低於分類值。本工具不構成醫療建議。若有心血管疾病史、慢性病或特殊健康考量，運動處方應由具運動醫學專業之醫師個別評估。

---

## 10. 已知證據缺口與限制

- **混合泳姿之 MET 值**：provided sources 未提供官方加權方法。本工具採線性加權為**實作約定**，非實證結論。
- **技術水準對游泳 MET 之量化修正係數**：provided sources 未提供可套用之公式。本工具僅以文字警語提示，未做數值修正。
- **水中心率修正之最佳數值**：不同來源給出 −10 至 −15 bpm 之範圍，且菁英族群差距更小（約 −6.7 bpm）。**本工具不對這些數值取平均**，預設採 −12 bpm 並開放使用者調整，同時於說明中並列各來源數值。
- **報酬遞減之轉折點**：WHO 指出風險下降在超過每週 300 分鐘後趨於平緩，但**目前證據不足以指出確切轉折點**。本工具不對 >300 MEM 做任何效益外推。
- **`1 MET = 3.5 mL/kg/min` 的約定**：此值源自單一受試者（70 kg、40 歲男性），已知系統性高估實際靜息代謝率，但**高估幅度因族群而異且差距很大**：異質樣本（n=769，18–74 歲含肥胖者）實測 2.6 ± 0.4 mL/kg/min（高估約 35%），同質樣本（n=125，17–38 歲健康男性）實測 3.21 mL/kg/min（高估約 9%）。統合分析顯示以熱量計男性高估約 10%、女性約 15%，特定族群可達 20–30%。**本工具不對這些數值取平均**。provided sources 未提供可直接套用的個人化校正係數，本工具**不對此做數值修正**，僅於熱量估算標示誤差範圍。達標判定不受影響，因指引門檻與本工具計算採同一套約定，偏誤同向抵消。
- **抱石的官方肌群對應**：provided sources 未提供攀岩對應哪些主要肌群的官方分類。本工具的建議勾選組合依肌力適應與 EMG 研究推得，屬實作約定，非指引結論。
- **休閒抱石者的 MET**：provided sources 未提供休閒程度抱石者的實測 MET。現有實測為菁英選手在競賽情境下的峰值，不宜直接套用於一般愛好者。
- **肌力訓練的最佳劑量**：provided sources 未提供以健康結果（而非肌力／肥大）為終點的最佳組數與反覆次數。指引本身亦未規定組數、次數或時長。
- **頻率與訓練量的拆分**：現有統合分析多以未訓練者為受試對象，已有訓練經驗者的證據仍不足。
- **年齡推估 HRmax 的個人準確度**：現有公式（含 Tanaka）平均偏誤雖小（−3 至 +6 bpm），但一致性界限寬達約 ±18–24 bpm，無任何公式具備高度個人層級準確度。不同大型研究給出的公式亦不相同（Tanaka `208 − 0.7×年齡` vs HUNT `211 − 0.64×年齡`，40 歲時差 5 bpm）。**本工具不對這些公式取平均**，採用 Tanaka 並於說明中並列各來源數值。provided sources 未提供可靠的個人化校正方法。
- **時效性**：指引與 Compendium 均會改版。CONFIG 中所有常數須註記版本年份，建議每 2 年重新查核。
- **個別化**：本工具為一般性計算，不取代個別臨床評估。

### 游泳 MET 估算之限制（App 內強制顯示）

> 游泳的能量成本高度依賴技術（swimming economy）。同樣速度下，技術差異可造成代謝成本相差 2–3 倍。「主觀感覺輕鬆」不等於低 MET。Compendium 分類（recreational / training）對游泳的效度低於跑步與步行。建議以 talk test 或 RPE 校正。
