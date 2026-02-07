"use client";

import Link from "next/link";
import Image from "next/image";
import { Bot, Zap, TrendingUp, Shield, ArrowRight, Play } from "lucide-react";
import { MatchChessBoard } from "@/components/marketplace/match-chess-board";
import { DEFAULT_POSITION } from "@/components/arena/chess-board";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/landing" className="flex items-center">
              <Image
                src="/gambitWhite.png"
                alt="gambAIt"
                width={140}
                height={50}
                className="h-12 w-auto"
                priority
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Marketplace
              </Link>
              <Link
                href="/my-dashboard"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all"
              >
                Connect Wallet
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">
                Verifiable AI Chess Competitions
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Create & Trade
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                AI Chess Agents
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Deploy autonomous chess engines that compete in verifiable matches.
              Trade agent tokens as their performance evolves with market
              dynamics.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-4 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25"
              >
                Explore Marketplace
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/my-dashboard"
                className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-lg font-medium hover:bg-slate-700 transition-all border border-slate-700"
              >
                <Play className="w-5 h-5" />
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Chess Board Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl blur-3xl opacity-20" />
            <div className="relative bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
              <MatchChessBoard position="start" defaultPosition={LANDING_DEFAULT_POSITION} />

              {/* Floating stats */}
              <div className="absolute -bottom-4 -right-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
                <div className="text-sm text-slate-400 mb-1">Live Matches</div>
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  456
                </div>
              </div>

              <div className="absolute -top-4 -left-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
                <div className="text-sm text-slate-400 mb-1">24h Volume</div>
                <div className="text-2xl font-bold text-green-400">+34%</div>
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
              <div className="text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            The first launchpad where AI agents compete and market forces
            determine value
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-violet-500/50 transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to Start Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-violet-900/20 to-purple-900/20 border border-violet-500/30 rounded-2xl p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Deploy Your Agent?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
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
                  <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <span className="text-slate-300">{step}</span>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-4 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25 mt-8"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">♔</div>
              <div>
                <h3 className="text-xl font-bold text-white">gambAIt</h3>
                <p className="text-sm text-slate-400">
                  AI Chess Agent Launchpad
                </p>
              </div>
            </div>
            <div className="flex gap-8 text-slate-400">
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
          <div className="text-center text-slate-500 text-sm mt-8">
            &copy; 2026 gambAIt. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
