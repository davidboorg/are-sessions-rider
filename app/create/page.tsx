"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Upload, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { getRiderParser } from "@/lib/rider-parser";
import { ParsedRider } from "@/types";

function CreateRiderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "manual";
  const isKiosk = searchParams.get("kiosk") === "true";

  const [riderText, setRiderText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRider, setParsedRider] = useState<ParsedRider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"input" | "review">("input");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick tips as chips
  const quickTips = [
    "Vegan",
    "Glutenfritt",
    "Nötallergi",
    "Alkoholfritt",
    "Energi",
    "Lyx",
    "Budget",
    "Protein",
    "Cozy",
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    // For PDF files, show a message to paste text instead
    if (file.type === "application/pdf") {
      alert(
        "PDF-uppladdning: Vänligen öppna din PDF och klistra in texten nedan istället. (Full PDF-parsning kommer snart!)"
      );
      return;
    }

    // For text files, read content
    if (file.type === "text/plain") {
      const text = await file.text();
      setRiderText(text);
    }
  };

  const handleQuickTip = (tip: string) => {
    setRiderText((prev) => prev + (prev ? ", " : "") + tip.toLowerCase());
  };

  const handleParse = async () => {
    if (!riderText.trim()) {
      alert("Vänligen skriv in din rider först!");
      return;
    }

    setIsLoading(true);
    try {
      const parser = getRiderParser();
      const parsed = await parser.parse(riderText);
      setParsedRider(parsed);
      setStep("review");
    } catch (error) {
      console.error("Parse error:", error);
      alert("Kunde inte tolka ridern. Försök igen!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!parsedRider) return;
    // Store in sessionStorage for next step
    sessionStorage.setItem("parsedRider", JSON.stringify(parsedRider));
    router.push(`/build${isKiosk ? "?kiosk=true" : ""}`);
  };

  const togglePreference = (pref: string) => {
    if (!parsedRider) return;
    const prefs = parsedRider.preferences;
    if (prefs.includes(pref)) {
      setParsedRider({
        ...parsedRider,
        preferences: prefs.filter((p) => p !== pref),
      });
    } else {
      setParsedRider({
        ...parsedRider,
        preferences: [...prefs, pref],
      });
    }
  };

  const toggleAllergen = (allergen: string) => {
    if (!parsedRider) return;
    const allergens = parsedRider.allergensAvoid;
    if (allergens.includes(allergen)) {
      setParsedRider({
        ...parsedRider,
        allergensAvoid: allergens.filter((a) => a !== allergen),
      });
    } else {
      setParsedRider({
        ...parsedRider,
        allergensAvoid: [...allergens, allergen],
      });
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-festival-light via-white to-festival-secondary/10 ${isKiosk ? "kiosk-mode" : ""}`}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push(`/${isKiosk ? "?mode=kiosk" : ""}`)}
            className="mb-4"
          >
            ← Tillbaka
          </Button>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
            {step === "input" ? "Din Rider" : "Granska & Justera"}
          </h1>
          <p className="text-lg text-gray-600">
            {step === "input"
              ? mode === "upload"
                ? "Ladda upp din rider eller skriv in den"
                : "Berätta vad du vill ha i din rider"
              : "Vi uppfattade följande – justera om det behövs"}
          </p>
        </motion.div>

        {step === "input" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* File Upload */}
            {mode === "upload" && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 py-6"
                >
                  {uploadedFile ? (
                    <>
                      <FileText size={24} />
                      <span>{uploadedFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} />
                      <span>Välj fil (.txt eller .pdf)</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Text Input */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <label className="block font-semibold text-gray-900 mb-3">
                Rider-text:
              </label>
              <textarea
                value={riderText}
                onChange={(e) => setRiderText(e.target.value)}
                placeholder="T.ex: Jag vill ha energidryck, proteinbars, vego-alternativ. Jag är laktos- och glutenintolerant. Behöver mat för 3 personer. Budget: medium. Vibe: cozy och warm."
                className="w-full h-40 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-festival-primary focus:outline-none resize-none"
              />
            </div>

            {/* Quick Tips */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <label className="block font-semibold text-gray-900 mb-3">
                Snabbtips - lägg till med ett klick:
              </label>
              <div className="flex flex-wrap gap-2">
                {quickTips.map((tip) => (
                  <Chip
                    key={tip}
                    label={tip}
                    variant="default"
                    onClick={() => handleQuickTip(tip)}
                  />
                ))}
              </div>
            </div>

            {/* Parse Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleParse}
              loading={isLoading}
              disabled={!riderText.trim()}
            >
              Tolka min rider →
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {parsedRider && (
              <>
                {/* Preferences */}
                {parsedRider.preferences.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="font-bold text-lg mb-3">Preferenser:</h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedRider.preferences.map((pref) => (
                        <Chip
                          key={pref}
                          label={pref}
                          variant="primary"
                          removable
                          onRemove={() => togglePreference(pref)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergens */}
                {parsedRider.allergensAvoid.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="font-bold text-lg mb-3">Allergener att undvika:</h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedRider.allergensAvoid.map((allergen) => (
                        <Chip
                          key={allergen}
                          label={allergen}
                          variant="warning"
                          removable
                          onRemove={() => toggleAllergen(allergen)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {parsedRider.categoriesWanted.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="font-bold text-lg mb-3">Kategorier:</h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedRider.categoriesWanted.map((cat) => (
                        <Chip key={cat} label={cat} variant="secondary" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Vibe Tags */}
                {parsedRider.vibeTags.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="font-bold text-lg mb-3">Vibe:</h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedRider.vibeTags.map((vibe) => (
                        <Chip key={vibe} label={vibe} variant="success" />
                      ))}
                    </div>
                  </div>
                )}

                {/* People Count & Budget */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {parsedRider.peopleCount && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Antal personer:</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {parsedRider.peopleCount}
                        </p>
                      </div>
                    )}
                    {parsedRider.budgetTier && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Budgetnivå:</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {"💰".repeat(parsedRider.budgetTier)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep("input")}
                    className="flex-1"
                  >
                    ← Ändra
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleContinue}
                    className="flex-1"
                  >
                    Fortsätt till produkter →
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-12 w-12 border-4 border-festival-primary border-t-transparent rounded-full"></div></div>}>
      <CreateRiderContent />
    </Suspense>
  );
}

