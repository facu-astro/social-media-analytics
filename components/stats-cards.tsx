import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2, Users } from "lucide-react"

interface QuarterStats {
  quarter: string
  impressions: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
}

interface StatsCardsProps {
  currentStats: QuarterStats
  previousStats: QuarterStats
}

export function StatsCards({ currentStats, previousStats }: StatsCardsProps) {
  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    return {
      percentage: Math.abs(change).toFixed(1),
      isPositive: change > 0,
      isNeutral: Math.abs(change) < 1,
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toLocaleString()
  }

  const stats = [
    {
      title: "Total Impressions",
      value: currentStats.impressions,
      previousValue: previousStats.impressions,
      icon: Eye,
      color: "text-blue-600",
    },
    {
      title: "Likes",
      value: currentStats.likes,
      previousValue: previousStats.likes,
      icon: Heart,
      color: "text-red-500",
    },
    {
      title: "Comments",
      value: currentStats.comments,
      previousValue: previousStats.comments,
      icon: MessageCircle,
      color: "text-green-600",
    },
    {
      title: "Shares",
      value: currentStats.shares,
      previousValue: previousStats.shares,
      icon: Share2,
      color: "text-purple-600",
    },
    {
      title: "Engagement Rate",
      value: currentStats.engagement_rate,
      previousValue: previousStats.engagement_rate,
      icon: Users,
      color: "text-orange-600",
      isPercentage: true,
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Current Quarter Performance</h2>
        <p className="text-slate-600">
          Comparing {currentStats.quarter} vs {previousStats.quarter}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat) => {
          const change = calculateChange(stat.value, stat.previousValue)
          const Icon = stat.icon

          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
                  {stat.title}
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-slate-900">
                    {stat.isPercentage ? `${stat.value.toFixed(1)}%` : formatNumber(stat.value)}
                  </div>

                  <div className="flex items-center gap-2">
                    {change.isNeutral ? (
                      <Badge variant="secondary" className="text-xs">
                        No change
                      </Badge>
                    ) : (
                      <Badge
                        variant={change.isPositive ? "default" : "destructive"}
                        className="text-xs flex items-center gap-1"
                      >
                        {change.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {change.percentage}%
                      </Badge>
                    )}
                    <span className="text-xs text-slate-500">vs last quarter</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
