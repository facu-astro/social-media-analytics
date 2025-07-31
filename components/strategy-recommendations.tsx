"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lightbulb, TrendingUp, Target, Users, Calendar, Download, Copy } from "lucide-react"
import { useState } from "react"

interface StrategyRecommendationsProps {
  strategies: string[]
}

export function StrategyRecommendations({ strategies }: StrategyRecommendationsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopyStrategy = async (strategy: string, index: number) => {
    try {
      await navigator.clipboard.writeText(strategy)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy strategy:", err)
    }
  }

  const handleExportStrategies = () => {
    const strategiesText = strategies.map((strategy, index) => `${index + 1}. ${strategy}`).join("\n\n")

    const blob = new Blob([strategiesText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "social-media-strategies.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const strategyCategories = [
    { icon: TrendingUp, label: "Growth", color: "bg-green-100 text-green-800" },
    { icon: Target, label: "Engagement", color: "bg-blue-100 text-blue-800" },
    { icon: Users, label: "Community", color: "bg-purple-100 text-purple-800" },
    { icon: Calendar, label: "Content", color: "bg-orange-100 text-orange-800" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            AI Strategy Recommendations
          </h2>
          <p className="text-slate-600">Personalized strategies based on your quarterly performance analysis</p>
        </div>
        <Button onClick={handleExportStrategies} variant="outline" className="flex items-center gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export Strategies
        </Button>
      </div>

      {/* Strategy Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {strategyCategories.map((category, index) => {
          const Icon = category.icon
          return (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <Icon className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <Badge className={category.color}>{category.label}</Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Strategy Cards */}
      <div className="space-y-4">
        {strategies.map((strategy, index) => (
          <Card key={index} className="relative group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    #{index + 1}
                  </span>
                  Strategy Recommendation
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyStrategy(strategy, index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy className="h-4 w-4" />
                  {copiedIndex === index ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed">{strategy}</p>

              {/* Action Items */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Target className="h-4 w-4" />
                  <span className="font-medium">Implementation Priority:</span>
                  <Badge variant={index < 2 ? "default" : index < 4 ? "secondary" : "outline"}>
                    {index < 2 ? "High" : index < 4 ? "Medium" : "Low"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Implementation Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Suggested Implementation Timeline
          </CardTitle>
          <CardDescription>Recommended order and timeline for implementing these strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-green-900">Week 1-2: Quick Wins</h4>
                <p className="text-green-700 text-sm">
                  Implement high-priority strategies that can show immediate results
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Week 3-6: Content Strategy</h4>
                <p className="text-blue-700 text-sm">Develop and launch medium-priority content initiatives</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
              <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-purple-900">Week 7-12: Long-term Growth</h4>
                <p className="text-purple-700 text-sm">Focus on sustainable, long-term engagement strategies</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Track Your Progress</CardTitle>
          <CardDescription>Monitor these key metrics to measure strategy effectiveness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium">Engagement Rate</h4>
              <p className="text-sm text-slate-600">Target: +15% increase</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium">Follower Growth</h4>
              <p className="text-sm text-slate-600">Target: +20% increase</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-medium">Reach</h4>
              <p className="text-sm text-slate-600">Target: +25% increase</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
