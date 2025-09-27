import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";


export default function Footer() {
  const t = useTranslations("Footer");

  const footerContent = [
    {
      title: t("links"),
      links: [
        { label: t("gdpr"), href: "/gdpr" },
        { label: t("developers"), href: "/developers" },
        { label: t("feedback"), href: "/feedback" },
      ],
    },
  ];

  return (
    <footer className="w-full py-10 flex justify-center items-start bg-background text-foreground">
    <div className="w-full max-w-5xl grid gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 text-center md:text-left">
      {/* Brand Info (left) */}
      <div className="flex flex-col items-center md:items-start">
        <h1 className="text-2xl font-bold">Liukasbotti</h1>
        <p className="text-sm text-muted-foreground mt-2">{t("slogan")}</p>
      </div>

      {/* Footer Links (middle) */}
      {footerContent.map((group) => (
        <div
          className="flex flex-col space-y-3 items-center md:items-start"
          key={group.title}
        >
          <ul className="space-y-1">
            {group.links.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Company Logo (right) */}
      <div className="flex items-center justify-center md:justify-end">
        <Link
          href="https://bravodigital.fi"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Bravo Digital Oy"
          className="inline-flex items-center"
        >
          {/* Light theme logo */}
          <Image
            src="/photos/bravo_digital_light.png"
            alt="Bravo Digital Oy"
            width={160}
            height={36}
            className="block dark:hidden h-16 w-auto"
          />
          {/* Dark theme logo */}
          <Image
            src="/photos/bravo_digital_dark.png"
            alt="Bravo Digital Oy"
            width={160}
            height={36}
            className="hidden dark:block h-16 w-auto"
          />
        </Link>
      </div>
    </div>
  </footer>
  );
}
