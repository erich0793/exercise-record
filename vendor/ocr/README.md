# OCR 資源（第三方）

跑步機數字辨識所需的 Tesseract 資源，自行託管以避免呼叫外部 CDN 或 API。

| 檔案 | 來源 |
|---|---|
| `tesseract.min.js`, `worker.min.js` | [tesseract.js](https://github.com/naptha/tesseract.js) v5（Apache-2.0） |
| `tesseract-core-*.js`, `tesseract-core-*.wasm.js` | [tesseract.js-core](https://github.com/naptha/tesseract.js-core)（Apache-2.0） |
| `eng.traineddata` | [tessdata](https://github.com/tesseract-ocr/tessdata)（Apache-2.0），4.0.0 best_int，已解壓縮 |

`eng.traineddata` 刻意以未壓縮形式存放：若使用 `.gz` 版本，靜態主機可能加上 `Content-Encoding: gzip` 而導致重複解壓縮失敗。

這些檔案僅在使用者主動按下「自動辨識數字」時才載入（首次約 8.9 MB，之後由瀏覽器快取）。`index.html` 單獨存在時其餘功能完全正常。
