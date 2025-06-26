import Link from "next/link";

const footerContent = [
    {
        title: "Links",
        links: [
            {
                label: "Home",
                href: "/"
            },
            {
                label: "Sign in",
                href: "sign-in"
            }
        ]
    }
]

export default function Footer() {
    return (
        <footer className="w-full h-auto flex justify-center items-start bg-foreground text-background">
            <div className="w-full max-w-5xl grid grid-cols-3 py-10">
                {footerContent.map((group) => {
                    return (
                        <div className="space-y-5" key={group.title}>
                            <h1 className="text-xl font-semibold">{group.title}</h1>
                            <ul>
                                {group.links.map((link) => {
                                    return (
                                        <li key={link.label}>
                                            <Link href={link.href}>{link.label}</Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )
                })}
            </div>
        </footer>
    )
}