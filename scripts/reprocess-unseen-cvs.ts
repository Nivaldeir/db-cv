import "dotenv/config"
import { reprocessUnseenCvs } from "../src/server/jobs/reprocess-unseen-cvs"

const INTERVAL_MS = Number(process.env.REPROCESS_INTERVAL_MS ?? 5 * 60_000)
const RUN_ONCE = process.argv.includes("--once")

async function tick() {
  try {
    const result = await reprocessUnseenCvs()
    console.log(JSON.stringify(result, null, 2))
  } catch (e) {
    console.error("[reprocess-unseen-cvs] erro inesperado:", e)
  }
}

async function main() {
  await tick()
  if (RUN_ONCE) return
  console.log(`[reprocess-unseen-cvs] próximo ciclo em ${INTERVAL_MS} ms`)
  setInterval(tick, INTERVAL_MS)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
