"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { CelebrityRider, Product } from "@/types";
import celebrityRidersData from "@/data/celebrity-riders.json";
import productsData from "@/data/products.json";

export default function CelebrityRiderPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isKiosk = searchParams.get("kiosk") === "true";

  const [celebrity, setCelebrity] = useState<CelebrityRider | null>(null);
  const [products] = useState<Product[]>(productsData as Product[]);

  useEffect(() => {
    const celebs = celebrityRidersData as CelebrityRider[];
    const celeb = celebs.find((c) => c.id === params.id);
    if (celeb) {
      setCelebrity(celeb);
    } else {
      router.push("/");
    }
  }, [params.id, router]);

  if (!celebrity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-festival-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const suggestedProducts = products.filter((p) =>
    celebrity.suggestedProducts.includes(p.id)
  );

  const handleUseSame = () => {
    sessionStorage.setItem("parsedRider", JSON.stringify(celebrity.parsedRider));
    router.push(`/build${isKiosk ? "?kiosk=true" : ""}`);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-festival-light via-white to-festival-secondary/10 ${isKiosk ? "kiosk-mode" : ""}`}>
      <div className="max-w-5xl mx-auto px-4 py-8">
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
        </motion.div>

        {/* Celebrity Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-festival-primary/10 to-festival-secondary/10 rounded-2xl p-8 mb-8 border-2 border-festival-primary/30"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-festival-primary to-festival-secondary flex items-center justify-center">
              <Sparkles className="text-white" size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">
                {celebrity.name}
              </h1>
              <p className="text-lg text-gray-600">{celebrity.handle}</p>
              <p className="text-lg font-semibold text-festival-primary">
                {celebrity.vibe}
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">{celebrity.description}</p>

          <div className="bg-white/60 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 mb-2">Preferenser:</h3>
            <div className="flex flex-wrap gap-2">
              {celebrity.parsedRider.preferences.map((pref) => (
                <span
                  key={pref}
                  className="bg-festival-primary text-white px-3 py-1 rounded-full text-sm"
                >
                  {pref}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-gray-900 mb-2">Vibe:</h3>
            <div className="flex flex-wrap gap-2">
              {celebrity.parsedRider.vibeTags.map((vibe) => (
                <span
                  key={vibe}
                  className="bg-festival-secondary text-white px-3 py-1 rounded-full text-sm"
                >
                  {vibe}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500 italic mb-4">
            {celebrity.disclaimer}
          </p>

          <Button variant="primary" size="lg" fullWidth onClick={handleUseSame}>
            Använd samma vibe och bygg min rider →
          </Button>
        </motion.div>

        {/* Suggested Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Rekommenderade produkter
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {suggestedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

