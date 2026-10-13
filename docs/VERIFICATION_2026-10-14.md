# 선택 영역 경계 / Output Duration 검증 — 2026-10-14

로컬 수정, 미커밋·미배포. 기본 HEAD 6d3a313.

## 수정
- Pitch read rate에 맞춰 grain을 선택 영역에 들어가는 길이로 제한. cubic 주변 샘플도 선택 영역 내부 값으로 제한.
- 최소 16 출력 샘플보다 영역 경계 보존이 우선. 빈 선택은 무음. 고음 Pitch + 작은 영역에서는 grain이 전보다 짧아질 수 있다.
- Output Duration Short/Long 제거, 0–600초 단일 슬라이더, 1초 단위, 기본 20초 유지. 0초 Play/Download 차단. 길이 변경 시 정지/커서0.
- 기존 file-replacement 테스트에 누락돼 있던 AIFF importer와 AudioContext/sampleRate, Blob slice fixture를 추가. 제품 파일교체 로직 변경 없음.

## 자동 검증
- `tests/source-window-boundary.mjs`: 입력44.1/48/96k × Preview44.1/48/96k × Pitch−24/0/+12/+24 × 선택영역4종(파일시작/중간/끝/1sample), 144개 조합. 선택영역 안은 동일하고 밖만 다른 두 입력의 Preview PCM 및 48k WAV 동일. Render 출력률은 모든 조합에서48k로 고정.
- 유효 신호가 있는 선택 영역은 비무음, 8ch/48k/24bit/1초 WAV 규격 및 source 불변 확인. 빈 선택은 유한 무음. 0초 Render 거부.
- `tests/duration-range.mjs`: 0/1/59/60/61/600초 값 보존, 0초 차단/복구/커서 초기화.
- 기존 AIFF28항목, 파일교체 실패·복구, suspended import, 초기재생 취소, 키보드4항목 통과. 수정JS 문법 및 diff 공백 검사 통과.

## 실제 브라우저
- 로컬 `http://127.0.0.1:8894/granular/`: 2초 stereo WAV 파일 선택 성공. channel0 source 정책 유지.
- 0초 Play/Download 비활성, 600초=10min 표시, 2초로 돌아와 Play/시간커서/미터 진행 확인.
- 실제 Download Octo: `GranularCurveLab-octo (6).wav`, 8ch/48000Hz/24bit/96000frames=2초 확인. 이 단계 console error 없음.
- 6개 파라미터 모드 전환 후3초 재생 진행 확인. Reset All 호출에서 브라우저 제어가 시간초과해 확인/취소 완료는 미검증. 제품 결함으로 확정하지 않는다.
- 화면 캡처: 가족검증폴더 `evidence/granular-window-duration-20261014.png` (1422×800).

## 범위와 후속
비교청취/alias/gain정책은 보류 유지. 이번 결과는 Preview와 Render의 전체 음질 일치나 저사양 장시간 보증이 아니다. Reset 확인/취소, 좁은 화면 및 새 경계의 청감은 추가 확인 대상. 커밋·배포 전 사용자 검토 가능.


## 배포 전 후속 — 실제 Safari 리셋 검증 완료

- 96k/24bit/stereo 5초 fixture 파일 로드. Read Position 점3개 및 Source Window15–34%로 편집.
- Reset All 취소: 점3개/선택15–34%/원본 파일 유지 확인.
- Reset All 확인: 점2개/선택0–0.10%/기본 파라미터/커서0 복귀. 원본 파일과 Output Duration20초 유지.
- 이후 Play 시간0.50초/미터 진행, Pause, Download 완료 및 버튼 복구. 실제 저장 GranularCurveLab-mono-6.wav: mono/48000Hz/24bit/960000frames=20초.
- 앞서 남은 리셋 확인·취소 항목 해소. Codex 내장 브라우저 확인창 자동제어의 제약을 실제 Safari 확인으로 대체했으며 리셋 제품 코드는 변경하지 않음.
- 사용자 승인에 따라 이번 경계 수정·단일 Duration 묶음 커밋/배포 진행. 기존144조건/AIFF/입력/키보드 검증 후 제품 추가변경 없음.
