"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "./skeleton"

export default function ThemeToggler() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="w-9 h-9 aspect-square"/>
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      size={"icon"}
      variant={"link"}
      onClick={toggleTheme}
      className={"group cursor-pointer"}
    >
      {theme === "dark" ? (
        <Sun className="transition-all duration-200 group-hover:fill-current" />
      ) : (
        <Moon className="transition-all duration-200 group-hover:fill-current" />
      )}
    </Button>
  )
}