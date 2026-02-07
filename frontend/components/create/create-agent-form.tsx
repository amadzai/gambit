"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Playstyle, FirstMove } from "@/types/agent";
import { Coins } from "lucide-react";

/**
 * Form for creating a new chess agent (name, personality, playstyle, first move).
 * Uses Playstyle and FirstMove from @/types/agent. Requires wallet auth (Privy).
 */
export function CreateAgentForm() {
  const { authenticated, login } = usePrivy();
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [playstyle, setPlaystyle] = useState<Playstyle>("Balanced");
  const [firstMove, setFirstMove] = useState<FirstMove>("e4");

  const playstyles: Playstyle[] = ["Aggressive", "Defensive", "Balanced", "Chaotic", "Positional"];
  const firstMoves: FirstMove[] = ["e4", "d4", "c4", "Nf3", "g3", "b3", "f4"];

  const getPlaystyleColor = (style: Playstyle) => {
    const colors = {
      Aggressive: "bg-red-500/20 text-red-400 border-red-500/30",
      Defensive: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Balanced: "bg-green-500/20 text-green-400 border-green-500/30",
      Chaotic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      Positional: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return colors[style];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authenticated) {
      login();
      return;
    }

    // TODO: Implement blockchain transaction to create agent
    console.log({ name, personality, playstyle, firstMove });
    alert("Agent creation would happen here - blockchain integration needed!");
  };

  const isFormValid = name.trim().length > 0 && personality.trim().length > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Form */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Create Your Chess Agent</h2>
          <p className="text-muted-foreground">
            Design a unique AI chess agent with its own personality and playing style.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              placeholder="e.g., Magnus Bot, The Aggressor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/30 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personality">Personality</Label>
            <Textarea
              id="personality"
              placeholder="Describe your agent's personality and approach to chess. This will influence how the AI plays..."
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              maxLength={300}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              {personality.length}/300 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="playstyle">Playstyle</Label>
            <Select value={playstyle} onValueChange={(value) => setPlaystyle(value as Playstyle)}>
              <SelectTrigger id="playstyle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {playstyles.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {playstyle === "Aggressive" && "Favors attacking moves and tactical complications"}
              {playstyle === "Defensive" && "Focuses on solid positions and counterattacks"}
              {playstyle === "Balanced" && "Adapts between attack and defense as needed"}
              {playstyle === "Chaotic" && "Unpredictable moves that create complex positions"}
              {playstyle === "Positional" && "Long-term strategic planning and piece coordination"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstMove">Preferred First Move (as White)</Label>
            <Select value={firstMove} onValueChange={(value) => setFirstMove(value as FirstMove)}>
              <SelectTrigger id="firstMove">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {firstMoves.map((move) => (
                  <SelectItem key={move} value={move}>
                    {move}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Your agent will prefer this opening move when playing as white
            </p>
          </div>

          <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="font-semibold">Creation Cost</span>
              </div>
              <span className="text-2xl font-bold text-primary">1000 USDC</span>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!isFormValid}
          >
            {authenticated ? "Create Agent - 1000 USDC" : "Connect Wallet to Create"}
          </Button>
        </form>
      </div>

      {/* Preview Card */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Preview</h2>
          <p className="text-muted-foreground">
            See how your agent will appear on the leaderboard.
          </p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">
                  {name || "Your Agent Name"}
                </CardTitle>
                <CardDescription>
                  Starting ELO: 1500
                </CardDescription>
              </div>
              <Badge variant="outline" className={getPlaystyleColor(playstyle)}>
                {playstyle}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Personality</h4>
              <p className="text-sm text-muted-foreground">
                {personality || "Your agent's personality description will appear here..."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">First Move</p>
                <p className="text-lg font-semibold font-mono">{firstMove}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Record</p>
                <p className="text-lg font-semibold">
                  <span className="text-green-500">0</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-red-500">0</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-yellow-500">0</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
