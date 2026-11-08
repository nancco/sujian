# 素笺 SuJian

[English](#english) | [简体中文](#简体中文)
---

👉 **[在线预览 / Live Demo](https://nancco.github.io/sujian/)** 👈
*(For foreign users accessing the webpage, please click on "EN" to switch to English)*

---

## English

![Screenshot](https://cdn.jsdelivr.net/gh/nancco/sujian@main/English.png)

A minimalist, pure frontend, single-file plain text diary & memo. 
All data is saved locally in your browser's `localStorage`. No backend, no cloud, no tracking.

### ✨ Features
- **Pure Local**: Single HTML file. Data saves to `localStorage` automatically. Works offline.
- **Linkify**: Auto-detects `http://`, `https://`, or `www.` URLs and converts them into clickable blue links in preview mode.
- **Image Preview**: Zero local storage for images. Just paste a direct image URL, and it renders as an `<img>` tag in Preview mode.
- **Export & Import**: Export TXT, DOC (HTML disguised as Word, keeps links), and JSON backup. JSON import uses `id` + `updatedAt` to merge data safely without overwriting.
- **Sneakernet Ready**: Move data between devices using JSON files (via WeChat, AirDrop, etc.) instead of cloud sync.

### 🚀 How to Use
1. **Run**: Download and open `index.html`, or host it on GitHub Pages.
2. **Insert Links**: Click `+ Insert Link` in the sidebar. Upload your image/file to a third-party host (like postimages), copy the direct URL, and paste it into the editor.
3. **Data Transfer**: Click `Backup JSON`, send the file to your other device, and click `Import JSON`.

### ⚠️ Disclaimer
- **Data Loss**: Clearing browser cache will wipe local data. **Please backup to JSON regularly.**
- **Third-party**: Image/file links are hosted externally. They may expire, throttle, or fail. Always keep originals in your local gallery.
- **Privacy**: Do NOT upload sensitive info (IDs, passwords) to public image hosts. This tool is plaintext and does not provide encryption.

---

## 简体中文

![Screenshot](https://cdn.jsdelivr.net/gh/nancco/sujian@main/Chinese.png)

一个极简的纯前端单文件纯文本日记本 / 备忘录。
所有数据保存在浏览器的 `localStorage` 中。无后端、无云同步、不收集任何数据。

### ✨ 核心特性
- **纯本地运行**：单文件 HTML，自动保存，断网可用。
- **链接自动识别**：输入网址，在预览模式下自动变蓝并可点击。
- **图片外链预览**：本地坚决不存图片本体。粘贴图片直链，预览时自动渲染为图片，不占本地空间。
- **多格式导出**：单篇导出 TXT、DOC（保留超链接），全量 JSON 备份。
- **安全合并导入**：导入 JSON 时按更新时间合并去重，不覆盖现有笔记。
- **极客搬运**：拒绝云端，跨设备靠导出 JSON 文件 + 微信/AirDrop 物理搬运。

### 🚀 使用方法
1. **直接运行**：双击打开 `index.html` 即可，或部署到 GitHub Pages。
2. **插入图片/文件**：本工具不碰文件本体。点击左下角 `＋ 插入链接` 跳转第三方图床/网盘，上传后复制链接粘进来即可。
3. **跨设备搬运**：导出 JSON 发给另一台设备，导入即可（数据合并，安全防丢）。

### ⚠️ 免责声明
- **数据安全**：清理浏览器缓存会导致数据丢失，**请养成备份 JSON 的习惯**。
- **第三方链接**：图床/网盘可能随时失效或限速，重要照片和文件**务必在本地留底**。
- **隐私**：请勿将私密照、密码等信息上传至公开图床。本工具不提供加密，纯明文本地存储。

---

> **Tech Stack**: Vanilla HTML / CSS / JavaScript. Single-file architecture. No dependencies.
> Built for minimalists who value data sovereignty.
