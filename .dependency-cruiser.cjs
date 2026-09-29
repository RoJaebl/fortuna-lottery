// .dependency-cruiser.cjs — 정본: boundary-enforcement §3 (규칙), incremental-migration §1 (제외 목록)
module.exports = {
  forbidden: [
    {
      name: 'no-cross-app',
      comment: '화면 앱과 응용 서버는 서로를 직접 참조하지 않는다. 공유 지점은 계약뿐이다',
      severity: 'error',
      from: { path: '^apps/(web|api)/' },
      to:   { path: '^apps/(web|api)/', pathNot: '^apps/$1/' },
    },
    {
      // 이 저장소만의 규칙: 화면 앱은 커널(서버 쪽 순수 도메인)을 직접 보지 않는다
      name: 'web-must-not-reach-kernel',
      comment: '화면 앱은 packages/kernel 을 참조하지 않는다. 공유 지점은 계약뿐이다',
      severity: 'error',
      from: { path: '^apps/web/' },
      to:   { path: '^packages/kernel/' },
    },
    {
      name: 'contract-only-in-mapper',
      comment: '화면 앱에서 계약을 참조하는 것은 변환기뿐이다',
      severity: 'error',
      from: { path: '^apps/web/src/', pathNot: '/mapper/' },
      to:   { path: 'packages/contract' },
    },
    {
      name: 'no-deep-module-import',
      comment: '화면 모듈 간 소통은 배럴로만 한다',
      severity: 'error',
      from: { path: '^apps/web/src/modules/([^/]+)/' },
      to:   { path: '^apps/web/src/modules/([^/]+)/.+', pathNot: '^apps/web/src/modules/$1/' },
    },
    {
      name: 'mapper-only-from-action',
      comment: '변환기를 부르는 것은 action 뿐이다. 화면도 표시 조정자도 모델도 부르지 않는다',
      severity: 'error',
      from: { path: '^apps/web/src/modules/', pathNot: '/(action|mapper)/' },
      to:   { path: '^apps/web/src/modules/.*/mapper/' },
    },
    {
      name: 'domain-model-has-zero-dependencies',
      comment: '도메인 원형은 같은 폴더와 계약 패키지 밖의 어떤 것도 참조하지 않는다',
      severity: 'error',
      from: { path: '/domain/model/' },
      to:   { pathNot: '(/domain/model/|^packages/contract/)' },
    },
    {
      name: 'domain-model-contract-import-must-be-type-only',
      comment: '도메인 원형이 계약에서 가져오는 것은 타입뿐이다',
      severity: 'error',
      from: { path: '/domain/model/' },
      to:   { path: '^packages/contract/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'no-upward-layer-dependency',
      comment: '의존은 아래로만 — domain·context·business 는 interface 를 참조하지 않는다',
      severity: 'error',
      from: { path: '/(domain|context|business)/' },
      to:   { path: '/interface/' },
    },
    {
      name: 'domain-must-not-reach-context-or-business',
      severity: 'error',
      from: { path: '/domain/' },
      to:   { path: '/(context|business)/' },
    },
    {
      name: 'api-imports-no-module',
      comment: '컨트롤러는 자기 모듈의 facade 와 포트만 본다',
      severity: 'error',
      from: { path: '^apps/([^/]+)/src/modules/([^/]+)/interface/api/' },
      to:   { path: '^apps/[^/]+/src/modules/',
              pathNot: '(^apps/$1/src/modules/$2/(interface/facade|domain/port)/)' },
    },
    {
      name: 'no-cross-module-import',
      comment: '서버 모듈은 다른 모듈의 어떤 파일도 참조하지 않는다. facade 도 모듈 파일도 안 된다',
      severity: 'error',
      from: { path: '^apps/([^/]+)/src/modules/([^/]+)/', pathNot: '^apps/web/' },
      to:   { path: '^apps/$1/src/modules/', pathNot: '^apps/$1/src/modules/$2/' },
    },
    {
      name: 'module-must-not-reach-composition',
      comment: '조립은 위에서 내려온다. 모듈이 조립 루트를 올려다보지 않는다',
      severity: 'error',
      from: { path: '^apps/[^/]+/src/modules/' },
      to:   { path: '^apps/[^/]+/src/composition/' },
    },
    {
      name: 'composition-sees-facade-only',
      comment: '조립 루트가 포트에 꽂는 것은 facade 뿐이다. 포트의 토큰만 예외다',
      severity: 'error',
      from: { path: '^apps/[^/]+/src/(composition/|app\\.module\\.ts$)' },
      to:   { path: '^apps/[^/]+/src/modules/[^/]+/(business|context|domain)/', pathNot: '/domain/port/' },
    },
    {
      name: 'driver-only-in-adapter',
      comment: '드라이버(파일 시스템·DB·HTTP)를 부르는 것은 어댑터와 서비스 공용 바닥뿐이다',
      severity: 'error',
      from: { path: '^apps/api/src/', pathNot: '/(domain/adapter|infrastructure)/' },
      // 이 저장소는 DB 드라이버로 Prisma 를 쓴다
      to:   { path: '(^(node:)?(fs|net|http|https|dns)$|@prisma/client)' },
    },
  ],
  options: {
    // 골조 이관 전 구역. 이 목록이 짧아지는 것이 진행이다.
    // 여기 있는 경로에는 어떤 골조 규칙도 걸리지 않는다.
    // 새 파일을 여기 만들지 않는다 — 규칙 3절.
    // 옮긴 도메인이 빠지면서 packages/core 와 화면 모듈은 남은 도메인을 풀어 쓴다.
    // core 의 picks 는 저장소 포트·엔티티·인메모리 어댑터 셋만 남았다 — 옛 results 가 results 이관(과업 8)까지 읽는다.
    exclude: {
      path:
        '^(packages/core/(src/(lotterietus|picks|results|simulation|statistics)/|vitest)' +
        '|apps/worker/' +
        '|apps/web/src/(modules/(lotterietus|results|simulation|statistics)/(view|viewmodel|transport|api)/|server/|app/api/))',
    },
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.base.json' },
    tsPreCompilationDeps: true,
  },
}
