import FeedbackForm from "./FeedbackForm";
import { readFile } from "fs/promises";
import path from "path";

export default async function FeedbackPage({ params }: { params: { locale: string } }) {
  // Load the JSON for the current locale
  const filePath = path.resolve(`messages/${params.locale}.json`);
  const rawData = await readFile(filePath, "utf-8");
  const messages = JSON.parse(rawData);

  const translations = messages.FeedbackForm;

  return <FeedbackForm translations={translations} />;
}
