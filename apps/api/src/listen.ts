/** 응용 서버가 받은 포트에 서는 일 — 다른 포트로 옮기지 않는다 (launcher-ports §2) */
export interface ListenOptions {
  /** 「옮기지 말라」 신호(FORTUNA_STRICT_PORT=1). 아니면 EADDRINUSE 를 기다리지 않고 던진다 */
  strict: boolean;
  /** strict 일 때 시도 횟수(첫 시도 포함) */
  attempts: number;
  delayMs: number;
  /** 시험이 바꿔 끼운다 */
  sleep?: (ms: number) => Promise<void>;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isAddressInUse(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === "EADDRINUSE";
}

/** 포트가 쥐여 있으면(EADDRINUSE) strict 일 때 풀리기를 기다려 다시 시도하고, 끝내 실패하면 그 오류를 던진다 */
export async function listenOnPort(listen: (port: number) => Promise<void>, port: number, opts: ListenOptions): Promise<void> {
  const sleep = opts.sleep ?? wait;
  const attempts = opts.strict ? Math.max(1, opts.attempts) : 1;
  for (let attempt = 1; ; attempt++) {
    try {
      await listen(port);
      return;
    } catch (error) {
      if (!isAddressInUse(error) || attempt >= attempts) throw error;
      await sleep(opts.delayMs);
    }
  }
}
