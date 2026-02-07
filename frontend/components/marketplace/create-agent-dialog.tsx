"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import type { CreateAgentPlaystyle } from "@/types/agent";

/** Payload passed to CreateAgentDialog onSubmit. Matches schema: playstyle, opening?, personality?, profileImage?. */
export interface CreateAgentDialogSubmitPayload {
  playstyle: CreateAgentPlaystyle;
  opening?: string;
  personality?: string;
  profileImage?: string;
}

/**
 * Props for the create-agent modal. Control visibility with open/onClose; optionally handle submit with onSubmit.
 */
export interface CreateAgentDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the dialog should close (e.g. overlay or X). */
  onClose: () => void;
  /** Optional. Called when "Create Agent & Deploy" is clicked. If returns a Promise, dialog closes after it resolves. */
  onSubmit?: (payload: CreateAgentDialogSubmitPayload) => void | Promise<void>;
}

const PLAYSTYLES: { value: CreateAgentPlaystyle; name: string; desc: string }[] = [
  { value: "AGGRESSIVE", name: "Aggressive", desc: "High-risk, high-reward tactics" },
  { value: "DEFENSIVE", name: "Defensive", desc: "Focus on solid positioning" },
  { value: "POSITIONAL", name: "Positional", desc: "Long-term strategic play" },
];

const DEFAULT_PLAYSTYLE: CreateAgentPlaystyle = "AGGRESSIVE";

/**
 * Modal for creating a new agent (playstyle, opening?, personality?, profileImage?). Use open/onClose; optional onSubmit to handle create.
 */
export function CreateAgentDialog({ open, onClose, onSubmit }: CreateAgentDialogProps) {
  const [playstyle, setPlaystyle] = useState<CreateAgentPlaystyle>(DEFAULT_PLAYSTYLE);
  const [opening, setOpening] = useState("");
  const [personality, setPersonality] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const handleClose = () => {
    setPlaystyle(DEFAULT_PLAYSTYLE);
    setOpening("");
    setPersonality("");
    setProfileImage("");
    onClose();
  };

  const handleSubmit = async () => {
    const payload: CreateAgentDialogSubmitPayload = {
      playstyle,
      opening: opening.trim() || undefined,
      personality: personality.trim() || undefined,
      profileImage: profileImage.trim() || undefined,
    };
    if (onSubmit) {
      const result = onSubmit(payload);
      if (result instanceof Promise) {
        await result;
      }
      handleClose();
    } else {
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 relative">
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
            <p className="text-sm text-slate-400">
              Launch your autonomous chess AI
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Playstyle <span className="text-slate-500">(required)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PLAYSTYLES.map((strat) => (
                <button
                  key={strat.value}
                  type="button"
                  onClick={() => setPlaystyle(strat.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    playstyle === strat.value
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div className="font-medium text-white mb-1">{strat.name}</div>
                  <div className="text-xs text-slate-400">{strat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Opening <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="e.g. e4, Sicilian Defense"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Personality <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Describe your agent's style or character..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profile Image <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="url"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
            <p className="text-sm text-violet-200">
              Your agent will be trained and deployed to compete in verifiable
              matches. Token holders can trade shares as performance evolves.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3.5 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25"
          >
            Create Agent & Deploy
          </button>
        </div>
      </div>
    </div>
  );
}
