import Link from "next/link";

const footerContent = [
    {
        title: "Links",
        links: [
            { label: "Tietosuojaseloste", href: "gdpr" },
            { label: "Sign in", href: "sign-in" }
        ]
    },
];

export default function Footer() {
    return (
        <footer className="w-full py-10 flex justify-center items-start bg-background text-foreground">
            <div className="w-full max-w-5xl grid gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 text-center md:text-left">
                
                {/* Brand Info */}
                <div className="flex flex-col items-center md:items-start">
                    <h1 className="text-2xl font-bold">Liukastumisvaroituspalvelu</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Liukkaan jalankulkusään varoitukset suoraan puhelimeesi.
                    </p>
                </div>

                {/* Footer Links */}
                {footerContent.map((group) => (
                    <div className="flex flex-col space-y-3 items-center md:items-start" key={group.title}>
                        <h2 className="text-xl font-semibold">{group.title}</h2>
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

            </div>
        </footer>
    );
}
