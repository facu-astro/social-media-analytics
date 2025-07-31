"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"

interface QuarterStats {
  quarter: string
  impressions: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
}

interface ComparisonChartsProps {
  currentStats: QuarterStats
  previousStats: QuarterStats
}

export function ComparisonCharts({ currentStats, previousStats }: ComparisonChartsProps) {
  const comparisonData = [
    {
      metric: "Impressions",
      current: currentStats.impressions,
      previous: previousStats.impressions,
    },
    {
      metric: "Likes",
      current: currentStats.likes,
      previous: previousStats.likes,
    },
    {
      metric: "Comments",
      current: currentStats.comments,
      previous: previousStats.comments,
    },
    {
      metric: "Shares",
      current: currentStats.shares,
      previous: previousStats.shares,
    },
  ]

  const engagementData = [
    { quarter: previousStats.quarter, rate: previousStats.engagement_rate },
    { quarter: currentStats.quarter, rate: currentStats.engagement_rate },
  ]

  const currentEngagementBreakdown = [
    { name: "Likes", value: currentStats.likes, color: "#ef4444" },
    { name: "Comments", value: currentStats.comments, color: "#22c55e" },
    { name: "Shares", value: currentStats.shares, color: "#a855f7" },
  ]

  const chartConfig = {
    current: {
      label: currentStats.quarter,
      color: "#3b82f6",
    },
    previous: {
      label: previousStats.quarter,
      color: "#94a3b8",
    },
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Quarter Comparison</h2>
        <p className="text-slate-600">
          Detailed comparison between {currentStats.quarter} and {previousStats.quarter}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metrics Comparison Bar Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Metrics Comparison</CardTitle>
            <CardDescription>Side-by-side comparison of key performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="previous" fill="var(--color-previous)" name={previousStats.quarter} />
                  <Bar dataKey="current" fill="var(--color-current)" name={currentStats.quarter} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Engagement Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Rate Trend</CardTitle>
            <CardDescription>Engagement rate comparison over quarters</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--color-current)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-current)", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Current Quarter Engagement Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Breakdown</CardTitle>
            <CardDescription>{currentStats.quarter} engagement distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentEngagementBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {currentEngagementBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="flex justify-center gap-4 mt-4">
              {currentEngagementBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Performing Metric</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {
                comparisonData.reduce((best, current) => {
                  const currentGrowth = ((current.current - current.previous) / current.previous) * 100
                  const bestGrowth = ((best.current - best.previous) / best.previous) * 100
                  return currentGrowth > bestGrowth ? current : best
                }).metric
              }
            </div>
            <p className="text-sm text-slate-600">Highest growth rate this quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {(currentStats.likes + currentStats.comments + currentStats.shares).toLocaleString()}
            </div>
            <p className="text-sm text-slate-600">Combined likes, comments, and shares</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reach Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {(
                ((currentStats.likes + currentStats.comments + currentStats.shares) / currentStats.impressions) *
                100
              ).toFixed(2)}
              %
            </div>
            <p className="text-sm text-slate-600">Engagement per impression</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
