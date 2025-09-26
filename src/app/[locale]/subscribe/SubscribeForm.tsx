"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SubscribeForm() {
  const [selectedOption, setSelectedOption] = useState("sms");
  const t = useTranslations("subscribe");

  const options = [
    {
      id: "sms",
      label: t("options.sms.label"),
      icon: <Smartphone className="h-5 w-5 text-orange-600" />,
      guide: [
        [t("options.sms.guide.step1"), { bold: t("options.sms.guide.number") }],
        [t("options.sms.guide.step2"), { bold: t("options.sms.guide.keyword") }],
        [t("options.sms.guide.step3"), { bold: t("options.sms.guide.ex2") }],
      ],
    },
  ];

  const selectedOptionData = options.find((opt) => opt.id === selectedOption);

  return (
    <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-6">
      {/* Left Column */}
      <div>
        <RadioGroup
          value={selectedOption}
          onValueChange={setSelectedOption}
          className="space-y-3"
        >
          {options.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-colors ${
                selectedOption === option.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <CardContent className="p-3 flex items-center space-x-3">
                <RadioGroupItem value={option.id} id={option.id} />
                {option.icon}
                <Label htmlFor={option.id} className="cursor-pointer">
                  {option.label}
                </Label>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </div>

      {/* Right Column */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
            {selectedOptionData?.icon}
            <span>
              {t("subscribeWith")} {selectedOptionData?.label}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <h3 className="font-medium text-sm md:text-base mb-3">
            {t("instructions")}
          </h3>

          {/* 3 clear steps with bold tokens */}
          <ol className="space-y-4 pl-5 text-sm list-decimal">
            {selectedOptionData?.guide.map((step, i) => (
              <li key={i} className="pl-1">
                {Array.isArray(step) ? (
                  step.map((part, j) =>
                    typeof part === "string" ? (
                      <span key={j}>{part} </span>
                    ) : (
                      <code
                        key={j}
                        className="font-mono bg-gray-800 text-white px-2 py-1 rounded-md"
                      >
                        {part.bold}
                      </code>
                    )
                  )
                ) : (
                  <span>{step}</span>
                )}
              </li>
            ))}
          </ol>

          {/* Examples + notes */}
          <div className="mt-4 rounded-lg bg-white border p-3">
            <p className="font-medium mb-2">
              {t("options.sms.guide.examplesTitle")}
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <code className="font-mono px-2 py-1 rounded bg-gray-100">
                  {t("options.sms.guide.ex1")}
                </code>
                <span className="text-gray-600">
                  {" "}
                  — {t("options.sms.guide.ex1Note")}
                </span>
              </li>
              <li>
                <code className="font-mono px-2 py-1 rounded bg-gray-100">
                  {t("options.sms.guide.ex2")}
                </code>
                <span className="text-gray-600">
                  {" "}
                  — {t("options.sms.guide.ex2Note")}
                </span>
              </li>
              <li>
                <code className="font-mono px-2 py-1 rounded bg-gray-100">
                  {t("options.sms.guide.ex3")}
                </code>
                <span className="text-gray-600">
                  {" "}
                  — {t("options.sms.guide.ex3Note")}
                </span>
              </li>
            </ul>

            <div className="mt-3 text-xs md:text-sm text-gray-600">
              <p>• {t("options.sms.guide.note1")}</p>
              <p>• {t("options.sms.guide.note2")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
