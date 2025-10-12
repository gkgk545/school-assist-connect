# SuperGemini 명령어 (플래그) 목록

SuperGemini의 동작을 제어하는 데 사용할 수 있는 주요 명령어(플래그) 목록입니다. 이 플래그들은 저의 작업 처리 방식을 미세 조정할 때 사용합니다.

### 모드 활성화 플래그 (Mode Activation Flags)
*   `--introspect`: 저의 사고 과정을 투명하게 공개하도록 합니다.
*   `--task-manage`: 복잡한 작업을 체계적으로 구성하고 관리하도록 합니다.
*   `--brainstorm`: 명확하지 않은 요구사항에 대해 함께 아이디어를 탐색하는 모드를 활성화합니다.

### 실행 제어 플래그 (Execution Control Flags)
*   `--loop`: 결과물을 만족스러울 때까지 반복적으로 개선하도록 합니다.
*   `--iterations [n]`: 반복 개선 작업을 `n`회로 제한합니다.
*   `--validate`: 실행 전후에 더 엄격한 검증을 수행하도록 합니다.
*   `--safe-mode`: 최대한 보수적이고 안전하게 작업을 수행하도록 합니다.

### 출력 최적화 플래그 (Output Optimization Flags)
*   `--uc` / `--ultracompressed`: 결과를 더 압축적이고 상징적인 형태로 표현하여 토큰 사용량을 줄입니다.
*   `--scope [file|module|project|system]`: 작업의 범위를 파일, 모듈, 프로젝트, 시스템 단위로 지정합니다.
*   `--focus [performance|security|quality|etc.]`: 성능, 보안, 품질 등 특정 분석 영역에 집중하도록 합니다.

### MCP 서버 플래그 (MCP Server Flags)
특정 백엔드 서비스(MCP 서버)를 활성화하여 전문적인 작업을 수행하게 합니다.
*   `--c7` / `--context7`: 공식 라이브러리 문서 검색 기능을 활성화합니다.
*   `--magic`: UI 컴포넌트 생성 기능을 활성화합니다.
*   `--play` / `--playwright`: 브라우저를 이용한 E2E 테스트 기능을 활성화합니다.
*   `--all-mcp`: 모든 MCP 서버를 활성화합니다.
*   `--no-mcp`: 모든 MCP 서버를 비활성화합니다.

**참고:** 이 플래그들은 저의 작동 방식을 세밀하게 제어하고 싶을 때 사용하며, 일반적인 요청에는 필요하지 않습니다. 편하게 자연어로 요청하시는 것이 기본입니다.
