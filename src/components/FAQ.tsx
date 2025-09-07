import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useTranslations } from "next-intl";
import { use } from "react";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface FAQProps {
  items: FAQItem[];
}

export function FAQ({ items }: FAQProps) {
  const t = useTranslations("Homepage.FAQ");
  return (
    <section className="w-full max-w-5xl mx-auto py-16 px-5 md:px-0">
      <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
        {t("title")}
      </h2>
      <Accordion type="single" collapsible className="space-y-4">
        {items.map((item, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-border rounded-xl bg-card shadow-sm transition-all duration-300 hover:bg-primary/5 hover:shadow-lg"
          >
            <AccordionTrigger className="text-lg md:text-xl font-medium px-6 py-4 no-underline hover:no-underline focus:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-base md:text-lg text-card-foreground/90 px-6 pb-4 pt-2">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
