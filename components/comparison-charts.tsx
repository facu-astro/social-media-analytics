"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"

interface PeriodStats {
  period: string
  startDate: string
  endDate: string
  impressions: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
}

interface ComparisonChartsProps {
  currentStats: PeriodStats[]
  previousStats: PeriodStats[]
}

export function ComparisonCharts({ currentStats, previousStats }: ComparisonChartsProps) {
  // Aggregate data across all profiles
  const aggregateStats = (stats: PeriodStats[]) => {
    return stats.reduce((acc, stat) => ({
      impressions: acc.impressions + (isNaN(stat.impressions) ? 0 : stat.impressions),
      likes: acc.likes + (isNaN(stat.likes) ? 0 : stat.likes),
      comments: acc.comments + (isNaN(stat.comments) ? 0 : stat.comments),
      shares: acc.shares + (isNaN(stat.shares) ? 0 : stat.shares),
      engagement_rate: acc.engagement_rate + (isNaN(stat.engagement_rate) ? 0 : stat.engagement_rate)
    }), { impressions: 0, likes: 0, comments: 0, shares: 0, engagement_rate: 0 })
  }

  const currentAgg = aggregateStats(currentStats)
  const previousAgg = aggregateStats(previousStats)

  // Average engagement rate (handle division by zero)
  currentAgg.engagement_rate = currentStats.length > 0 ? currentAgg.engagement_rate / currentStats.length : 0
  previousAgg.engagement_rate = previousStats.length > 0 ? previousAgg.engagement_rate / previousStats.length : 0

  // Create normalized comparison data for better visualization
  const comparisonData = [
    {
      metric: "Impressions",
      current: currentAgg.impressions,
      previous: previousAgg.impressions,
    },
    {
      metric: "Likes", 
      current: currentAgg.likes,
      previous: previousAgg.likes,
    },
    {
      metric: "Comments",
      current: currentAgg.comments,
      previous: previousAgg.comments,
    },
    {
      metric: "Shares",
      current: currentAgg.shares,
      previous: previousAgg.shares,
    },
  ]

  const engagementData = [
    { 
      period: `${previousStats[0]?.startDate} to ${previousStats[0]?.endDate}`, 
      rate: previousAgg.engagement_rate 
    },
    { 
      period: `${currentStats[0]?.startDate} to ${currentStats[0]?.endDate}`, 
      rate: currentAgg.engagement_rate 
    },
  ]

  const currentEngagementBreakdown = [
    { name: "Likes", value: currentAgg.likes, color: "var(--chart-2)" },
    { name: "Comments", value: currentAgg.comments, color: "var(--chart-3)" },
    { name: "Shares", value: currentAgg.shares, color: "var(--chart-4)" },
  ]

  const chartConfig = {
    current: {
      label: `${currentStats[0]?.startDate} to ${currentStats[0]?.endDate}`,
      color: "var(--chart-1)",
    },
    previous: {
      label: `${previousStats[0]?.startDate} to ${previousStats[0]?.endDate}`,
      color: "var(--muted-foreground)",
    },
  }

  // Custom tick formatter for better readability
  const formatTick = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  return (
    <section className="space-section">
      <div className="space-tight">
        <h2 className="text-heading-1 text-foreground">Quarter Comparison</h2>
        <p className="text-body text-foreground-secondary">
          Detailed comparison between {currentStats[0]?.startDate} to {currentStats[0]?.endDate} and {previousStats[0]?.startDate} to {previousStats[0]?.endDate}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Metrics Comparison Bar Chart */}
        <Card className="col-span-1 lg:col-span-2 surface-primary border-2 shadow-lg">
          <CardHeader className="space-tight">
            <CardTitle className="text-heading-2 text-foreground">Metrics Comparison</CardTitle>
            <CardDescription className="text-body-small text-foreground-secondary">
              Side-by-side comparison of key performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="metric" className="text-foreground-secondary" />
                  <YAxis 
                    className="text-foreground-secondary" 
                    tickFormatter={formatTick}
                    scale="log"
                    domain={['dataMin', 'dataMax']}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value) => [formatTick(Number(value)), '']}
                    />} 
                  />
                  <Bar dataKey="previous" fill="var(--color-previous)" name={chartConfig.previous.label} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" fill="var(--color-current)" name={chartConfig.current.label} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Engagement Rate Trend */}
        <Card className="surface-primary border-2 shadow-lg">
          <CardHeader className="space-tight">
            <CardTitle className="text-heading-3 text-foreground">Engagement Rate Trend</CardTitle>
            <CardDescription className="text-body-small text-foreground-secondary">
              Engagement rate comparison over periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="period" className="text-foreground-secondary" />
                  <YAxis className="text-foreground-secondary" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--color-current)"
                    strokeWidth={4}
                    dot={{ fill: "var(--color-current)", strokeWidth: 2, r: 8 }}
                    activeDot={{ r: 10, stroke: "var(--color-current)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Current Quarter Engagement Breakdown */}
        <Card className="surface-primary border-2 shadow-lg">
          <CardHeader className="space-tight">
            <CardTitle className="text-heading-3 text-foreground">Engagement Breakdown</CardTitle>
            <CardDescription className="text-body-small text-foreground-secondary">
              {currentStats[0]?.startDate} to {currentStats[0]?.endDate} engagement distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentEngagementBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={8}
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
            <div className="flex justify-center gap-6 mt-6">
              {currentEngagementBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-body-small text-foreground font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="surface-success border-2 shadow-lg">
          <CardHeader className="space-tight">
            <CardTitle className="text-heading-3 text-foreground">Best Performing Metric</CardTitle>
          </CardHeader>
          <CardContent className="space-tight">
            <div className="text-heading-1 font-bold text-success mb-2">
              {
                comparisonData.reduce((best, current) => {
                  const currentGrowth = ((current.current - current.previous) / current.previous) * 100
                  const bestGrowth = ((best.current - best.previous) / best.previous) * 100
                  return currentGrowth > bestGrowth ? current : best
                }).metric
              }
            </div>
            <p className="text-body-small text-foreground-secondary">Highest growth rate this period</p>
          </CardContent>
        </Card>

        <Card className="surface-primary border-2 shadow-lg">
          <CardHeader className="space-tight">
            <CardTitle className="text-heading-3 text-foreground">Total Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-tight">
            <div className="text-heading-1 font-bold text-chart-1 mb-2">
              {(currentAgg.likes + currentAgg.comments + currentAgg.shares).toLocaleString()}
            </div>
            <p className="text-body-small text-foreground-secondary">Combined likes, comments, and shares</p>
          </CardContent>
        </Card>

        <Card className="surface-primary border-2 shadow-lg">
          <CardHeader className="space-tight">
            <CardTitle className="text-heading-3 text-foreground">Reach Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="space-tight">
            <div className="text-heading-1 font-bold text-chart-5 mb-2">
              {(
                ((currentAgg.likes + currentAgg.comments + currentAgg.shares) / currentAgg.impressions) *
                100
              ).toFixed(2)}
              %
            </div>
            <p className="text-body-small text-foreground-secondary">Engagement per impression</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
