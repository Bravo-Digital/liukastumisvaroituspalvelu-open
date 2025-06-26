import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import ThemeToggler from "./ui/theme-toggler";
import LanguageSwitcher from "./ui/language-switcher";
import { getTranslations } from "next-intl/server";

const links = [
  {
    label: "Warnings",
    href: "/"
  },
  {
    label: "API",
    href: "/api"
  },
]

export default async function Navbar() {
  const t = await getTranslations("Navbar")
  return (
    <nav className="w-full flex justify-between items-center p-5 text-sm md:text-base max-w-5xl">
      <ul className="flex space-x-5 md:space-x-10">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="relative inline-block group hover:text-primary transition-colors duration-300"
            >
              {t(link.label)}
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-current scale-x-0 origin-bottom-right transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-bottom-left" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex space-x-2 md:space-x-4 items-center">
        <Link
          href={"/subscribe"}
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          {t("Subscribe")}
        </Link>
        <LanguageSwitcher />
        <ThemeToggler />
      </div>
    </nav>
  );
}
