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
        <div className="w-full max-w-5xl mx-auto min-h-screen flex flex-col p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <h1 className="text-2xl md:text-3xl font-semibold">Tilaa liukasvaroitukset</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    Valitse miten haluat vastaanottaa liukasvaroitukset Helsingissä
                </p>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left Column - Options & Benefits */}
                <div className="flex flex-col space-y-4 md:space-y-6 lg:col-span-1">
                    {/* Option Selection */}
                    <div>
                        <h2 className="font-medium mb-3 text-sm md:text-base">Valitse tapa:</h2>
                        <RadioGroup 
                            value={selectedOption} 
                            onValueChange={setSelectedOption}
                            className="space-y-2 md:space-y-3"
                        >
                            {options.map((option) => (
                                <div 
                                    key={option.id} 
                                    onClick={() => setSelectedOption(option.id)}
                                    className="cursor-pointer"
                                >
                                    <Card 
                                        className={`transition-colors ${
                                            selectedOption === option.id 
                                                ? "border-primary bg-primary/5" 
                                                : "hover:bg-muted/50"
                                        }`}
                                    >
                                        <CardContent className="p-3 md:p-4 flex items-center space-x-3">
                                            <RadioGroupItem 
                                                value={option.id} 
                                                id={option.id} 
                                                className="h-4 w-4 md:h-5 md:w-5"
                                            />
                                            <div className="flex-shrink-0">
                                                {option.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <Label 
                                                        htmlFor={option.id} 
                                                        className="font-medium cursor-pointer text-sm md:text-base truncate"
                                                    >
                                                        {option.label}
                                                    </Label>
                                                    {option.warning && (
                                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
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
                    </div>
                    
                    {/* Benefits */}
                    <div className="order-last lg:order-none">
                        <h3 className="font-medium mb-3 text-sm md:text-base">Mitä saat:</h3>
                        <ul className="text-xs md:text-sm text-muted-foreground space-y-1.5 md:space-y-2">
                            <li>• Reaaliaikaiset varoitukset liukkaista teistä</li>
                            <li>• Tiedot vaarallisimmista alueista</li>
                            <li>• Vakavuusluokitus jokaiselle varoitukselle</li>
                            <li>• Maksutonta palvelua kaikille helsinkiläisille</li>
                        </ul>
                    </div>
                </div>
                
                {/* Right Column - Setup Form */}
                <Card className="lg:col-span-2 flex flex-col">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                            {selectedOptionData?.icon}
                            <span>Tilaa {selectedOptionData?.label}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col space-y-4 md:space-y-6">
                        {/* Instructions */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-sm md:text-base">Ohjeet:</h3>
                            <ul className="space-y-2 pl-4 md:pl-5 list-disc text-sm">
                                {selectedOptionData?.guide.map((step, index) => (
                                    <li key={index}>{step}</li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* Phone Number Input */}
                        {(selectedOption === "whatsapp" || selectedOption === "signal" || selectedOption === "sms") && (
                            <div className="space-y-3">
                                <Label className="text-sm md:text-base">Puhelinnumero</Label>
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                    <Input 
                                        placeholder="+358401234567" 
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button variant="outline" className="sm:flex-shrink-0">
                                        <Phone className="h-4 w-4 mr-2" />
                                        Tarkista
                                    </Button>
                                </div>
                                <p className="text-xs md:text-sm text-muted-foreground">
                                    Lähetämme vahvistuskoodin tähän numeroon
                                </p>
                            </div>
                        )}
                        
                        {/* Terms and Submit */}
                        <div className="mt-auto space-y-4">
                            <div className="flex items-start space-x-2">
                                <Checkbox 
                                    id="terms" 
                                    checked={termsAccepted}
                                    onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                                    className="mt-0.5 flex-shrink-0"
                                />
                                <Label htmlFor="terms" className="text-xs md:text-sm leading-relaxed">
                                    Hyväksyn{" "}
                                    <a href="#" className="text-primary hover:underline">
                                        käyttöehdot
                                    </a>
                                    {" "}ja{" "}
                                    <a href="#" className="text-primary hover:underline">
                                        tietosuojaselosteen
                                    </a>
                                </Label>
                            </div>
                            
                            <Button 
                                disabled={!termsAccepted} 
                                className="w-full h-12 text-sm md:text-base"
                            >
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