// .dependency-cruiser.cjs — 정본: boundary-enforcement §3 (규칙), incremental-migration §1 (제외 목록)
const fs = require('node:fs')

const APP = 'apps/web/src/app'
const ROUTE = `^${APP}/(?!api/|\\(dev\\)/)[^/]+/`   // 라우트 폴더 — 뿌리 파일·끝점 갈래·개발 전용 자리 밖
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// 화면 모듈 = page.tsx 를 가진 app/ 아래 폴더. 뷰(대문자)·소유물(_) 폴더는 라우트가 아니므로 내려가지 않는다
function screenModules(dir = APP) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !/^[A-Z_]/.test(e.name)
                   && !(dir === APP && ['api', '(dev)'].includes(e.name)))
    .flatMap((e) => {
      const sub = `${dir}/${e.name}`
      return [...(fs.existsSync(`${sub}/page.tsx`) ? [sub] : []), ...screenModules(sub)]
    })
}

// 화면 모듈 하나의 파일 — 그 폴더 바로 아래이거나 뷰(대문자)·소유물(_) 폴더만 거친 것.
// 거친 폴더 가운데 하나라도 다른 글자로 시작하면 그 아래는 중첩 라우트다
const ownFiles = (mod) => `^${escape(mod)}/(?![^A-Z_/][^/]*/)(?!.*/[^A-Z_/][^/]*/)`

// 위로 보기 — 조상 폴더(page 없는 중간 폴더·라우트 그룹 포함, app/ 뿌리 제외)의 소유물 폴더
const ancestorOwned = (mod) => {
  const parts = mod.slice(APP.length + 1).split('/').slice(0, -1)
  return parts.map((_, i) => `^${escape(`${APP}/${parts.slice(0, i + 1).join('/')}`)}/_(model|action|mapper)/`)
}

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
      from: { path: '^apps/web/src/', pathNot: '/_?mapper/' },
      to:   { path: 'packages/contract' },
    },
    {
      name: 'no-deep-screen-or-widget-import',
      comment: '화면 모듈·위젯·묶음 위젯의 안쪽 파일은 그 폴더 밖에서 짚지 않는다. 밖에서는 공개 표면만 본다',
      severity: 'error',
      // $1 은 폴더 하나 — widgets/combined/<이름>, widgets/<이름>, app 가운데 하나다.
      // app/ 안의 파일끼리는 screen-must-not-reach-screen 이, 조립 루트는 아래 세 벌이 본다
      from: { path: '^apps/web/src/(widgets/combined/[^/]+|widgets/(?!combined/)[^/]+|app)/' },
      to:   { path: `^apps/web/src/(widgets/.+|app/(?!api/|\\(dev\\)/)[^/]+/.+)`,
              // 자기 폴더 안과 남의 공개 표면은 이 규칙이 막지 않는다. 뷰 폴더의 index.tsx 는 공개 표면이 아니다
              pathNot: ['^apps/web/src/$1/',
                        `^${APP}/(?!api/|\\(dev\\)/).*/index\\.ts$`,   // 화면 모듈의 index.ts
                        '^apps/web/src/widgets/[^/]+/index\\.tsx?$',
                        '^apps/web/src/widgets/combined/[^/]+/index\\.tsx?$'] },
    },
    // 조립 루트 세 벌 — 화면 모듈과 위젯에 닿는 것은 등록 목록 둘뿐이고, 둘이 짚는 파일도 정해져 있다
    {
      name: 'no-deep-screen-or-widget-import',
      comment: 'composition/screens.ts 가 화면 모듈과 위젯에서 보는 것은 화면 모듈의 index.ts 와 위젯의 register.ts 뿐이다',
      severity: 'error',
      from: { path: '^apps/web/src/composition/screens\\.ts$' },
      to:   { path: '^apps/web/src/(widgets|app)/',
              pathNot: [`^${APP}/(?!api/|\\(dev\\)/).*/index\\.ts$`,
                        '^apps/web/src/widgets/(combined/)?[^/]+/register\\.ts$'] },
    },
    {
      name: 'no-deep-screen-or-widget-import',
      comment: 'composition/routes.ts 가 보는 것은 라우트 폴더의 routes.ts 뿐이다',
      severity: 'error',
      from: { path: '^apps/web/src/composition/routes\\.ts$' },
      to:   { path: '^apps/web/src/(widgets|app)/', pathNot: `^${APP}/(?!api/|\\(dev\\)/).*/routes\\.ts$` },
    },
    {
      name: 'no-deep-screen-or-widget-import',
      comment: '조립 루트의 나머지 파일은 화면 모듈과 위젯에 닿지 않는다 — screens.ts·routes.ts 를 거친다',
      severity: 'error',
      from: { path: '^apps/web/src/composition/', pathNot: '^apps/web/src/composition/(screens|routes)\\.ts$' },
      to:   { path: '^apps/web/src/(widgets|app)/' },
    },
    // 화면 모듈마다 한 벌 — 자기 파일과 조상 라우트의 소유물 폴더(위로 보기)만 본다
    ...screenModules().map((mod) => ({
      name: 'screen-must-not-reach-screen',
      comment: `${mod} 은 다른 화면 모듈과 셸을 보지 않는다. 조상 라우트의 소유물 폴더만 위로 본다`,
      severity: 'error',
      from: { path: ownFiles(mod) },
      to:   { path: `^${APP}/`, pathNot: [ownFiles(mod), ...ancestorOwned(mod)] },
    })),
    {
      name: 'screen-must-not-reach-screen',
      comment: '위젯과 묶음 위젯은 app/ 을 보지 않는다. 화면 모듈의 사건과 주소는 key 문자열로만 쓴다',
      severity: 'error',
      from: { path: '^apps/web/src/widgets/' },
      to:   { path: `^${APP}/` },
    },
    {
      name: 'screen-must-not-reach-screen',
      comment: '놀이터 문 페이지가 화면 모듈에서 보는 것은 playground.ts 뿐이다',
      severity: 'error',
      from: { path: `^${APP}/\\(dev\\)/` },
      to:   { path: ROUTE, pathNot: '/playground\\.ts$' },
    },
    {
      name: 'shell-sees-no-screen-or-widget',
      comment: 'app/ 뿌리의 셸과 끝점 갈래는 화면 모듈도 위젯도 보지 않는다. 화면 모듈은 Next 가 그린다',
      severity: 'error',
      from: { path: `^${APP}/(?:[^/]+$|api/)` },
      to:   { path: `^apps/web/src/(widgets/|app/(?!api/)[^/]+/)` },
    },
    {
      name: 'shared-stays-in-shared',
      comment: 'shared/lib·shared/ui 는 같은 shared/ 안만 본다',
      severity: 'error',
      from: { path: '^apps/web/src/shared/' },
      to:   { path: '^apps/web/src/', pathNot: '^apps/web/src/shared/' },
    },
    {
      name: 'widget-must-not-reach-widget',
      comment: '위젯은 다른 위젯을 import 하지 않는다. 위젯을 묶는 것은 widgets/combined/ 뿐이다',
      severity: 'error',
      from: { path: '^apps/web/src/widgets/(?!combined/)([^/]+)/' },
      to:   { path: '^apps/web/src/widgets/', pathNot: '^apps/web/src/widgets/$1/' },
    },
    {
      name: 'only-combined-reaches-widgets',
      comment: '묶음 위젯은 위젯의 배럴만 묶는다. 묶음 위젯끼리는 import 하지 않는다 — 묶음은 한 층뿐이다',
      severity: 'error',
      from: { path: '^apps/web/src/widgets/combined/([^/]+)/' },
      to:   { path: '^apps/web/src/widgets/combined/', pathNot: '^apps/web/src/widgets/combined/$1/' },
    },
    {
      name: 'mapper-only-from-action',
      comment: '변환기를 부르는 것은 action 뿐이다. 화면도 표시 조정자도 모델도 부르지 않는다',
      severity: 'error',
      // 화면 모듈의 소유물은 _action/·_mapper/, 위젯의 것은 action/·mapper/ 다
      from: { path: '^apps/web/src/(app|widgets)/', pathNot: '/_?(action|mapper)/' },
      to:   { path: '^apps/web/src/(app|widgets)/.*/_?mapper/' },
    },
    {
      name: 'nothing-reaches-composition',
      comment: '아무도 조립 루트를 import 하지 않는다. 예외는 다섯이다',
      severity: 'error',
      from: { path: '^apps/web/src/',
              pathNot: ['^apps/web/src/composition/',              // 조립 루트 안의 파일끼리
                        '^apps/web/src/app/AppContainer\\.tsx$',   // 셸이 createContainer 로 컨테이너를 짓는다
                        '^apps/web/src/app/layout\\.tsx$',         // 서버 루트가 주소 등록을 싣는다 — 아래 한 벌이 좁힌다
                        '^apps/web/src/(middleware|proxy)\\.ts$',  // middleware 가 주소 등록을 싣는다 — middleware 규칙이 좁힌다
                        '^apps/web/src/app/\\(dev\\)/',            // 놀이터가 시나리오마다 컨테이너를 짓는다
                        '\\.test\\.tsx?$'] },                      // 시험이 createContainer("test") 로 짓는다
      to:   { path: '^apps/web/src/composition/' },
    },
    {
      name: 'nothing-reaches-composition',
      comment: '서버로 남는 루트 layout.tsx 가 조립 루트에서 보는 것은 주소 등록 목록 composition/routes.ts 하나다',
      severity: 'error',
      from: { path: '^apps/web/src/app/layout\\.tsx$' },
      to:   { path: '^apps/web/src/composition/', pathNot: '^apps/web/src/composition/routes\\.ts$' },
    },
    {
      name: 'infrastructure-reaches-lib-only',
      comment: 'infrastructure 는 shared/lib 만 본다. 외부 패키지는 괜찮다',
      severity: 'error',
      from: { path: '^apps/web/src/infrastructure/' },
      to:   { path: '^apps/web/src/', pathNot: '^apps/web/src/(infrastructure|shared/lib)/' },
    },
    {
      name: 'screen-sees-infrastructure-types-only',
      comment: '화면 모듈·위젯이 infrastructure 에서 가져오는 것은 캐시 도구(값) 하나다. HTTP 포트와 사건 통로는 타입으로도 보지 않는다',
      severity: 'error',
      from: { path: `(${ROUTE}|^apps/web/src/widgets/)`,
              pathNot: '/playground\\.ts$' },                      // 놀이터 표면이 가짜 서버를 값으로 가져온다
      to:   { path: '^apps/web/src/infrastructure/',
              pathNot: '^apps/web/src/infrastructure/serverCache\\.ts$' },
    },
    {
      name: 'shell-reaches-no-infrastructure',
      comment: 'app/ 뿌리의 셸은 infrastructure 를 보지 않는다. 보는 것은 끝점 갈래(app/api/)다',
      severity: 'error',
      // 캐시 라이브러리를 들이지 않았으므로 AppContainer.tsx 예외는 없다
      from: { path: `^${APP}/[^/]+$`, pathNot: '\\.test\\.tsx?$' },
      to:   { path: '^apps/web/src/infrastructure/' },
    },
    {
      name: 'endpoint-only-in-api',
      comment: 'route.ts 는 끝점 갈래(app/api/) 밖에 두지 않고, 끝점 갈래는 page.tsx 를 갖지 않는다',
      severity: 'error',
      // 그 자리에 파일이 있으면 운다 — 쓰는 이가 100 보다 적은 모듈 전부다(검사기가 받는 상한이 100 이다)
      module: { path: [`^${APP}/(?!api/)(?:route|.*/route)\\.ts$`, `^${APP}/api/(?:page|.*/page)\\.tsx$`],
                numberOfDependentsLessThan: 100 },
      from: {},
    },
    {
      name: 'no-root-screen',
      comment: 'app/ 뿌리는 화면 모듈이 아니다. 뿌리 화면은 app/(home)/page.tsx 에, 공용 소유물은 위젯이나 shared/ 에 둔다',
      severity: 'error',
      module: { path: `^${APP}/(?:page\\.tsx|_(model|action|mapper)/.+)$`, numberOfDependentsLessThan: 100 },
      from: {},
    },
    {
      name: 'dev-seats-not-from-prod',
      comment: '운영 코드는 개발 전용 자리(놀이터·화면 모듈의 playground.ts·가짜 서버·개발자 패널)를 import 하지 않는다',
      severity: 'error',
      from: { path: '^apps/web/src/',
              pathNot: [`^${APP}/\\(dev\\)/`,                      // 놀이터 문 페이지 — playground.ts 를 보는 유일한 자리
                        '^apps/web/src/infrastructure/(http/fake|devtools)/',   // 개발 전용 자리 안의 파일끼리
                        `^${APP}/(?!api/|\\(dev\\)/).*/playground\\.ts$`,         // 화면 모듈의 놀이터 표면도 개발 전용 자리다
                        '^apps/web/src/composition/inspect\\.ts$',  // 개발 모드에서만 개발자 패널을 잇는다
                        '\\.test\\.tsx?$'] },
      to:   { path: [`^${APP}/\\(dev\\)/`, `^${APP}/(?!api/|\\(dev\\)/).*/playground\\.ts$`,
                     '^apps/web/src/infrastructure/(http/fake|devtools)/'] },
    },
    {
      name: 'middleware-sees-infrastructure-lib-routes-only',
      comment: 'middleware.ts(Next 16 부터 proxy.ts)가 보는 것은 infrastructure·shared/lib·주소 등록 목록 composition/routes.ts 뿐이다',
      severity: 'error',
      from: { path: '^apps/web/src/(middleware|proxy)\\.ts$' },   // 두 이름을 같은 규칙으로 읽는다
      to:   { path: '^apps/web/src/',
              pathNot: ['^apps/web/src/(infrastructure|shared/lib)/', '^apps/web/src/composition/routes\\.ts$'] },
    },
    {
      name: 'domain-model-has-zero-dependencies',
      comment: '도메인 원형은 같은 폴더와 계약 패키지 밖의 어떤 것도 참조하지 않는다',
      severity: 'error',
      // boundary-enforcement §3 그대로: 원형 옆의 시험 파일은 시험 러너(vitest)를 가져와야 한다 — 시험은 제품 코드가 아니다
      from: { path: '/domain/model/', pathNot: '\\.test\\.ts$' },
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
      comment: '컨트롤러와 스케줄러는 자기 모듈의 facade 와 포트만 본다',
      severity: 'error',
      from: { path: '^apps/([^/]+)/src/modules/([^/]+)/interface/(?:api|schedule)/' },
      to:   { path: '^apps/[^/]+/src/modules/',
              pathNot: '(^apps/$1/src/modules/$2/(interface/facade|domain/port)/)' },
    },
    {
      name: 'business-must-not-reach-adapter',
      comment: '유스케이스는 포트로만 받는다 — backend §7. vault §3 전문에 없는 저장소 규칙',
      severity: 'error',
      from: { path: '/(business|context)/' },
      to:   { path: '/domain/adapter/' },
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
      comment: '조립은 위에서 내려온다. 서버 모듈이 조립 루트를 올려다보지 않는다',
      severity: 'error',
      // 화면 앱은 nothing-reaches-composition 이 앱 전체를 덮는다
      from: { path: '^apps/[^/]+/src/modules/', pathNot: '^apps/web/' },
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
      // 하위 경로(fs/promises, node:fs/promises)도 잡고, @prisma/client 는 풀리면 node_modules 아래 경로가 된다
      to:   { path: '(^(node:)?(fs|net|http|https|dns)(/|$)|(^|/node_modules/)@prisma/client(/|$))' },
    },
  ],
  options: {
    // 골조 이관 전 구역(exclude)은 비었다 — 도메인을 다 옮기고 packages/core·apps/web/src/server·Next 경로 처리기를 지웠다.
    // 이제 모든 파일에 골조 규칙이 걸린다. 옛 구역을 다시 만들지 않는다 — incremental-migration 규칙 3절.
    doNotFollow: { path: 'node_modules' },
    // 화면 앱의 층 별칭 여섯은 tsconfig.depcruise.json 의 paths 로, 작업 공간 패키지는 package.json 의 exports 로 푼다.
    // 풀지 못하면 couldNotResolve 로 남아 계약·커널·배럴 규칙이 아무것도 보지 못한다. 계약·커널의 exports 는 dist 를 가리키므로 build 가 먼저다.
    tsConfig: { fileName: 'tsconfig.depcruise.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types'],
    },
  },
}
