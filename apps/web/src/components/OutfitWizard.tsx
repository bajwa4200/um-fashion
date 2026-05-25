"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, SkipForward, ShoppingCart, Upload, Sparkles, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useOutfit } from "./OutfitProvider";
import { DigitalTwinPanel } from "./DigitalTwinPanel";
import { OUTFIT_STEPS, OCCASION_CHIPS, CITY_CHIPS, QUICK_REPLY_CHIPS, formatCurrency } from "@um/shared";
import type { ProductRec } from "@/lib/ai";
import { resizeImageForUpload } from "@/lib/resizeImage";
import { blobToBase64 } from "@/lib/blobToBase64";
import { isDemoModeClient } from "@/lib/demo-mode-client";
import { OutfitDemoGate } from "./OutfitDemoGate";

const GEN_STEPS = [
  "Scanning your pose...",
  "Mapping your body shape...",
  "Painting your digital twin from your photo...",
  "Finalizing your 3D model...",
];

type Phase = "photo" | "generating" | "preview3d" | "chat" | "wizard" | "complete";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SelectedItem {
  productId: string;
  name: string;
  displayPrice: number;
  image: string;
  step: string;
}

export function OutfitWizard() {
  const { isOpen, closeOutfit } = useOutfit();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("photo");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [occasion, setOccasion] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [modelGlbUrl, setModelGlbUrl] = useState<string | null>(null);
  const [gender, setGender] = useState("neutral");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<ProductRec[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTryingOn, setIsTryingOn] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [genMessage, setGenMessage] = useState(GEN_STEPS[0]);
  const [genProgress, setGenProgress] = useState(0);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [savedAvatar, setSavedAvatar] = useState<{
    modelGlbUrl?: string | null;
    modelThumbnail?: string | null;
    gender?: string | null;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [rigData, setRigData] = useState<Record<string, unknown>>({});
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [dressedImageUrl, setDressedImageUrl] = useState<string | null>(null);
  const [otherCity, setOtherCity] = useState("");
  const [gpuQueueMsg, setGpuQueueMsg] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productsIndexedRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  useEffect(() => {
    if (!isOpen || sessionStatus !== "authenticated") return;
    fetch("/api/outfit/avatar")
      .then((r) => r.json())
      .then((data) => {
        if (data?.modelGlbUrl || data?.modelThumbnail) {
          setSavedAvatar(data);
        }
      })
      .catch(() => {});
  }, [isOpen, sessionStatus]);

  useEffect(() => {
    if (phase !== "generating") return;
    setGenProgress(8);
    const interval = setInterval(() => {
      setGenMessage((prev) => {
        const idx = GEN_STEPS.indexOf(prev);
        const next = GEN_STEPS[(idx + 1) % GEN_STEPS.length];
        return next;
      });
      setGenProgress((p) => Math.min(p + 12, 92));
    }, 1500);
    return () => clearInterval(interval);
  }, [phase]);

  const resetWizard = useCallback(() => {
    setPhase("photo");
    setMessages([]);
    setOccasion("");
    setLocation("");
    setAvatarUrl(null);
    setModelGlbUrl(null);
    setCurrentStepIndex(0);
    setSelectedItems([]);
    setRecommendations([]);
    setSessionId(null);
    setRigData({});
    setPhotoBase64(null);
    setDressedImageUrl(null);
    productsIndexedRef.current = false;
  }, []);

  const composeOutfit = useCallback(
    async (items: SelectedItem[]) => {
      if (!photoBase64) return;
      const wearable = items.filter((i) => i.step !== "FRAGRANCE");
      if (wearable.length === 0) return;
      try {
        const res = await fetch("/api/outfit/tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoBase64,
            rigData,
            use3d: true,
            garments: wearable.map((i) => ({ outfitStep: i.step, imageUrl: i.image })),
          }),
        });
        const data = await res.json();
        if (data.success && data.imageBase64) {
          setDressedImageUrl(`data:image/jpeg;base64,${data.imageBase64}`);
        }
      } catch {
        /* keep last dressed image */
      }
    },
    [photoBase64, rigData]
  );

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  }, []);

  const applyAvatarResult = (data: {
    success?: boolean;
    gender?: string;
    modelThumbnail?: string | null;
    baseImageUrl?: string | null;
    thumbnailBase64?: string | null;
    glbBase64?: string | null;
    modelGlbUrl?: string | null;
    message?: string;
    rigData?: Record<string, unknown>;
  }) => {
    setGender(data.gender || "neutral");
    const thumb =
      data.thumbnailBase64
        ? `data:image/jpeg;base64,${data.thumbnailBase64}`
        : previewPhotoUrl || data.modelThumbnail || data.baseImageUrl || null;
    setAvatarUrl(thumb);
    setDressedImageUrl(thumb);
    if (data.rigData) setRigData(data.rigData);

    if (data.glbBase64) {
      const blob = Uint8Array.from(atob(data.glbBase64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([blob], { type: "model/gltf-binary" }));
      setModelGlbUrl(url);
    } else if (data.modelGlbUrl) {
      setModelGlbUrl(data.modelGlbUrl);
    }

    setPhase("preview3d");
    setGenProgress(100);
    setMessages([
      {
        role: "assistant",
        content: `Digital twin tayyar! ${data.message || ""} 3D tab mein ghumao, phir Continue.`,
      },
    ]);
  };

  const pollGpuJob = async (jobId: string): Promise<boolean> => {
    for (let i = 0; i < 120; i++) {
      const res = await fetch(`/api/gpu/status/${jobId}`);
      const data = await res.json();
      if (data.status === "completed" && data.result?.success) {
        applyAvatarResult(data.result);
        setGpuQueueMsg(null);
        return true;
      }
      if (data.status === "failed") {
        setUploadError(data.error || "GPU job failed");
        setPhase("photo");
        return false;
      }
      if (!data.workerOnline) {
        setGpuQueueMsg("GPU laptop offline — job queued. Start services/gpu-laptop, then wait...");
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    setUploadError("Timed out waiting for GPU. Start your RTX laptop worker.");
    setPhase("photo");
    return false;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const localPreview = URL.createObjectURL(file);
    setPreviewPhotoUrl(localPreview);

    setPhase("generating");
    setIsLoading(true);
    setGenMessage(GEN_STEPS[0]);
    setGenProgress(5);

    try {
      const resized = await resizeImageForUpload(file);
      const b64 = await blobToBase64(resized);
      setPhotoBase64(b64);
      const formData = new FormData();
      formData.append("file", resized, "photo.jpg");

      const res = await fetch("/api/outfit/avatar", { method: "POST", body: formData });
      const data = await res.json();

      if (data.queued && data.jobId) {
        setGpuQueueMsg(data.message || "Queued for GPU laptop...");
        const ok = await pollGpuJob(data.jobId);
        if (!ok) return;
        return;
      }

      if (!data.success) {
        setUploadError(data.message || "Could not process photo. Use a clear full-body front photo.");
        setPhase("photo");
        return;
      }

      applyAvatarResult(data);
    } catch {
      setUploadError("Something went wrong. Please try again.");
      setPhase("photo");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUseSavedAvatar = () => {
    if (!savedAvatar?.modelGlbUrl) return;
    setUploadError(null);
    setGender(savedAvatar.gender || "neutral");
    setAvatarUrl(savedAvatar.modelThumbnail || null);
    setModelGlbUrl(savedAvatar.modelGlbUrl);
    setPhase("preview3d");
    setMessages([
      {
        role: "assistant",
        content: "Welcome back! Your digital twin is loaded. Rotate to check yourself out, then hit Continue.",
      },
    ]);
  };

  const handleSignIn = () => {
    closeOutfit();
    sessionStorage.setItem("outfitResume", "1");
    router.push("/login?callbackUrl=/?openOutfit=1");
  };

  const handleContinueToChat = () => {
    setPhase("chat");
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Ab kapra chunte hain! Neeche button dabao — Shadi, Office, Party, Gym. Phir shehar: Karachi, Lahore, Islamabad.",
      },
    ]);
  };

  const handleSend = async (overrideMsg?: string) => {
    const userMsg = (overrideMsg ?? input).trim();
    if (!userMsg || isLoading) return;
    setInput("");
    addMessage("user", userMsg);
    setIsLoading(true);

    if (!occasion) setOccasion(userMsg);
    const cityMatch = userMsg.match(/(?:in|at|to)\s+([A-Za-z\s]+)/i);
    if (cityMatch && !location) setLocation(cityMatch[1].trim());
    else if (!location && userMsg.length < 40) setLocation(userMsg);

    const nextMessages = [...messages, { role: "user" as const, content: userMsg }];
    let assistantText = "";

    try {
      const streamRes = await fetch("/api/outfit/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (streamRes.headers.get("content-type")?.includes("text/event-stream") && streamRes.body) {
        addMessage("assistant", "");
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const token = line.slice(6).trim();
            if (token === "[DONE]") break;
            assistantText += token;
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: assistantText };
              return copy;
            });
          }
        }
      } else {
        const data = await streamRes.json();
        assistantText = data.reply || "";
        addMessage("assistant", assistantText);
      }

      const occ = occasion || userMsg;
      const city = location || otherCity || cityMatch?.[1]?.trim() || "Karachi";
      if (occ) {
        await startWizard(occ, city);
      }
    } catch {
      addMessage("assistant", "Tell me more about where you're going twin!");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendations = async (stepIndex: number) => {
    const step = OUTFIT_STEPS[stepIndex];
    setIsLoading(true);
    setRecommendations([]);
    try {
      if (!productsIndexedRef.current) {
        fetch("/api/outfit/index-products").catch(() => {});
        productsIndexedRef.current = true;
      }
      const res = await fetch("/api/outfit/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `${occasion || "outfit"} ${step.label}`,
          outfitStep: step.key,
          occasion: occasion || "casual",
          location,
        }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch {
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startWizard = async (occ: string, city: string) => {
    setOccasion(occ);
    setLocation(city);
    setPhase("wizard");
    setCurrentStepIndex(0);
    await loadRecommendations(0);
    addMessage(
      "assistant",
      `Theek hai! Pehle ${(OUTFIT_STEPS[0] as { labelUr?: string }).labelUr || OUTFIT_STEPS[0].label} chuno — neeche tap karo.`
    );
  };

  const handleSelectProduct = async (product: ProductRec) => {
    const step = OUTFIT_STEPS[currentStepIndex];
    if (step.key === "FRAGRANCE") {
      setSelectedItems((prev) => [
        ...prev.filter((i) => i.step !== step.key),
        {
          productId: product.id,
          name: product.name,
          displayPrice: product.displayPrice,
          image: product.image,
          step: step.key,
        },
      ]);
      addMessage("assistant", `${product.name} — great pick! Fragrance try-on nahi, sirf suggestion.`);
      const next = currentStepIndex + 1;
      if (next >= OUTFIT_STEPS.length) {
        setPhase("complete");
        return;
      }
      setCurrentStepIndex(next);
      await loadRecommendations(next);
      return;
    }
    setIsTryingOn(true);
    const newItems: SelectedItem[] = [
      ...selectedItems.filter((i) => i.step !== step.key),
      {
        productId: product.id,
        name: product.name,
        displayPrice: product.displayPrice,
        image: product.image,
        step: step.key,
      },
    ];
    setSelectedItems(newItems);
    await composeOutfit(newItems);
    setIsTryingOn(false);
    const next = currentStepIndex + 1;
    if (next >= OUTFIT_STEPS.length) {
      setPhase("complete");
      return;
    }
    setCurrentStepIndex(next);
    await loadRecommendations(next);
  };

  const goToNextStep = async () => {
    const next = currentStepIndex + 1;
    if (next >= OUTFIT_STEPS.length) {
      setPhase("complete");
      return;
    }
    setCurrentStepIndex(next);
    await loadRecommendations(next);
  };

  const handleAddToCart = async () => {
    for (const item of selectedItems) {
      await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId, quantity: 1 }),
      });
    }
    closeOutfit();
    resetWizard();
    router.push("/cart");
  };

  const total = selectedItems.reduce((s, i) => s + i.displayPrice, 0);

  if (!isOpen) return null;

  if (sessionStatus === "loading") {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-12 h-12 border-2 border-violet-500 border-t-cyan-400 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="glass rounded-2xl p-8 max-w-md text-center glow-violet relative">
            <button
              onClick={closeOutfit}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Make Your Outfit</h2>
            <p className="text-gray-400 mb-6">
              Sign in to create your digital twin and try clothes on in 3D
            </p>
            <button
              onClick={handleSignIn}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const demoMode = isDemoModeClient();

  if (demoMode) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed inset-3 md:inset-8 glass rounded-3xl overflow-hidden flex flex-col glow-violet"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-violet-400" />
                <h2 className="font-display text-xl font-bold text-gradient">Make Your Outfit</h2>
              </div>
              <button
                onClick={() => {
                  closeOutfit();
                  resetWizard();
                }}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <OutfitDemoGate />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md">
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed inset-3 md:inset-8 glass rounded-3xl overflow-hidden flex flex-col glow-violet">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-violet-400" />
              <h2 className="font-display text-xl font-bold text-gradient">Make Your Outfit</h2>
            </div>
            <button onClick={() => { closeOutfit(); resetWizard(); }} className="p-2 hover:bg-white/10 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="lg:w-2/5 p-4 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/20 flex flex-col">
              {phase === "photo" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Upload className="w-16 h-16 text-violet-400 mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">Create your digital twin</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Full-body, front-facing photo — we build a 3D you to try clothes on
                  </p>
                  {uploadError && (
                    <p className="text-red-400 text-sm mb-4 max-w-xs">{uploadError}</p>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium mb-3"
                  >
                    Upload Photo
                  </button>
                  {savedAvatar?.modelGlbUrl && (
                    <button
                      onClick={handleUseSavedAvatar}
                      className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Use my existing digital twin
                    </button>
                  )}
                </div>
              )}
              {phase === "generating" && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 w-full">
                  {previewPhotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewPhotoUrl}
                      alt="Your photo"
                      className="w-24 h-36 object-cover rounded-xl mb-4 border border-violet-500/40 opacity-90"
                    />
                  )}
                  <h3 className="font-display text-lg font-bold text-gradient mb-1">Creating your digital twin</h3>
                  <p className="text-gray-400 text-sm mb-4">So you can try clothes on in 3D</p>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-14 h-14 border-2 border-violet-500 border-t-cyan-400 rounded-full mb-4"
                  />
                  <p className="text-gray-300 text-sm mb-3">{gpuQueueMsg || genMessage}</p>
                  <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                      initial={{ width: "5%" }}
                      animate={{ width: `${genProgress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>
              )}
              {(phase === "preview3d" || phase === "chat" || phase === "wizard" || phase === "complete") && (
                <>
                  <DigitalTwinPanel
                    dressedImageUrl={dressedImageUrl}
                    basePhotoUrl={avatarUrl}
                    modelGlbUrl={modelGlbUrl}
                    isTryingOn={isTryingOn}
                    className="flex-1"
                  />
                  {phase === "preview3d" && (
                    <button onClick={handleContinueToChat}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium">
                      Agla — Kapra chuno <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-violet-600/30" : "glass"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && phase !== "generating" && (
                  <div className="text-sm text-gray-400 animate-pulse">Styling...</div>
                )}
                <div ref={chatEndRef} />
              </div>

              {phase === "chat" && (
                <div className="p-4 border-t border-white/10 space-y-3">
                  <p className="text-xs text-gray-500 text-center">Kahan ja rahe ho? (tap karo)</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {OCCASION_CHIPS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => startWizard(c.value, location || "Karachi")}
                        className="px-4 py-2 rounded-full glass hover:bg-violet-600/40 text-sm font-medium"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">Shehar</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {CITY_CHIPS.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setLocation(city)}
                        className={`px-3 py-1.5 rounded-full text-xs ${
                          location === city ? "bg-cyan-600 text-white" : "glass text-gray-300"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                  <input
                    value={otherCity}
                    onChange={(e) => setOtherCity(e.target.value)}
                    placeholder="Aur shehar..."
                    className="w-full px-3 py-2 glass rounded-lg text-sm bg-transparent"
                  />
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_REPLY_CHIPS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => void handleSend(c.text)}
                        className="px-3 py-1 rounded-full glass text-xs hover:bg-violet-600/30"
                      >
                        {c.text}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Ya likho: Shadi Karachi"
                      className="flex-1 px-4 py-3 glass rounded-xl bg-transparent text-sm"
                    />
                    <button onClick={() => void handleSend()} disabled={isLoading} className="p-3 rounded-xl bg-violet-600">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {phase === "wizard" && (
                <div className="p-4 border-t border-white/10">
                  <p className="text-sm font-medium text-violet-300 mb-2">
                    {OUTFIT_STEPS[currentStepIndex]?.icon}{" "}
                    {(OUTFIT_STEPS[currentStepIndex] as { labelUr?: string; label: string } | undefined)
                      ?.labelUr || OUTFIT_STEPS[currentStepIndex]?.label}
                  </p>
                  {isLoading ? (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-28 h-28 glass rounded-xl animate-pulse flex-shrink-0" />
                      ))}
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {recommendations.map((p) => (
                        <button key={p.id} onClick={() => handleSelectProduct(p)}
                          className="flex-shrink-0 w-28 glass rounded-xl p-2 hover:glow-cyan text-left">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt="" className="w-full h-20 object-contain rounded-lg mb-1 bg-white/90" />
                          <p className="text-xs line-clamp-1">{p.name}</p>
                          <p className="text-xs text-cyan-400">{formatCurrency(p.displayPrice)}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-400/90 py-2 text-center">
                      No items loaded — tap Skip or try again. Marketplace: /shop/CLOTHING
                    </p>
                  )}
                  <button onClick={goToNextStep} className="mt-2 flex items-center gap-1 text-sm text-gray-400 mx-auto hover:text-white">
                    <SkipForward className="w-4 h-4" /> Skip / Agla
                  </button>
                </div>
              )}

              {phase === "complete" && (
                <div className="p-4 border-t border-white/10">
                  <button onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium">
                    <ShoppingCart className="w-5 h-5" /> Cart mein daalo — {formatCurrency(total)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
