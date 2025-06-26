"use client"

import React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { ChevronDown, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buttonVariants } from './button';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const locales = routing.locales;

  const handleLocaleChange = (newLocale: 'fi' | 'sv' | 'en') => {
    router.replace(pathname, { locale: newLocale });
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "border border-foreground flex items-center space-x-1"
        )}
      >
        {/* Desktop: show text + chevron */}
        <span className="hidden md:inline">{locale.toUpperCase()}</span>
        <ChevronDown className="hidden md:inline h-3 w-3" />
        
        {/* Mobile: show only globe icon */}
        <Globe className="inline md:hidden h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className="min-w-fit p-3">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="text-sm cursor-pointer"
            disabled={locale === loc}
          >
            {loc.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
