import { checkForWindWarningsInHelsinki } from "@/lib/checkWarnings";
import { saveWarnings } from "@/lib/addToDb";

async function pollWarnings() {
  try {
    console.log(`[${new Date().toISOString()}] Checking warnings...`);
    const warnings = await checkForWindWarningsInHelsinki();

    if (warnings.length === 0) {
      console.log("No new or updated warnings found.");
      return;
    }

    console.log(`Found ${warnings.length} new or updated warnings. Saving...`);
    await saveWarnings(warnings);
    console.log("Warnings saved successfully.");
  } catch (error) {
    console.error("Error during polling:", error);
  }
}

// Run immediately, then every 5 minutes (300000 ms)
pollWarnings();
setInterval(pollWarnings, 300000);
