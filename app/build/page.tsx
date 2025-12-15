"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { BalanceMeter } from "@/components/BalanceMeter";
import { Chip } from "@/components/Chip";
import { Search, ShoppingCart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ParsedRider, Product, CartProduct } from "@/types";
import productsData from "@/data/products.json";
import { getRecommendedProducts, calculateCartBalance } from "@/lib/scoring";

function BuildRiderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isKiosk = searchParams.get("kiosk") === "true";

  const [parsedRider, setParsedRider] = useState<ParsedRider | null>(null);
  const [products] = useState<Product[]>(productsData as Product[]);
  const [cart, setCart] = useState<CartProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("parsedRider");
    if (stored) {
      setParsedRider(JSON.parse(stored));
    } else {
      router.push("/");
    }
  }, [router]);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const recommendations = useMemo(() => {
    if (!parsedRider) return [];
    return getRecommendedProducts(products, parsedRider, 10);
  }, [parsedRider, products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const rec = recommendations.find((r) => r.product.id === product.id);
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          reason: rec?.reasons[0] || "Bra val!",
        },
      ]);
    }
  };

  const removeFromCart = (productId: string) => {
    const existing = cart.find((item) => item.product.id === productId);
    if (existing && existing.quantity > 1) {
      setCart(
        cart.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      setCart(cart.filter((item) => item.product.id !== productId));
    }
  };

  const cartProductIds = cart.map((item) => item.product.id);
  const cartProducts = cart.flatMap((item) =>
    Array(item.quantity).fill(item.product)
  );
  const balance = calculateCartBalance(cartProducts);

  const handleFinish = () => {
    sessionStorage.setItem("cart", JSON.stringify(cart));
    router.push(`/card${isKiosk ? "?kiosk=true" : ""}`);
  };

  if (!parsedRider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-festival-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isKiosk ? "kiosk-mode" : ""}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/create")}
              className="mb-2"
            >
              ← Tillbaka
            </Button>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900">
              Bygg din rider
            </h1>
            <p className="text-gray-600">
              Välj produkter som matchar dina preferenser
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCart(!showCart)}
            className="relative"
          >
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-festival-accent text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search & Filters */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Sök produkter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-festival-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip
                  label="Alla"
                  variant={selectedCategory === null ? "primary" : "default"}
                  onClick={() => setSelectedCategory(null)}
                />
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    variant={selectedCategory === cat ? "primary" : "default"}
                    onClick={() => setSelectedCategory(cat)}
                  />
                ))}
              </div>
            </div>

            {/* Top Picks */}
            {!searchQuery && !selectedCategory && recommendations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  🌟 Topp-rekommendationer för dig
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 6).map((rec) => (
                    <ProductCard
                      key={rec.product.id}
                      product={rec.product}
                      onAdd={addToCart}
                      isAdded={cartProductIds.includes(rec.product.id)}
                      matchReasons={rec.reasons}
                      score={rec.score}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Products */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {searchQuery || selectedCategory
                  ? "Sökresultat"
                  : "Alla produkter"}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                    isAdded={cartProductIds.includes(product.id)}
                  />
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <p className="text-center text-gray-500 py-12">
                  Inga produkter hittades. Prova en annan sökning.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Balance Meter */}
            {cart.length > 0 && <BalanceMeter {...balance} />}

            {/* Cart Summary */}
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
              <h3 className="font-bold text-lg mb-3">Din korg</h3>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  Ingen produkt tillagd än
                </p>
              ) : (
                <>
                  <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.quantity}x
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:bg-red-50 rounded p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Totalt produkter:</span>
                      <span className="font-bold">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleFinish}
                      size="lg"
                    >
                      Skapa Rider Card →
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cart Overlay */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Din korg</h2>
                <button onClick={() => setShowCart(false)}>
                  <X size={24} />
                </button>
              </div>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                  Ingen produkt tillagd än
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.quantity}x • {item.product.brand}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:bg-red-100 rounded p-2"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button variant="primary" fullWidth onClick={handleFinish}>
                    Skapa Rider Card →
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BuildPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-12 w-12 border-4 border-festival-primary border-t-transparent rounded-full"></div></div>}>
      <BuildRiderContent />
    </Suspense>
  );
}

