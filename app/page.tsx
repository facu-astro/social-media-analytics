"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, BarChart3, TrendingUp, Users, MessageSquare, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { StatsCards } from "@/components/stats-cards"
import { ComparisonCharts } from "@/components/comparison-charts"
import { StrategyRecommendations } from "@/components/strategy-recommendations"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// Platform icon mapping
const getPlatformIcon = (profile: any) => {
  // Check if platform info is available in the profile data
  const platformType = profile.platform_type || profile.network_type || profile.network || profile.type
  const profileName = profile.name?.toLowerCase() || ''



  // Direct platform type mapping - handle Sprout Social specific values
  switch (platformType?.toLowerCase()) {
    case 'facebook':
    case 'fb':
      return Facebook
    case 'twitter':
    case 'x':
      return Twitter
    case 'instagram':
    case 'ig':
    case 'fb_instagram_account': // Sprout Social specific
      return Instagram
    case 'linkedin':
    case 'li':
    case 'linkedin_company': // Sprout Social specific
      return Linkedin
    case 'youtube':
    case 'yt':
      return Youtube
    case 'tiktok': // TikTok support
      return MessageSquare // Use generic icon for TikTok since lucide-react doesn't have a TikTok icon
    case 'apple_app_store':
    case 'google_play_store':
      return MessageSquare // Use generic icon for app stores
    default:
      // Fallback: detect from profile name
      if (profileName.includes('facebook') || profileName.includes('fb')) return Facebook
      if (profileName.includes('twitter') || profileName.includes('x.com') || profileName.includes('x ')) return Twitter
      if (profileName.includes('instagram') || profileName.includes('ig')) return Instagram
      if (profileName.includes('linkedin') || profileName.includes('li')) return Linkedin
      if (profileName.includes('youtube') || profileName.includes('yt')) return Youtube

      // Additional fallback: check for common URL patterns in name
      if (profileName.includes('facebook.com')) return Facebook
      if (profileName.includes('twitter.com') || profileName.includes('x.com')) return Twitter
      if (profileName.includes('instagram.com')) return Instagram
      if (profileName.includes('linkedin.com')) return Linkedin
      if (profileName.includes('youtube.com')) return Youtube


      return MessageSquare // Generic social media icon
  }
}

interface Profile {
  id: string
  name: string
  platform_type?: string
  network_type?: string
  network?: string
  type?: string
  raw?: any // For debugging
}

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

interface Strategy {
  id: number
  title: string
  description: string
  category: string
  priority: string
  implementation_time: string
  expected_impact: string
  action_items: string[]
  metrics_to_track: string[]
}

export default function Dashboard() {
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<DateRange | undefined>()
  const [previousPeriod, setPreviousPeriod] = useState<DateRange | undefined>()
  const [allCurrentStats, setAllCurrentStats] = useState<PeriodStats[]>([])
  const [allPreviousStats, setAllPreviousStats] = useState<PeriodStats[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [okr, setOkr] = useState("")

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchStats = async (profileId: string, dateRange: DateRange): Promise<PeriodStats> => {
    if (!dateRange.from || !dateRange.to) {
      throw new Error("Invalid date range")
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://social-media-analytics-idnt.onrender.com"
    const response = await fetch(`${backendUrl}/stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile_id: profileId,
        start_date: format(dateRange.from, "yyyy-MM-dd"),
        end_date: format(dateRange.to, "yyyy-MM-dd"),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to fetch stats")
    }

    const data = await response.json()
    const profile = profiles.find(p => p.id === profileId)

    // Aggregate the daily data
    const dailyData = data.data || []
    const aggregatedStats = dailyData.reduce((acc: any, day: any) => {
      const metrics = day.metrics || {}
      return {
        impressions: acc.impressions + (metrics.impressions || 0),
        likes: acc.likes + (metrics.likes || 0),
        comments: acc.comments + (metrics.comments_count || 0),
        shares: acc.shares + (metrics.shares_count || 0),
      }
    }, { impressions: 0, likes: 0, comments: 0, shares: 0 })

    // Calculate engagement rate
    const totalEngagements = aggregatedStats.likes + aggregatedStats.comments + aggregatedStats.shares
    const engagementRate = aggregatedStats.impressions > 0
      ? parseFloat(((totalEngagements / aggregatedStats.impressions) * 100).toFixed(4))
      : 0

    return {
      period: `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`,
      startDate: format(dateRange.from, "yyyy-MM-dd"),
      endDate: format(dateRange.to, "yyyy-MM-dd"),
      impressions: aggregatedStats.impressions,
      likes: aggregatedStats.likes,
      comments: aggregatedStats.comments,
      shares: aggregatedStats.shares,
      engagement_rate: engagementRate,
      profileId,
      profileName: profile?.name || `Profile ${profileId}`
    }
  }

  const fetchStrategies = async (current: PeriodStats[], previous: PeriodStats[], customPrompt: string, okr: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://social-media-analytics-idnt.onrender.com"
    const response = await fetch(`${backendUrl}/strategy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        report_data: {
          profiles: current.map(stat => ({
            ...stat,
            previous: previous.find(p => p.profileId === stat.profileId)
          })),
          custom_prompt: customPrompt,
          okr: okr
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to fetch strategies")
    }

    const data = await response.json()
    return data.strategies || []
  }

  const handleAnalyze = async () => {
    if (selectedProfiles.length === 0 || !currentPeriod || !previousPeriod) {
      setError("Please select at least one profile and both date ranges")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Fetch stats for all selected profiles
      const currentStatsPromises = selectedProfiles.map(profileId => 
        fetchStats(profileId, currentPeriod)
      )
      const previousStatsPromises = selectedProfiles.map(profileId => 
        fetchStats(profileId, previousPeriod)
      )

      const [currentResults, previousResults] = await Promise.all([
        Promise.all(currentStatsPromises),
        Promise.all(previousStatsPromises)
      ])

      setAllCurrentStats(currentResults)
      setAllPreviousStats(previousResults)

      // Fetch AI strategies with custom prompt and OKR
      const strategiesData = await fetchStrategies(currentResults, previousResults, customPrompt, okr)
      setStrategies(strategiesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchProfiles = async () => {
    setLoadingProfiles(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://social-media-analytics-idnt.onrender.com"
      const response = await fetch(`${backendUrl}/profiles`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch profiles")
      }
      const data = await response.json()
      // The API returns profiles in data.data array, map to expected format
      const profilesData = data.data || []

      const formattedProfiles = profilesData.map((profile: any) => ({
        id: profile.customer_profile_id.toString(),
        name: profile.name,
        platform_type: profile.platform_type || profile.network_type || profile.network || profile.type,
        network: profile.network,
        network_type: profile.network_type,
        type: profile.type
      }))
      setProfiles(formattedProfiles)
      if (formattedProfiles.length === 0) {
        toast.info("No profiles found. Check your Sprout Social API configuration.")
      }
    } catch (error) {
      console.error("Profile fetch error:", error)
      toast.error(`Failed to load profiles: ${error.message}`)
    } finally {
      setLoadingProfiles(false)
    }
  }

  const hasData = allCurrentStats.length > 0 && allPreviousStats.length > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <h1 className="text-lg font-semibold">AstroPay Social Media Analytics</h1>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                document.cookie = "authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
                window.location.href = "/login"
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 space-section">
        {/* Header */}
        <header className="text-center space-component relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 interactive-primary rounded-2xl mb-6 shadow-lg">
            <BarChart3 className="h-10 w-10" />
          </div>
          <h1 className="text-display text-foreground mb-4">
            Social Media Analytics
          </h1>
          <p className="text-body-large text-foreground-secondary max-w-2xl mx-auto">
            Analyze your Sprout Social performance and get AI-powered strategy recommendations
          </p>
        </header>

        {/* Input Form */}
        <Card className="surface-primary shadow-lg border-2 space-component">
          <CardHeader className="space-element">
            <CardTitle className="flex items-center gap-3 text-heading-2">
              <div className="p-3 interactive-accent rounded-xl shadow-sm">
                <BarChart3 className="h-6 w-6" />
              </div>
              Analysis Configuration
            </CardTitle>
            <CardDescription className="text-body text-foreground-secondary">
              Enter your Sprout Social profile ID and select date ranges to compare
            </CardDescription>
          </CardHeader>
          <CardContent className="space-element">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-tight">
                <Label htmlFor="profiles" className="text-body-small font-semibold text-foreground">
                  Select Profiles (Multiple)
                </Label>
                <div className="flex gap-2">
                  <Select value="" onValueChange={(value) => {
                    if (value && !selectedProfiles.includes(value)) {
                      setSelectedProfiles([...selectedProfiles, value])
                    }
                  }}>
                    <SelectTrigger className="surface-primary border-2">
                      <SelectValue placeholder={`Add profile (${profiles.length} available)`} />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.filter(p => !selectedProfiles.includes(p.id)).map((profile) => {
                        const PlatformIcon = getPlatformIcon(profile)
                        return (
                          <SelectItem key={profile.id} value={profile.id}>
                            <div className="flex items-center gap-2">
                              <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{profile.name}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchProfiles} disabled={loadingProfiles} variant="outline" size="sm">
                    {loadingProfiles ? "Loading..." : "Refresh"}
                  </Button>
                </div>
                
                {/* Selected Profiles Display */}
                {selectedProfiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProfiles.map(profileId => {
                      const profile = profiles.find(p => p.id === profileId)
                      const PlatformIcon = profile ? getPlatformIcon(profile) : MessageSquare
                      return (
                        <div key={profileId} className="flex items-center gap-2 bg-accent px-3 py-2 rounded-md text-sm">
                          <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{profile?.name || profileId}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => setSelectedProfiles(prev => prev.filter(id => id !== profileId))}
                          >
                            ×
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-tight">
                  <Label htmlFor="currentPeriod" className="text-body-small font-semibold text-foreground">
                    Current Period
                  </Label>
                  <DateRangePicker
                    value={currentPeriod}
                    onChange={setCurrentPeriod}
                    placeholder="Select current period"
                  />
                </div>
                <div className="space-tight">
                  <Label htmlFor="previousPeriod" className="text-body-small font-semibold text-foreground">
                    Previous Period
                  </Label>
                  <DateRangePicker
                    value={previousPeriod}
                    onChange={setPreviousPeriod}
                    placeholder="Select previous period"
                  />
                </div>
              </div>

              <div className="space-tight">
                <Label htmlFor="okr" className="text-body-small font-semibold text-foreground">
                  OKR (Optional)
                </Label>
                <Input
                  id="okr"
                  placeholder="e.g., Increase engagement rate by 25% this quarter"
                  value={okr}
                  onChange={(e) => setOkr(e.target.value)}
                />
              </div>

              <div className="space-tight">
                <Label htmlFor="customPrompt" className="text-body-small font-semibold text-foreground">
                  Custom Analysis Prompt (Optional)
                </Label>
                <textarea
                  id="customPrompt"
                  className="w-full min-h-[100px] p-3 border rounded-md resize-vertical"
                  placeholder="Customize the AI analysis prompt. Leave empty for default analysis..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="surface-destructive border-2">
                <AlertDescription className="text-body-small">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={loading || selectedProfiles.length === 0 || !currentPeriod?.from || !currentPeriod?.to || !previousPeriod?.from || !previousPeriod?.to}
              className="w-full interactive-primary h-12 text-body font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Analyzing Performance...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-3 h-5 w-5" />
                  Analyze Performance
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {hasData && (
          <section className="space-section">
            {/* Stats Cards */}
            <StatsCards currentStats={allCurrentStats} previousStats={allPreviousStats} />

            {/* Charts */}
            <ComparisonCharts currentStats={allCurrentStats} previousStats={allPreviousStats} />
          </section>
        )}

        {/* AI Strategies - Independent of stats data */}
        {strategies.length > 0 && (
          <section className="space-section">
            <StrategyRecommendations strategies={strategies} />
          </section>
        )}

        {/* Empty State */}
        {!hasData && !loading && (
          <Card className="surface-primary text-center py-16 shadow-lg border-2">
            <CardContent>
              <div className="flex flex-col items-center space-component">
                <div className="rounded-full surface-secondary p-8 shadow-sm">
                  <Users className="h-16 w-16 text-accent" />
                </div>
                <div className="space-tight max-w-lg">
                  <h3 className="text-heading-2 text-foreground mb-3">
                    Ready to Analyze Your Social Media Performance
                  </h3>
                  <p className="text-body text-foreground-secondary">
                    Enter your Sprout Social profile ID and select quarters to compare.
                    Get detailed analytics and AI-powered strategy recommendations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
