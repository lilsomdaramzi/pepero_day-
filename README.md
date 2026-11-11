# 빼빼로 배달 (Special Delivery)

링크: https://lilsomdaramzi.github.io/pepero_day-/

흐름: START(이어폰 안내) → 토론토 밤 고속도로 드라이브 15초 → 선물상자 → 1차 흔들기(초코 + 몬스터 눈) → 2차 흔들기(사진·스티커 비) → 한글 편지 → 이미지 저장·공유

1. `config.js`에서 이름·편지·컨셉·사진 수정
2. 실행: `python3 -m http.server 8000` → `http://localhost:8000/`
3. 배포: 폴더째 Netlify Drop 등에 올리고 링크 보내기 (링크 아는 사람은 사진을 볼 수 있음)

- `index.html`을 파일로 직접 열면 이미지 저장이 막혀요. 서버 주소로 열어주세요.
- 흔들기가 안 되는 기기에서는 화면을 탭하면 진행돼요.
- 배포 전에 `preview/` 폴더는 지워주세요.
