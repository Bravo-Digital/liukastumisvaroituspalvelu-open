import FeedbackForm from "./FeedbackForm";
import { readFile } from "fs/promises";
import path from "path";
export default async function FeedbackPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params; 
  const filePath = path.resolve(`messages/${locale}.json`);
  const rawData = await readFile(filePath, "utf-8");
  const messages = JSON.parse(rawData);

  const translations = messages.FeedbackForm;
  return <FeedbackForm translations={translations} />;
}

