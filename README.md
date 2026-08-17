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
- 技術實作：vanilla JS，單一 `index.html`（HTML + CSS + JS 全內嵌），趨勢圖以純 SVG 繪製，未引入任何函式庫

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
  - **游泳** → 12 種泳姿佔比輸入的混合泳姿加權計算器 + 強制顯示的技術經濟性警語（可摺疊）
  - **肌力** → 7 大肌群多選 + 「強度 moderate 以上」勾選
- **主觀強度覆寫**：talk test / RPE Borg 6–20 / RPE CR10；覆寫後之紀錄標註來源為「主觀判定」
- 即時顯示本次計算之 MET、強度分級、MEM 貢獻、MET-min、估計熱量

### ③ 歷史紀錄

- 依週分組列表，可編輯／刪除
- 近 12 週趨勢圖（MEM 柱狀走左軸、MET-min 折線走右軸，虛線為 150 / 300 MEM），純 SVG 繪製

### ④ 設定

- 體重、年齡、靜息心率、週起始日（預設週一）
- 心率模組（選用，**預設摺疊**）：Tanaka HRmax、水中修正、Karvonen 目標心率
- 自訂活動項目管理（名稱 + MET 值，存入 localStorage）
- 資料匯出（JSON / CSV）、匯入（JSON）、清除
- 驗收測試（TC-1 ~ TC-9）一鍵執行
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

### 3.8 游泳混合泳姿加權

```
weighted_MET = Σ (proportion_i × MET_i)
```

佔比總和非 100% 時自動正規化。

### 3.9 熱量估算

```javascript
kcal = MET × weightKg × (durationMinutes / 60);
```

MET 基礎之熱量計算對多數個體的準確度約 **±15–20%**，且為 **gross（總）消耗**而非 net（淨）消耗，不應作為體重管理之精確依據。

### 3.10 心率模組

```javascript
const hrMaxLand = 208 - 0.7 * age;              // Tanaka
const hrMaxSwim = hrMaxLand - 12;               // 預設；可調整 -13 至 -10
const targetHR  = hrRest + intensityPercent * (hrMax - hrRest);   // Karvonen
```

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

**執行結果：9 / 9 通過**（於 Node 22 與 Chromium 兩種環境執行，結果一致）

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
- **時效性**：指引與 Compendium 均會改版。CONFIG 中所有常數須註記版本年份，建議每 2 年重新查核。
- **個別化**：本工具為一般性計算，不取代個別臨床評估。

### 游泳 MET 估算之限制（App 內強制顯示）

> 游泳的能量成本高度依賴技術（swimming economy）。同樣速度下，技術差異可造成代謝成本相差 2–3 倍。「主觀感覺輕鬆」不等於低 MET。Compendium 分類（recreational / training）對游泳的效度低於跑步與步行。建議以 talk test 或 RPE 校正。
