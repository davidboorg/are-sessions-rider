"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Download, Share2, QrCode, Home } from "lucide-react";
import { motion } from "framer-motion";
import { ParsedRider, CartProduct, CelebrityRider } from "@/types";
import { toPng } from "html-to-image";
import celebrityRidersData from "@/data/celebrity-riders.json";
import { calculateCelebrityMatchScore } from "@/lib/scoring";

function RiderCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isKiosk = searchParams.get("kiosk") === "true";

  const [parsedRider, setParsedRider] = useState<ParsedRider | null>(null);
  const [cart, setCart] = useState<CartProduct[]>([]);
  const [celebrities] = useState<CelebrityRider[]>(celebrityRidersData as CelebrityRider[]);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedRider = sessionStorage.getItem("parsedRider");
    const storedCart = sessionStorage.getItem("cart");

    if (storedRider) {
      const rider = JSON.parse(storedRider);
      setParsedRider(rider);

      // Calculate match scores with celebrities
      const scores: Record<string, number> = {};
      celebrities.forEach((celeb) => {
        const match = calculateCelebrityMatchScore(rider, celeb.parsedRider);
        scores[celeb.id] = match.total;
      });
      setMatchScores(scores);
    }

    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }

    if (!storedRider || !storedCart) {
      router.push("/");
    }
  }, [router, celebrities]);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `are-sessions-rider-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Kunde inte generera bild. Försök igen!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Min Åre Sessions Rider",
          text: "Kolla in min festival rider!",
          url: shareUrl,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert("Länk kopierad till urklipp!");
    }
  };

  if (!parsedRider || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-festival-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const topProducts = cart.slice(0, 6);
  const allAllergens = Array.from(
    new Set(cart.flatMap((item) => item.product.allergens))
  );

  const bestMatch = Object.entries(matchScores).reduce((best, [id, score]) => {
    if (score > (best.score || 0)) {
      return { id, score };
    }
    return best;
  }, {} as { id?: string; score?: number });

  return (
    <div className={`min-h-screen bg-gray-50 ${isKiosk ? "kiosk-mode" : ""}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
            Din Rider Card! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Spara, dela eller skanna din rider
          </p>
        </motion.div>

        {/* Rider Card */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-white via-festival-light to-festival-accent/20 rounded-2xl shadow-2xl p-8 mb-8 border-4 border-festival-primary"
        >
          {/* Card Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-gray-900 mb-1">
              MIN RIDER
            </h2>
            <p className="text-xl font-bold text-festival-primary">
              Åre Sessions 2025
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {new Date().toLocaleDateString("sv-SE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Vibe Tags */}
          {parsedRider.vibeTags.length > 0 && (
            <div className="mb-6 text-center">
              <p className="text-sm font-semibold text-gray-600 mb-2">VIBE</p>
              <div className="flex flex-wrap justify-center gap-2">
                {parsedRider.vibeTags.map((vibe) => (
                  <span
                    key={vibe}
                    className="bg-festival-secondary text-white px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top Products */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-600 mb-3 text-center">
              TOPP PRODUKTER
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {topProducts.map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-200"
                >
                  <p className="font-bold text-sm text-gray-900 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {item.product.brand}
                  </p>
                  <p className="text-xs text-festival-primary mt-1">
                    {item.quantity}x
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-black text-festival-primary">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
              <p className="text-xs text-gray-600 font-medium">Produkter</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-festival-primary">
                {parsedRider.peopleCount || 1}
              </p>
              <p className="text-xs text-gray-600 font-medium">Personer</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-festival-primary">
                {"💰".repeat(parsedRider.budgetTier || 2)}
              </p>
              <p className="text-xs text-gray-600 font-medium">Budget</p>
            </div>
          </div>

          {/* Allergens */}
          {allAllergens.length > 0 && (
            <div className="mb-6 bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-sm font-semibold text-orange-900 mb-2">
                ⚠️ ALLERGENER I KORGEN
              </p>
              <p className="text-xs text-orange-800">
                {allAllergens.join(", ")}
              </p>
            </div>
          )}

          {/* Celebrity Match */}
          {bestMatch.id && bestMatch.score && (
            <div className="bg-gradient-to-r from-festival-primary/10 to-festival-secondary/10 rounded-lg p-4 border-2 border-festival-primary/30">
              <p className="text-sm font-semibold text-gray-900 mb-2 text-center">
                🌟 CELEBRITY MATCH
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg text-gray-900">
                    {celebrities.find((c) => c.id === bestMatch.id)?.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {celebrities.find((c) => c.id === bestMatch.id)?.vibe}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-festival-primary">
                    {bestMatch.score}%
                  </p>
                  <p className="text-xs text-gray-600">matchning</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4 mb-6"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={handleDownload}
            loading={isGenerating}
            className="flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Spara som bild
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleShare}
            className="flex items-center justify-center gap-2"
          >
            <Share2 size={20} />
            Dela länk
          </Button>
        </motion.div>

        {/* Kiosk QR Code */}
        {isKiosk && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-md p-6 text-center"
          >
            <QrCode size={48} className="mx-auto mb-4 text-festival-primary" />
            <h3 className="font-bold text-lg mb-2">
              Scanna för att öppna i din mobil
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              (QR-kod kommer här i produktionsversion)
            </p>
            <p className="text-xs text-gray-500">
              Kopiera denna URL: {window.location.href.replace("?kiosk=true", "")}
            </p>
          </motion.div>
        )}

        {/* Start Over */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.clear();
              router.push(`/${isKiosk ? "?mode=kiosk" : ""}`);
            }}
            className="flex items-center justify-center gap-2 mx-auto"
          >
            <Home size={20} />
            Skapa ny rider
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export default function CardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-12 w-12 border-4 border-festival-primary border-t-transparent rounded-full"></div></div>}>
      <RiderCardContent />
    </Suspense>
  );
}

