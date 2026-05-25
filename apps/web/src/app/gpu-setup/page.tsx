import Link from "next/link";
import { Laptop, Download, Play, Wifi, HelpCircle, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "GPU Laptop Setup — UM Fashion",
  description: "Step-by-step guide to enable 3D outfit stylist on your RTX 4060 laptop",
};

export default function GpuSetupPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <p className="text-cyan-400 text-sm font-medium tracking-widest uppercase mb-2">
        Optional — advanced
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient mb-4">
        3D outfit stylist on your laptop
      </h1>
      <p className="text-gray-400 mb-8 leading-relaxed">
        The website demo works without this. When you are ready for photo upload, 3D digital twin,
        and AI stylist, follow these steps on a Windows laptop with an{" "}
        <strong className="text-white">NVIDIA RTX 4060</strong> graphics card.
      </p>

      <section className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-violet-400" />
          What you need
        </h2>
        <ul className="text-gray-300 space-y-2 text-sm list-disc list-inside">
          <li>Windows 10 or 11</li>
          <li>NVIDIA RTX 4060 (8 GB) — gaming laptop is fine</li>
          <li>Internet and about 30 GB free disk space</li>
          <li>The UM GPU folder from your developer (see below)</li>
        </ul>
      </section>

      <section className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-cyan-400" />
          Step 1 — Install these programs (one time)
        </h2>
        <ol className="space-y-4 text-sm text-gray-300">
          <li>
            <strong className="text-white">NVIDIA drivers</strong> — Open{" "}
            <a
              href="https://www.nvidia.com/download/index.aspx"
              className="text-cyan-400 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              nvidia.com/download
            </a>
            , download for your laptop, install, restart the PC.
          </li>
          <li>
            <strong className="text-white">Python 3.12</strong> — Open{" "}
            <a
              href="https://www.python.org/downloads/"
              className="text-cyan-400 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              python.org/downloads
            </a>
            , run installer, tick <strong>Add python.exe to PATH</strong>, finish.
          </li>
          <li>
            <strong className="text-white">Ollama</strong> — Open{" "}
            <a
              href="https://ollama.com/download"
              className="text-cyan-400 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ollama.com/download
            </a>
            , install for Windows, open the Ollama app once.
          </li>
        </ol>
      </section>

      <section className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <Laptop className="w-5 h-5 text-violet-400" />
          Step 2 — Copy the UM GPU folder
        </h2>
        <p className="text-gray-300 text-sm mb-3">
          Your developer will send a folder named <code className="text-cyan-300">gpu-laptop</code>.
          Copy it to <code className="text-cyan-300">C:\UM-GPU</code> (or any easy location).
        </p>
        <p className="text-gray-400 text-sm">
          Inside you will find <strong>CLIENT-SETUP-GUIDE.md</strong> (full printable guide) and{" "}
          <strong>START-HERE.txt</strong>.
        </p>
      </section>

      <section className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-green-400" />
          Step 3 — One-time setup
        </h2>
        <ol className="space-y-3 text-sm text-gray-300 list-decimal list-inside">
          <li>Open the GPU folder in File Explorer.</li>
          <li>Right-click <strong>setup.ps1</strong> → Run with PowerShell.</li>
          <li>If Windows warns you, click More info → Run anyway.</li>
          <li>Wait until it says setup is complete (several minutes).</li>
        </ol>
      </section>

      <section className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl font-semibold mb-4">Step 4 — Download AI models in Ollama</h2>
        <p className="text-gray-300 text-sm mb-3">Open the Ollama app and download:</p>
        <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
          <li>
            Model: <strong>llama3.1:8b</strong>
          </li>
          <li>
            Model: <strong>nomic-embed-text</strong>
          </li>
        </ul>
      </section>

      <section className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl font-semibold mb-4">Step 5 — Every day you use 3D stylist</h2>
        <p className="text-gray-300 text-sm">
          Double-click <strong>run.ps1</strong> in the GPU folder. Leave the black window open while
          you use Make Your Outfit on the website.
        </p>
      </section>

      <section className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-amber-400" />
          Step 6 — Connect to the live website (developer helps)
        </h2>
        <p className="text-gray-300 text-sm">
          Only when your developer asks: they will give you a secret code and help you run a small
          tunnel program so the website can reach your laptop. Send them the https link that
          appears — you do not need to understand coding.
        </p>
      </section>

      <section className="glass rounded-2xl p-6 mb-8">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-gray-400" />
          Problems?
        </h2>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>Black window closes instantly → reinstall Python with Add to PATH checked.</li>
          <li>Ollama error → open Ollama app and wait until it shows Running.</li>
          <li>3D still not on website → laptop must stay on; run.ps1 must stay open.</li>
        </ul>
        <p className="text-sm text-gray-500 mt-4">
          Send your developer a screenshot of any red error text in the black window.
        </p>
      </section>

      <Link
        href="/"
        className="inline-flex px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium"
      >
        Back to marketplace
      </Link>
    </div>
  );
}
