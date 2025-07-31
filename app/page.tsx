"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Loader2, BarChart3 } from "lucide-react"
import { StatsCards } from "@/components/stats-cards"
import { ComparisonCharts } from "@/components/comparison-charts"
import { StrategyRecommendations } from "@/components/strategy-recommendations"

interface QuarterStats {
  quarter: string
  impressions: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
}

interface ApiError {
  type: "missing_keys" | "invalid_keys" | "rate_limit" | "network" | "unknown"
  message: string
}

export default function Dashboard() {
  const [profileId, setProfileId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentStats, setCurrentStats] = useState<QuarterStats | null>(null)
  const [previousStats, setPreviousStats] = useState<QuarterStats | null>(null)
  const [strategies, setStrategies] = useState<string[]>([])
  const [error, setError] = useState<ApiError | null>(null)
  const [hasData, setHasData] = useState(false)

  // Replace the existing placeholder functions with these actual API integrations
  const fetchQuarterStats = async (profileId: string, quarter: string): Promise<QuarterStats> => {
    const response = await fetch("/api/sprout-social/stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profileId, quarter }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to fetch stats")
    }

    return response.json()
  }

  const generateStrategies = async (currentStats: QuarterStats, previousStats: QuarterStats): Promise<string[]> => {
    const response = await fetch("/api/openai/strategies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentStats, previousStats }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to generate strategies")
    }

    const data = await response.json()
    return data.strategies
  }

  const validateApiKeys = async (): Promise<boolean> => {
    const response = await fetch("/api/validate-keys")

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "API key validation failed")
    }

    return true
  }

  const handleAnalyze = async () => {
    if (!profileId.trim()) {
      setError({ type: "unknown", message: "Please enter a valid Sprout Social profile ID" })
      return
    }

    setIsLoading(true)
    setError(null)
    setHasData(false)

    try {
      // Validate API keys first
      await validateApiKeys()

      // Fetch current and previous quarter data
      const [current, previous] = await Promise.all([
        fetchQuarterStats(profileId, "Q4 2024"),
        fetchQuarterStats(profileId, "Q3 2024"),
      ])

      setCurrentStats(current)
      setPreviousStats(previous)

      // Generate AI strategies
      const aiStrategies = await generateStrategies(current, previous)
      setStrategies(aiStrategies)

      setHasData(true)
    } catch (err: any) {
      if (err.message.includes("API keys")) {
        setError({
          type: "missing_keys",
          message: "Missing or invalid API keys. Please check your Sprout Social and OpenAI API configurations.",
        })
      } else if (err.message.includes("rate limit")) {
        setError({
          type: "rate_limit",
          message: "API rate limit exceeded. Please wait a few minutes before trying again.",
        })
      } else {
        setError({
          type: "unknown",
          message: "An unexpected error occurred. Please try again.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Social Media Analytics Dashboard</h1>
          <p className="text-slate-600 text-lg">
            Analyze your quarterly performance and get AI-powered strategy recommendations
          </p>
        </div>

        {/* Profile Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Get Started
            </CardTitle>
            <CardDescription>Enter your Sprout Social profile ID to analyze your quarterly performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="profileId">Sprout Social Profile ID</Label>
                <Input
                  id="profileId"
                  placeholder="e.g., 12345678"
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAnalyze} disabled={isLoading || !profileId.trim()} className="px-8">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Performance"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {hasData && currentStats && previousStats && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="comparison">Quarter Comparison</TabsTrigger>
              <TabsTrigger value="strategies">AI Strategies</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <StatsCards currentStats={currentStats} previousStats={previousStats} />
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              <ComparisonCharts currentStats={currentStats} previousStats={previousStats} />
            </TabsContent>

            <TabsContent value="strategies" className="space-y-6">
              <StrategyRecommendations strategies={strategies} />
            </TabsContent>
          </Tabs>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-slate-600">Analyzing your social media performance...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasData && !isLoading && !error && (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Analyze Your Performance</h3>
              <p className="text-slate-600">
                Enter your Sprout Social profile ID above to get started with your quarterly analysis
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
