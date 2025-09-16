import { buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"
import ThemeToggler from "./ui/theme-toggler"
import LanguageSwitcher from "./ui/language-switcher"
import { getTranslations } from "next-intl/server"

const links = [
  { label: "Warnings", href: "/warnings" },
  { label: "developers", href: "/developers" },
  { label: "Feedback", href: "/feedback" },
]

export default async function Navbar() {
  const t = await getTranslations("Navbar")

  return (
    <nav className="w-full flex justify-between items-center p-5 text-sm md:text-base max-w-5xl mx-auto">
      {/* Skip to main content (visible on keyboard focus) */}
      <a
        href="#main"
        className={
          `${buttonVariants({ variant: "outline", size: "sm" })} ` +
          // Visually hidden until focused
          "sr-only focus:not-sr-only " +
          // Pop it to the corner when focused
          "focus:absolute focus:top-2 focus:left-2 focus:z-50 " +
          // Make it look like a real button when visible
          "focus:p-2 focus:shadow-md"
        }
      >
        {t("SkipToContent")}
      </a>
      {/* Brand / Logo */}
      <div className="flex items-center space-x-2 md:space-x-3">
        <Link href="/" className="text-2xl font-bold hover:text-primary transition-colors">
          Liukasbotti
        </Link>
      </div>

      {/* Desktop Navigation */}
      <ul className="hidden md:flex space-x-5 md:space-x-10">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="relative inline-block group hover:text-light transition-colors duration-300"
            >
              {t(link.label)}
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-current scale-x-0 origin-bottom-right transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-bottom-left" />
            </Link>
          </li>
        ))}
      </ul>

      {/* Actions (desktop) */}
      <div className="hidden md:flex space-x-2 md:space-x-4 items-center">
        <Link
          href={"/subscribe"}
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          {t("Subscribe")}
        </Link>
        <LanguageSwitcher />
        <ThemeToggler />
      </div>

      {/* Mobile Hamburger */}
      <div className="md:hidden">
        <Sheet>
          
        <SheetTrigger asChild>
          <button
            className="p-2 rounded-md hover:bg-accent"
            aria-label={t("OpenMenu")}
            aria-haspopup="dialog"
            aria-controls="mobile-nav"
          >
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent id="mobile-nav" side="right" className="w-80">
          <SheetTitle className="sr-only">{t("Menu")}</SheetTitle>
            <nav className="flex flex-col space-y-4 mt-6 px-10">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-lg hover:text-primary transition-colors"
                >
                  {t(link.label)}
                </Link>
              ))}

              <div className="pt-6 flex flex-col space-y-3">
                <Link
                  href={"/subscribe"}
                  className={buttonVariants({ variant: "default", size: "sm" })}
                >
                  {t("Subscribe")}
                </Link>
                <LanguageSwitcher />
                <div className="text-center">
                <ThemeToggler/> 
                </div>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}