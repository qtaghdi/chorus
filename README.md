# 🎵 CHORUS

> **Vinyl Your Vibe.**
> 당신의 음악 취향을 3D 바이닐 카드로 기록하고 공유하세요.

![Svelte](https://img.shields.io/badge/Svelte-5.0-orange?style=for-the-badge&logo=svelte)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Threlte](https://img.shields.io/badge/Threlte-7.0-black?style=for-the-badge)

**Chorus**는 사용자가 좋아하는 노래를 검색하여, **회전하는 3D LP판(Vinyl)**이 담긴 감성적인 카드로 만들어주는 웹 애플리케이션입니다. 생성된 카드는 인스타그램 스토리 규격(9:16)에 최적화되어 있으며, 고화질 이미지로 다운로드할 수 있습니다.

---

## ✨ Key Features

* **Music Search**: 별도의 로그인 없이 Apple iTunes API를 활용해 전 세계 모든 음원을 검색합니다.
* **3D Interactive Vinyl**: **Threlte(Three.js)**를 사용하여 실제처럼 회전하고 빛을 반사하는 3D LP판을 렌더링합니다.
* **Glassmorphism UI**: 오로라 배경과 다크 글래스모피즘(Dark Glassmorphism) 디자인으로 트렌디한 사용자 경험을 제공합니다.
* **High-Quality Capture**: WebGL 캔버스(3D)를 포함한 화면 전체를 고해상도 PNG 이미지로 저장합니다.
* **Mobile First**: 모바일 환경(iOS/Android)에서의 터치 인터랙션과 뷰포트(DVH)에 완벽하게 대응합니다.

---

## Tech Stack

### Core
* **Framework**: [SvelteKit](https://kit.svelte.dev/) (Svelte 5 Runes)
* **Language**: TypeScript
* **Styling**: Tailwind CSS

### 3D & Graphics
* **3D Engine**: [Threlte](https://threlte.xyz/) (Three.js wrapper for Svelte)
* **Capture**: html-to-image

### Network
* **Data Fetching**: [Ky](https://github.com/sindresorhus/ky) (Lightweight fetch wrapper)
* **API**: Apple iTunes Search API (No Auth required)

---

## Getting Started

이 프로젝트는 **pnpm**을 패키지 매니저로 사용합니다.

### 1. Clone & Install
```bash
git clone [https://github.com/your-username/chorus.git](https://github.com/your-username/chorus.git)
cd chorus
pnpm install
```

### 2. Run Development Server
```bash
pnpm build
```

<br />

## Notes for Developers

* **Node.js Version**: Node 20 이상을 권장합니다.
* **Case Sensitivity**: Vercel(Linux 환경) 배포 시 파일명 대소문자를 엄격하게 구분합니다. 컴포넌트 파일명은 반드시 `PascalCase`를 유지해주세요. (예: `Search.svelte`)
* **Haptics**: 햅틱 피드백 기능은 `navigator.vibrate`를 지원하는 모바일 기기(주로 Android)에서만 작동합니다.

---
## License

This project is open source and available under the [MIT License](LICENSE.md).