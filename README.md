# API Designer Pro

<div align="center">

**A modern, production-ready visual API architecture studio**  
طراحی بصری API در سطح حرفه‌ای برای تیم‌های بک‌اند

[![Live Demo](https://img.shields.io/badge/Live%20Demo-API%20Designer%20Pro-22c55e?style=for-the-badge)](https://mehranmr17.github.io/ApiDesigner/)
[![Frontend Only](https://img.shields.io/badge/100%25-Static%20Frontend-0ea5e9?style=for-the-badge)](#english)
[![License](https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge)](#license)

### 🌐 Live Access | دسترسی آنلاین
## **https://mehranmr17.github.io/ApiDesigner/**

</div>

---

## Language / زبان

- [🇺🇸 English](#english)
- [🇮🇷 فارسی](#فارسی)

---

## English

### Overview
API Designer Pro is a visual tool for backend engineers and software architects to:
- model API endpoints as interactive diagram nodes,
- define input/output/error JSON structures,
- manage status-aware flows between components,
- maintain multiple saved projects,
- export OpenAPI/JSON/SVG artifacts.

### Key Features
- Node types: Endpoint / Input / Output / Error
- Arrow flows with editable labels and status codes
- Right-side property inspector
- JSON field modeling (`name`, `type`, `required`)
- Default error schema:
  - `errorCode: string`
  - `message: string`
  - `metadata?: object`
- Multi-project workflow (create / rename / switch)
- Import/Export project JSON
- Export OpenAPI JSON
- Export SVG
- Keyboard shortcuts (`N`, `I`, `O`, `E`, `Delete`, `Ctrl/Cmd+S`)

### Tech Stack
- React + TypeScript + Vite
- Zustand (persist)
- React Flow
- TailwindCSS
- Framer Motion

### Static Deployment
This app is fully static:
- no backend
- no database
- no auth
- no env variables required

GitHub Pages compatibility:
- `HashRouter`
- Vite `base: './'`

### Local Setup
```bash
git clone https://github.com/MehranMr17/ApiDesigner.git
cd ApiDesigner
npm install
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

---

## فارسی

### معرفی
API Designer Pro یک ابزار بصری برای مهندسان بک‌اند و معماران نرم‌افزار است تا بتوانند:
- اندپوینت‌های API را به‌صورت دیاگرام طراحی کنند،
- ساختار JSON برای ورودی/خروجی/خطا تعریف کنند،
- جریان داده و status codeها را مدیریت کنند،
- چند پروژه را هم‌زمان نگه‌داری و جابه‌جا کنند،
- خروجی OpenAPI/JSON/SVG بگیرند.

### امکانات اصلی
- انواع نود: Endpoint / Input / Output / Error
- اتصال‌های فلش‌دار با label و status code قابل ویرایش
- پنل تنظیمات سمت راست
- مدل‌سازی فیلدهای JSON (`name`، `type`، `required`)
- ساختار پیش‌فرض خطا:
  - `errorCode: string`
  - `message: string`
  - `metadata?: object`
- مدیریت چند پروژه (ایجاد / تغییر نام / سوییچ)
- ورود/خروج پروژه با JSON
- خروجی OpenAPI JSON
- خروجی SVG
- کلیدهای میانبر (`N`, `I`, `O`, `E`, `Delete`, `Ctrl/Cmd+S`)

### تکنولوژی‌ها
- React + TypeScript + Vite
- Zustand (به‌همراه persist)
- React Flow
- TailwindCSS
- Framer Motion

### انتشار استاتیک
این پروژه کاملاً فرانت‌اند و استاتیک است:
- بدون بک‌اند
- بدون دیتابیس
- بدون احراز هویت
- بدون نیاز به env

سازگار با GitHub Pages با:
- `HashRouter`
- Vite `base: './'`

### اجرای محلی
```bash
git clone https://github.com/MehranMr17/ApiDesigner.git
cd ApiDesigner
npm install
npm run dev
```

### بیلد
```bash
npm run build
npm run preview
```

---

## Links
- Live Project: https://mehranmr17.github.io/ApiDesigner/
- Repository: https://github.com/MehranMr17/ApiDesigner

## License
MIT
