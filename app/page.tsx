"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { CelebrityCard } from "@/components/CelebrityCard";
import { Upload, PenLine, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import celebrityRidersData from "@/data/celebrity-riders.json";
import { CelebrityRider } from "@/types";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isKioskMode = searchParams.get("mode") === "kiosk";
  const [celebrities] = useState<CelebrityRider[]>(celebrityRidersData as CelebrityRider[]);

  // Kiosk mode: auto-reset after inactivity
  useEffect(() => {
    if (!isKioskMode) return;

    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        router.push("/?mode=kiosk");
        window.location.reload();
      }, 60000); // 60 seconds
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isKioskMode, router]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-festival-light via-white to-festival-accent/20 ${isKioskMode ? "kiosk-mode" : ""}`}>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-4">
            Rider Builder
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-2">
            Åre Sessions 2025
          </p>
          <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto">
            Skapa din perfekta festival rider och matcha den med rätt produkter
          </p>
        </motion.div>

        {/* Main Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push(`/create?mode=upload${isKioskMode ? "&kiosk=true" : ""}`)}
            className="flex flex-col items-center gap-3 py-8"
          >
            <Upload size={40} />
            <div>
              <div className="font-bold text-xl">Ladda upp rider</div>
              <div className="text-sm opacity-90">Text eller PDF-fil</div>
            </div>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push(`/create?mode=manual${isKioskMode ? "&kiosk=true" : ""}`)}
            className="flex flex-col items-center gap-3 py-8"
          >
            <PenLine size={40} />
            <div>
              <div className="font-bold text-xl">Skriv själv</div>
              <div className="text-sm opacity-90">Berätta vad du vill ha</div>
            </div>
          </Button>
        </motion.div>

        {/* Celebrity Riders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-festival-accent" size={28} />
            <h2 className="text-3xl font-bold text-gray-900">
              Prova en celebrity rider
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {celebrities.map((celebrity) => (
              <CelebrityCard
                key={celebrity.id}
                celebrity={celebrity}
                onClick={() => router.push(`/celebrity/${celebrity.id}${isKioskMode ? "?kiosk=true" : ""}`)}
              />
            ))}
          </div>
        </motion.div>

        {/* Kiosk Mode QR Code Info */}
        {isKioskMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg p-6 text-center"
          >
            <p className="text-gray-600 mb-2">
              🔄 Automatisk återställning efter 60 sekunders inaktivitet
            </p>
            <p className="text-sm text-gray-500">
              Din rider får en QR-kod som du kan öppna i din mobil
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 text-sm text-gray-500"
        >
          <p>
            Rider Builder för Åre Sessions • En kreativ upplevelse för festivalen
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-festival-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

