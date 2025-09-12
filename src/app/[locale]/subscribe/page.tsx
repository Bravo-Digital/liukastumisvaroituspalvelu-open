"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { MessageSquare, Smartphone, Bell, Send, CheckCircle, Phone, ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"


export default function SubscribePage() {
    
    const [selectedOption, setSelectedOption] = useState<string>("sms")
    const [phoneNumber, setPhoneNumber] = useState<string>("")
    const [termsAccepted, setTermsAccepted] = useState<boolean>(false)
    const [showVerification, setShowVerification] = useState<boolean>(false)
    const [verificationCode, setVerificationCode] = useState<string>("")
    const t = useTranslations("subscribe")
    const options = [
        /*
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
            id: "browser",
            label: "Selainilmoitukset",
            icon: <Bell className="h-5 w-5 text-purple-600" />,
            guide: [
                "Hyväksy selainilmoitukset alla olevasta painikkeesta",
            ]
        }, */
        {
            id: "sms",
            label: t("options.sms.label"),
            icon: <Smartphone className="h-5 w-5 text-orange-600" />,
            warning: true,
            guide: [
                [t("options.sms.guide.step1"), { bold: t("options.sms.guide.step1a") }],
                [t("options.sms.guide.step2"), { bold: t("options.sms.guide.step2a") }],
                [t("options.sms.guide.step3"), { bold: t("options.sms.guide.step3a") }]
            ]
        }
    ]
    
    const selectedOptionData = options.find(option => option.id === selectedOption)
    
    const handlePhoneSubmit = () => {
        if (phoneNumber.trim()) {
            setShowVerification(true)
        }
    }
    
    const handleBackToPhone = () => {
        setShowVerification(false)
        setVerificationCode("")
    }
    
    return (
        <div className="w-full max-w-5xl min-h-[calc(100vh-76px)] mx-auto mt-6 flex flex-col p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-2 flex-shrink-0">
                <h1 className="text-2xl md:text-3xl font-semibold">{t("title")}</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                {t("subtitle")}
                </p>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-6 min-h-0">
                {/* Left Column - Options & Benefits */}
                <div className="flex flex-col space-y-4 md:space-y-6 md:col-span-1 flex-shrink-0">
                    {/* Option Selection */}
                    <div>
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
                                                </div>  
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </div>
                
                {/* Right Column - Setup Form */}
                <Card className="lg:col-span-2 flex flex-col min-h-0">
                    <CardHeader className="pb-4 flex-shrink-0">
                        <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
                            {selectedOptionData?.icon}
                            <span>{t("subscribeWith")} {selectedOptionData?.label}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col space-y-4 md:space-y-6 min-h-0">
                        {/* Instructions */}
                        <div className="space-y-3 flex-shrink-0">
                            <h3 className="font-medium text-sm md:text-base">{t("instructions")}</h3>
                            <ul className="space-y-4 pl-4 md:pl-5 text-sm">
  {selectedOptionData?.guide.map((step, index) => (
    <li key={index} className="flex flex-col space-y-1">
      {Array.isArray(step) ? (
        <div className="flex flex-wrap gap-1 items-center">
          {step.map((part: string | { bold: string }, i: number) =>
            typeof part === "string" ? (
              <span key={i}>{part}</span>
            ) : (
              <span
                key={i}
                className="bg-gray-800 text-white px-2 py-1 rounded-lg font-semibold"
              >
                {part.bold}
              </span>
            )
          )}
        </div>
      ) : (
        <span>{step}</span>
      )}
    </li>
  ))}
</ul>

                        </div>
                        
                        {/* Phone Number Input or Verification Code 
                        {(selectedOption === "whatsapp") && (
                            <div className="space-y-3 flex-shrink-0">
                                {!showVerification ? (
                                    <>
                                        <Label className="text-sm md:text-base">Puhelinnumero</Label>
                                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                            <Input 
                                                placeholder="+358401234567" 
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                className="flex-1"
                                            />
                                            <Button 
                                                variant="outline" 
                                                className="sm:flex-shrink-0"
                                                onClick={handlePhoneSubmit}
                                                disabled={!phoneNumber.trim()}
                                            >
                                                <Phone className="h-4 w-4 mr-2" />
                                                Lähetä koodi
                                            </Button>
                                        </div>
                                        <p className="text-xs md:text-sm text-muted-foreground">
                                            Lähetämme vahvistuskoodin tähän numeroon
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={handleBackToPhone}
                                                className="p-1"
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                            </Button>
                                            <Label className="text-sm md:text-base">Syötä vahvistuskoodi</Label>
                                        </div>
                                        <div className="flex flex-col items-center space-y-4">
                                            <InputOTP 
                                                maxLength={6} 
                                                value={verificationCode}
                                                onChange={(value) => setVerificationCode(value)}
                                            >
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={0} />
                                                    <InputOTPSlot index={1} />
                                                    <InputOTPSlot index={2} />
                                                    <InputOTPSlot index={3} />
                                                    <InputOTPSlot index={4} />
                                                    <InputOTPSlot index={5} />
                                                </InputOTPGroup>
                                            </InputOTP>
                                            <div className="text-center">
                                                <p className="text-xs md:text-sm text-muted-foreground mb-2">
                                                    Lähetimme koodin numeroon {phoneNumber}
                                                </p>
                                                <Button variant="link" size="sm" className="text-xs">
                                                    Lähetä koodi uudelleen
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        */}

{/* Terms and Submit 
{selectedOption !== "sms" && (
  <div className="mt-auto space-y-4 flex-shrink-0">
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
        <a href="./gdpr" className="text-primary hover:underline">
          tietosuojaselosteen
        </a>
      </Label>
    </div>
    
    <Button 
      disabled={!termsAccepted || (showVerification && verificationCode.length !== 6)} 
      className="w-full h-12 text-sm md:text-base"
    >
      <CheckCircle className="h-4 w-4 mr-2" />
      {showVerification ? "Vahvista koodi" : "Tilaa ilmoitukset"}
    </Button>
  </div>
)} */}

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}