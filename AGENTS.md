<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 아이콘

`icons/` 안의 파일을 직접 만들거나 수정하지 않는다. 소스 이미지 하나(`icon.png`)를
교체하고 스크립트를 돌려 전체 세트를 다시 뽑는다.

```bash
pip install pillow numpy                  # 최초 1회
python tools/generate-icons.py            # icon.png 사용
python tools/generate-icons.py other.webp # 다른 소스 지정
```

소스는 정사각형 512x512 이상을 권장한다. 정사각형이 아니면 여백을 정리한 뒤
자동으로 정사각 변환한다.

## 판형이 나뉘는 이유

플랫폼마다 아이콘에 요구하는 형태가 다르다. 스크립트가 알아서 처리하므로 손댈
필요는 없지만, 값을 바꾸려면 이유를 알고 바꿔야 한다.

| 출력 | 판형 | 이유 |
| --- | --- | --- |
| `favicon-16/32`, `icon-48` | 둥근 모서리 + 투명 | 브라우저 탭에 어울리는 형태 |
| `apple-touch-icon-180`, `icon-192/512` | 풀블리드 + 불투명 | iOS·Android가 자체 마스크를 씌운다. 미리 둥글리면 이중 마스킹이 되고, iOS는 투명 코너를 **검게** 칠한다 |
| `icon-maskable-512` | 안전영역(중앙 80%) 안으로 축소 | Android가 원/스퀘어클로 잘라낸다 |

16px는 디테일이 뭉개지는 크기다. 원본이 복잡하면(작은 글자, 촘촘한 무늬) 그
크기만 단순화한 별도 판을 쓰는 편이 낫다.

## 소스 이미지 주의

**PNG를 쓸 것.** JPEG는 투명도를 지원하지 않아서, 투명 배경 PNG를 JPEG로 변환하면
투명했던 영역이 **검게 구워진다**. 스크립트는 그 검정을 원래 디자인으로 볼 수밖에
없어 아이콘에 그대로 남는다. 코너가 검게 나온다면 스크립트가 아니라 소스 이미지를
의심할 것. JPEG를 쓴다면 원래부터 배경이 꽉 찬 이미지여야 한다.

## 연결

> **이 프로젝트(Next.js App Router)는 원본(k-radio)과 달리 `index.html`/`manifest.json`이
> 루트에 없다.** 이 스크립트로 `icons/`에 파일을 생성한 뒤, App Router 방식으로 직접
> 연결해야 한다 — 예: `app/icon.png`·`app/apple-icon.png`(파일 기반 메타데이터) 또는
> `app/layout.tsx`의 `metadata.icons` / `public/manifest.json` + `<link>` 조합. 아직
> 아무 것도 연결되어 있지 않으니, 실제로 아이콘을 적용할 때 이 부분을 새로 구성할 것.

원본 프로젝트 기준 참고 내용:

- `<link rel="icon">` — 파비콘
- `<link rel="apple-touch-icon" sizes="180x180">` — iOS 홈 화면. **실제 PNG 파일**
  이어야 하며 SVG data URI로는 동작하지 않는다
- `manifest.json` → `icons` — `purpose: "any"`와 `"maskable"`을 함께 선언한다

## 확인

```bash
# 매니페스트 선언 크기와 실제 PNG 크기가 일치하는지,
# apple-touch-icon이 180x180 불투명 PNG인지
python - <<'PY'
import json
from PIL import Image
m = json.loads(open("manifest.json", "rb").read().decode("utf-8"))
for ic in m["icons"]:
    im = Image.open(ic["src"])
    print(ic["src"], im.size, im.mode,
          "OK" if f"{im.size[0]}x{im.size[1]}" == ic["sizes"] else "MISMATCH")
at = Image.open("icons/apple-touch-icon-180.png")
print("apple-touch:", at.size == (180, 180), at.format == "PNG", at.mode == "RGB")
PY
```

```bash
# 배포된 경로가 실제로 열리는지 (BASE를 배포 주소로)
BASE=https://example.com
for p in manifest.json icons/apple-touch-icon-180.png icons/icon-192.png \
         icons/icon-512.png icons/icon-maskable-512.png; do
  printf "%-40s " "/$p"
  curl -sI "$BASE/$p" | head -1
done
```

PWA 설치와 아이콘 확인은 HTTPS(또는 localhost)에서만 정상 동작한다. `file://`로
열면 매니페스트가 무시된다.

**iOS 아이콘 캐시**: 아이폰은 홈 화면 아이콘을 강하게 캐시한다. 새 아이콘을
확인하려면 기존 홈 화면 아이콘을 삭제하고 사이트를 다시 추가해야 한다.
