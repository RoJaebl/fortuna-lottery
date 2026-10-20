// 공개 표면 — 이 화면 모듈의 _action/ 등록 파일을 불러오는 목록. 뷰와 routes.ts 는 불러오지 않는다 (frontend-module-layout §8)
import "./StatisticsPanel/_action/getStatistics.action";
import "./LotterietusCard/_action/getLotterietusStatus.action";
import "./PicksCard/_action/listPicks.action";
import "./ResultsCard/_action/checkResults.action";
import "./HypothesisLab/_action/checkPopularity.action";
import "./PicksCard/_action/savePick.action";
import "./PicksCard/_action/deletePick.action";
import "./GeneratorCard/_action/generateCombination.action";
import "./HypothesisLab/_action/evaluateAssumption.action";
import "./HypothesisLab/_action/generateAssumed.action";
import "./SimulationCard/_action/backtestCombination.action";
