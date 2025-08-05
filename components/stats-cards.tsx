"use client"

import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Target, Globe, MessageSquare } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface PeriodStats {
  period: string
  startDate: string
  endDate: string
  impressions: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
  profileId: string
  profileName: string
}

interface StatsCardsProps {
  currentStats: PeriodStats[]
  previousStats: PeriodStats[]
}

const getPlatformIcon = (profileName: string) => {
  const name = profileName.toLowerCase()
  if (name.includes('facebook') || name.includes('fb')) return Globe
  if (name.includes('twitter') || name.includes('x.com')) return MessageCircle
  if (name.includes('instagram') || name.includes('ig')) return Eye
  if (name.includes('linkedin') || name.includes('li')) return Target
  if (name.includes('youtube') || name.includes('yt')) return Heart
  return MessageSquare
}

export function StatsCards({ currentStats, previousStats }: StatsCardsProps) {
  // Aggregate stats across all profiles
  const aggregateStats = (stats: PeriodStats[]) => {
    return stats.reduce((acc, stat) => ({
      impressions: acc.impressions + stat.impressions,
      likes: acc.likes + stat.likes,
      comments: acc.comments + stat.comments,
      shares: acc.shares + stat.shares,
      engagement_rate: acc.engagement_rate + stat.engagement_rate
    }), { impressions: 0, likes: 0, comments: 0, shares: 0, engagement_rate: 0 })
  }

  const currentAgg = aggregateStats(currentStats)
  const previousAgg = aggregateStats(previousStats)
  
  // Average engagement rate (handle division by zero)
  currentAgg.engagement_rate = currentStats.length > 0 ? currentAgg.engagement_rate / currentStats.length : 0
  previousAgg.engagement_rate = previousStats.length > 0 ? previousAgg.engagement_rate / previousStats.length : 0

  const calculateChange = (current: number, previous: number) => {
    if (isNaN(current) || isNaN(previous) || previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const formatNumber = (num: number) => {
    if (isNaN(num) || num === null || num === undefined) {
      return "0"
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const totalInteractions = currentAgg.impressions + currentAgg.likes + currentAgg.comments + currentAgg.shares
  const avgEngagement = currentAgg.engagement_rate
  const daysTracked = Math.round(
    (new Date(currentStats[0].endDate).getTime() - new Date(currentStats[0].startDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const StatItem = ({
    icon: Icon,
    label,
    value,
    change,
    color,
  }: {
    icon: any
    label: string
    value: number | string
    change: number
    color: string
  }) => (
    <div className="surface-primary p-6 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl shadow-sm ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="space-tight">
            <p className="text-caption text-foreground-secondary">{label}</p>
            <p className="text-heading-3 text-foreground font-bold">
              {typeof value === "number" ? formatNumber(value) : value}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-right">
          {change > 0 ? (
            <TrendingUp className="w-5 h-5 text-success" />
          ) : change < 0 ? (
            <TrendingDown className="w-5 h-5 text-destructive" />
          ) : null}
          <span
            className={`text-body-small font-semibold ${
              change > 0 ? "text-success" : change < 0 ? "text-destructive" : "text-foreground-tertiary"
            }`}
          >
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <section className="space-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-tight">
          <h2 className="text-heading-1 text-foreground flex items-center gap-3">
            <div className="p-3 interactive-accent rounded-xl shadow-sm">
              <Target className="w-6 h-6" />
            </div>
            Performance Overview
          </h2>
          <p className="text-body text-foreground-secondary">
            {formatDate(currentStats[0].startDate)} - {formatDate(currentStats[0].endDate)} • {currentStats[0].period}
          </p>
        </div>
      </div>

      {/* Individual Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentStats.map((current, index) => {
          const previous = previousStats[index]
          const PlatformIcon = getPlatformIcon(current.profileName)
          
          return (
            <Card key={current.profileId} className="surface-primary border-2 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PlatformIcon className="h-5 w-5 text-muted-foreground" />
                  {current.profileName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile-specific metrics */}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Period Summary */}
      <div className="surface-secondary rounded-2xl p-8 border-2 shadow-sm">
        <h3 className="text-heading-2 text-foreground mb-6">Period Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-tight">
            <div className="text-display text-foreground font-bold">{formatNumber(totalInteractions)}</div>
            <div className="text-body-small text-foreground-secondary font-medium">Total Interactions</div>
          </div>
          <div className="text-center space-tight">
            <div className="text-display text-foreground font-bold">{avgEngagement.toFixed(2)}%</div>
            <div className="text-body-small text-foreground-secondary font-medium">Avg. Engagement</div>
          </div>
          <div className="text-center space-tight">
            <div className="text-display text-foreground font-bold">{daysTracked}</div>
            <div className="text-body-small text-foreground-secondary font-medium">Days Tracked</div>
          </div>
        </div>
      </div>
    </section>
  )
}
