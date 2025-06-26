"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MessageSquare, Smartphone, Bell, Send, CheckCircle, Phone } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const options = [
    {
        id: "whatsapp",
        label: "WhatsApp",
        icon: <MessageSquare className="h-5 w-5 text-green-600" />,
        guide: [
            "Syötä puhelinnumerosi alla olevaan kenttään",
            "Painaa 'Tilaa ilmoitukset'",
            "Vahvista tilaus WhatsApp-viestillä"
        ]
    },
    {
        id: "signal",
        label: "Signal",
        icon: <Send className="h-5 w-5 text-blue-600" />,
        guide: [
            "Syötä puhelinnumerosi alla olevaan kenttään",
            "Painaa 'Tilaa ilmoitukset'",
            "Vahvista tilaus Signal-viestillä"
        ]
    },
    {
        id: "browser",
        label: "Selainilmoitukset",
        icon: <Bell className="h-5 w-5 text-purple-600" />,
        guide: [
            "Hyväksy selainilmoitukset alla olevasta painikkeesta",
            "Valitse haluamasi alueet kartalta"
        ]
    },
    {
        id: "sms",
        label: "SMS",
        icon: <Smartphone className="h-5 w-5 text-orange-600" />,
        warning: true,
        guide: [
            "Syötä puhelinnumerosi alla olevaan kenttään",
            "Lähetä tekstiviesti sanalla LIAKAS numeroon 12345",
            "Odota aktivointiviestiä (voi kestää jopa 5 minuuttia)"
        ]
    }
]

export default function SubscribePage() {
    const [selectedOption, setSelectedOption] = useState<string>("whatsapp")
    const [phoneNumber, setPhoneNumber] = useState<string>("")
    const [termsAccepted, setTermsAccepted] = useState<boolean>(false)
    
    const selectedOptionData = options.find(option => option.id === selectedOption)
    
    return (
        <div className="w-full max-w-5xl h-[calc(100vh-4.25rem)] flex flex-col space-y-5 pb-10">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-semibold">Tilaa liukasvaroitukset</h1>
                <p className="text-muted-foreground">Valitse miten haluat vastaanottaa liukasvaroitukset Helsingissä</p>
            </div>
            
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col justify-between space-y-5">
                    <RadioGroup 
                        value={selectedOption} 
                        onValueChange={setSelectedOption}
                        className="col-span-1 space-y-3"
                    >
                        {options.map((option) => (
                            <div 
                                key={option.id} 
                                onClick={() => setSelectedOption(option.id)}
                                className="cursor-pointer"
                            >
                                <Card 
                                    className={`${selectedOption === option.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                                >
                                    <CardContent className="flex items-center space-x-5">
                                        <RadioGroupItem 
                                            value={option.id} 
                                            id={option.id} 
                                            className="h-5 w-5"
                                        />
                                        {option.icon}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center space-x-2">
                                                <Label htmlFor={option.id} className="font-medium cursor-pointer">
                                                    {option.label}
                                                </Label>
                                                {option.warning && (
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                                        Lisävaiheita
                                                    </span>
                                                )}
                                            </div>  
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </RadioGroup>
                    <div className="">
                        <h3 className="font-medium mb-2">Mitä saat:</h3>
                        <ul className="text-sm text-gray-500 space-y-1">
                        <li>• Reaaliaikaiset varoitukset liukkaista teistä</li>
                        <li>• Tiedot vaarallisimmista alueista</li>
                        <li>• Vakavuusluokitus jokaiselle varoitukselle</li>
                        <li>• Maksutonta palvelua kaikille helsinkiläisille</li>
                        </ul>
                    </div>
                </div>
                
                <Card className="w-full h-full col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 border-b pb-5">
                            {selectedOptionData?.icon}
                            <span>Tilaa {selectedOptionData?.label}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="w-full h-full flex flex-col justify-between space-y-5">
                        <ScrollArea className="h-full">
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <h3 className="font-medium">Ohjeet:</h3>
                                    <ul className="space-y-2 pl-5 list-disc">
                                        {selectedOptionData?.guide.map((step, index) => (
                                            <li key={index}>{step}</li>
                                        ))}
                                    </ul>
                                </div>
                                
                                {(selectedOption === "whatsapp" || selectedOption === "signal" || selectedOption === "sms") && (
                                    <div className="space-y-3">
                                        <Label>Puhelinnumero</Label>
                                        <div className="flex space-x-2">
                                            <Input 
                                                placeholder="+358401234567" 
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                            />
                                            <Button variant="outline">
                                                <Phone className="h-4 w-4 mr-2" />
                                                Tarkista
                                            </Button>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Lähetämme vahvistuskoodin tähän numeroon
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="space-y-5">
                            <div className="flex items-center space-x-2 leading-none">
                                <Checkbox 
                                    id="terms" 
                                    checked={termsAccepted}
                                    onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                                />
                                <Label htmlFor="terms" className="text-sm">
                                    Hyväksyn <a href="#" className="text-primary hover:underline">käyttöehdot</a> ja 
                                    <a href="#" className="text-primary hover:underline"> tietosuojaselosteen</a>
                                </Label>
                            </div>
                            
                            <Button disabled={!termsAccepted} className="w-full">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Tilaa ilmoitukset
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}