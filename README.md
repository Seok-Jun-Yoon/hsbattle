# 카드 추가 및 GitHub Pages 반영 방법

이 프로젝트는 `deck`, `trinket` 폴더를 기준으로 데이터를 만들고, `docs` 폴더를 GitHub Pages 배포용으로 사용합니다.

## 카드 추가

1. 덱은 `deck/<티어>/<덱 이름>/`에, 장신구는 `trinket/<티어>/<장신구 이름>/`에 폴더를 만듭니다.
2. 핵심 카드는 `1.png`, `2.png`, `3.png`처럼 숫자 파일명으로 넣습니다.
3. 빌드 이미지는 필요하면 `build/` 폴더를 만들고 그 안에 `.png` 파일로 넣습니다.
4. 최종덱 이미지는 필요하면 폴더 안에 `최종덱.png` 이름으로 넣습니다.
5. 장신구 대표 이미지는 장신구 폴더 안에 `trinket.png` 이름으로 넣습니다.
6. 종족 필터는 `A.txt`에 `해적, 야수`처럼 쉼표로 구분해서 적습니다.
7. 공략은 필요하면 `공략.txt`에 적습니다.

## Pages 배포

카드를 추가하거나 이미지를 수정한 뒤 아래 명령만 순서대로 실행하면 `docs`에 GitHub Pages용 파일이 갱신됩니다.

```powershell
cd C:\Users\great\Desktop\hsb
.\prepare_pages.ps1
cd .\docs
git add .
git commit -m "Update cards"
git push
```

`prepare_pages.ps1`은 `deck-data.json`, `deck-data.js`를 다시 만들고 웹 파일, 카드 이미지, 커서 이미지까지 `docs`에 복사합니다.
