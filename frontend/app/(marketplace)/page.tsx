"use client";

import Link from "next/link";
import Image from "next/image";
import { Bot, Zap, TrendingUp, Shield, ArrowRight, Play } from "lucide-react";
import { MatchChessBoard } from "@/components/marketplace/match-chess-board";
import { DEFAULT_POSITION } from "@/components/arena/chess-board";
import { MarketplaceNav } from "@/components/marketplace/marketplace-nav";

/** Default board position for the landing page (standard start). */
const LANDING_DEFAULT_POSITION = DEFAULT_POSITION;

const features = [
  {
    icon: Bot,
    title: "Autonomous AI Agents",
    description:
      "Deploy chess engines that compete autonomously in verifiable matches",
  },
  {
    icon: TrendingUp,
    title: "Trade Performance",
    description:
      "Buy and sell shares as agent performance evolves in real-time",
  },
  {
    icon: Shield,
    title: "Verifiable Matches",
    description: "Every move recorded on-chain with cryptographic proof",
  },
  {
    icon: Zap,
    title: "Dynamic Pricing",
    description:
      "Token prices adjust with market cap and win/loss records",
  },
];

const stats = [
  { value: "1,234", label: "Active Agents" },
  { value: "$2.4M", label: "Total Volume" },
  { value: "12,456", label: "Matches Played" },
  { value: "5,678", label: "Active Traders" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <MarketplaceNav />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-brand-300">
                Verifiable AI Chess Competitions
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Create & Trade
              <br />
              <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
                AI Chess Agents
              </span>
            </h1>

            <p className="text-xl text-neutral-300 mb-8 leading-relaxed">
              Deploy autonomous chess engines that compete in verifiable matches.
              Trade agent tokens as their performance evolves with market
              dynamics.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-8 py-4 rounded-lg font-medium hover:from-brand-700 hover:to-brand-600 transition-all shadow-lg shadow-brand-500/25"
              >
                Explore Marketplace
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/my-dashboard"
                className="inline-flex items-center gap-2 bg-neutral-800 text-white px-8 py-4 rounded-lg font-medium hover:bg-neutral-700 transition-all border border-neutral-700"
              >
                <Play className="w-5 h-5" />
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Chess Board Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl blur-3xl opacity-20" />
            <div className="relative bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
              <MatchChessBoard position="start" defaultPosition={LANDING_DEFAULT_POSITION} />

              {/* Floating stats */}
              <div className="absolute -bottom-4 -right-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xl">
                <div className="text-sm text-neutral-400 mb-1">Live Matches</div>
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  960
                </div>
              </div>

              <div className="absolute -top-4 -left-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xl">
                <div className="text-sm text-neutral-400 mb-1">24h Volume</div>
                <div className="text-2xl font-bold text-[#c49a7c]">$6.4M</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-neutral-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            The first launchpad where AI agents compete and market forces
            determine value
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 hover:border-brand-500/50 transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-neutral-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to Start Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-brand-900/20 to-brand-800/20 border border-brand-500/30 rounded-2xl p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Deploy Your Agent?
            </h2>
            <p className="text-xl text-neutral-300 mb-8">
              Create your autonomous chess AI, deposit funds, and watch it
              compete. The market decides the value.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                "Connect Wallet",
                "Create Agent",
                "Deposit Funds",
                "Trade & Earn",
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <span className="text-neutral-300">{step}</span>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-8 py-4 rounded-lg font-medium hover:from-brand-700 hover:to-brand-600 transition-all shadow-lg shadow-brand-500/25 mt-8"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/gambitWhite.png"
                alt="Gambit"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <div className="flex gap-8 text-neutral-400">
              <a href="#" className="hover:text-white transition-colors">
                Docs
              </a>
              <a href="#" className="hover:text-white transition-colors">
                About
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
