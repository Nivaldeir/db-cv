import "dotenv/config"
import { runGoogleSheetCvSync } from "../src/server/jobs/google-sheet-cv-sync"

async function main() {
  const result = await runGoogleSheetCvSync()
  console.log(JSON.stringify(result, null, 2))
  if (result.errors.length > 0) {
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
