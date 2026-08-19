import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Zap,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function IndexPage() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">ProductReady</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Shopify App
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#install" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all font-semibold shadow-sm">
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Generation AI Product Readiness Platform
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
            Make Every Product Page <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">
              Ready to Convert & Sell
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            ProductReady audits your Shopify catalog using intelligent AI analysis. Detect missing specs, verify legal & shipping policies, optimize imagery, and showcase storefront trust widgets that boost buyer confidence.
          </p>

          {/* Installation Form */}
          {showForm && (
            <div id="install" className="max-w-md mx-auto p-6 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-2xl backdrop-blur-xl mb-16">
              <h2 className="text-base font-semibold text-white mb-2">Connect your Shopify store</h2>
              <p className="text-xs text-slate-400 mb-4">Enter your .myshopify.com domain to install or sign in</p>
              <Form method="post" action="/auth/login" className="flex flex-col gap-3">
                <div className="relative text-left">
                  <input
                    type="text"
                    name="shop"
                    placeholder="your-store-name.myshopify.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>Install / Log In to App</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Form>
            </div>
          )}

          {/* Key Value Pillars */}
          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-8">
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant AI Readiness Score</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Comprehensive 0-100 score analyzing product title completeness, bullet points, spec tables, media quality, and buyer objection points.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Policy & Trust Auditing</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Automatically verifies refund, shipping, and privacy policy clarity against Shopify standard merchant policies to remove purchase doubts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Storefront Trust Widget</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                High-converting, customizable product trust badges and AI summary widgets that integrate seamlessly with your Shopify theme.
              </p>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-16 px-6 border-t border-slate-800/80 bg-slate-950/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">How ProductReady Works</h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Get actionable product enhancements in seconds with three simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-4">1</div>
                <h4 className="font-semibold text-white mb-2">1. Connect Your Catalog</h4>
                <p className="text-xs text-slate-400">Install ProductReady to securely sync your Shopify product listings and store policies.</p>
              </div>

              <div className="flex flex-col items-center text-center p-6">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm mb-4">2</div>
                <h4 className="font-semibold text-white mb-2">2. Run AI Analysis</h4>
                <p className="text-xs text-slate-400">Our AI identifies content gaps, missing dimensions, material details, and weak product claims.</p>
              </div>

              <div className="flex flex-col items-center text-center p-6">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm mb-4">3</div>
                <h4 className="font-semibold text-white mb-2">3. Optimize & Convert</h4>
                <p className="text-xs text-slate-400">Apply AI-suggested improvements and display real-time buyer trust badges on your storefront.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>ProductReady &copy; {new Date().getFullYear()} &mdash; All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Embedded Shopify App</span>
            <span>GDPR / CCPA Compliant</span>
            <span>Shopify App Bridge Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

