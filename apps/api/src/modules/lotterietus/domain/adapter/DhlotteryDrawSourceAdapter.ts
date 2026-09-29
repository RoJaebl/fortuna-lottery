import { createCombination, LOTTO_MAX, LOTTO_MIN } from "@fortuna-lottery/kernel";
import type { Draw } from "../model/Draw.model.js";
import { drawnAtFromYmd } from "../model/drawnAt.js";
import type { DrawSourcePort } from "../port/DrawSourcePort.js";

const ENDPOINT = "https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do";
const RESULT_PAGE = "https://www.dhlottery.co.kr/lt645/result";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
/** 요청 타임아웃 (ms) */
const TIMEOUT_MS = 10_000;

/** 응답 1행 — 실제로 쓰는 필드만 선언한다 (당첨금·등수 등 나머지는 무시) */
interface DhlotteryRow {
  ltEpsd: number;
  tm1WnNo: number;
  tm2WnNo: number;
  tm3WnNo: number;
  tm4WnNo: number;
  tm5WnNo: number;
  tm6WnNo: number;
  bnsWnNo: number;
  /** 추첨일 "YYYYMMDD" */
  ltRflYmd: string;
}

interface DhlotteryResponse {
  data?: { list?: DhlotteryRow[] | null } | null;
}

function toDraw(row: DhlotteryRow): Draw {
  const rawNumbers = [row.tm1WnNo, row.tm2WnNo, row.tm3WnNo, row.tm4WnNo, row.tm5WnNo, row.tm6WnNo];
  if (![row.ltEpsd, ...rawNumbers, row.bnsWnNo].every(Number.isFinite)) {
    throw new Error(`회차 ${row.ltEpsd} 응답의 번호 필드가 올바르지 않습니다`);
  }
  const combination = createCombination(rawNumbers);
  if (!combination.ok) {
    throw new Error(`회차 ${row.ltEpsd} 응답의 당첨번호가 올바르지 않습니다: ${combination.error}`);
  }
  if (!Number.isInteger(row.bnsWnNo) || row.bnsWnNo < LOTTO_MIN || row.bnsWnNo > LOTTO_MAX) {
    throw new Error(`회차 ${row.ltEpsd} 응답의 보너스 번호가 올바르지 않습니다: ${row.bnsWnNo}`);
  }
  return {
    round: row.ltEpsd,
    numbers: combination.value,
    bonus: row.bnsWnNo,
    drawnAt: drawnAtFromYmd(row.ltRflYmd),
  };
}

/**
 * 동행복권 비공식 엔드포인트 어댑터 — 전역 fetch 를 부르는 유일한 자리.
 *
 * 요청 회차 R 기준 [R-5, R+4] 창을 내림차순으로 돌려주며, 양 끝에서는 창을 밀어 항상 10개를
 * 채운다. R이 아직 없는 회차면 빈 목록을 준다 (IngestDraws의 종료 조건).
 * 공식 API가 아니므로 호출 간격(IngestDraws의 requestDelayMs)을 반드시 둔다.
 */
export class DhlotteryDrawSourceAdapter implements DrawSourcePort {
  fetchBatch = async (centerRound: number): Promise<readonly Draw[]> => {
    const response = await fetch(`${ENDPOINT}?srchDir=center&srchLtEpsd=${centerRound}`, {
      headers: {
        Referer: RESULT_PAGE,
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`동행복권 응답 실패 (${centerRound}회차 요청): HTTP ${response.status}`);
    }

    const payload = (await response.json()) as DhlotteryResponse;
    const list = payload.data?.list;
    return Array.isArray(list) ? list.map(toDraw) : [];
  };
}
