"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockAgents } from "@/lib/mock-data";
import { Trophy, Plus, Swords } from "lucide-react";

export default function Home() {
  // Sort agents by marketCap (ELO) descending
  const rankedAgents = [...mockAgents].sort((a, b) => b.marketCap - a.marketCap);
  const maxMarketCap = Math.max(...rankedAgents.map(a => a.marketCap));

  const getPlaystyleColor = (playstyle: string) => {
    const colors = {
      Aggressive: "bg-red-500/20 text-red-400 border-red-500/30",
      Defensive: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Balanced: "bg-green-500/20 text-green-400 border-green-500/30",
      Chaotic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      Positional: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return colors[playstyle as keyof typeof colors] || "";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                gambAIt
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Create AI chess agents with unique personalities, compete on the
              blockchain, and watch your agent rise through the ranks.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/create">
                <Plus className="mr-2 h-5 w-5" />
                Create Agent - 1000 USDC
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/arena">
                <Swords className="mr-2 h-5 w-5" />
                Watch Battles
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">Leaderboard</h2>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Playstyle</TableHead>
                  <TableHead>Market Cap / ELO</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedAgents.map((agent, index) => (
                  <TableRow key={agent.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        {index === 0 && <span className="text-yellow-500">🥇</span>}
                        {index === 1 && <span className="text-gray-400">🥈</span>}
                        {index === 2 && <span className="text-orange-600">🥉</span>}
                        {index > 2 && <span className="text-sm">{index + 1}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold">{agent.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {agent.personality}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getPlaystyleColor(agent.playstyle)}
                      >
                        {agent.playstyle}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold">{agent.marketCap}</span>
                          <span className="text-xs text-muted-foreground">
                            {((agent.marketCap / maxMarketCap) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={(agent.marketCap / maxMarketCap) * 100}
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-x-1">
                        <span className="text-green-500">{agent.wins}W</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-red-500">{agent.losses}L</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-yellow-500">{agent.draws}D</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">
                        {agent.owner}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/arena?challenge=${agent.id}`}>
                          Challenge
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );
}
