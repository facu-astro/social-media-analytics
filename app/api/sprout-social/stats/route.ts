import { type NextRequest, NextResponse } from "next/server"

interface QuarterStats {
  quarter: string
  impressions: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
}

export async function POST(request: NextRequest) {
  try {
    const { profileId, quarter } = await request.json()

    if (!profileId || !quarter) {
      return NextResponse.json({ error: "Profile ID and quarter are required" }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"

    // Calculate date range for the quarter
    const { startDate, endDate } = getQuarterDateRange(quarter)

    // Call the Python backend
    const response = await fetch(`${backendUrl}/profile_stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile_id: profileId,
        start_date: startDate,
        end_date: endDate,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))

      if (response.status === 401) {
        return NextResponse.json({ error: "Invalid API credentials" }, { status: 401 })
      }
      if (response.status === 404) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 })
      }
      if (response.status === 429) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
      }

      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch stats from backend" },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Transform the backend response to match the frontend interface
    const transformedData: QuarterStats = {
      quarter,
      impressions: extractMetricValue(data, 'impressions'),
      likes: extractMetricValue(data, 'likes'),
      comments: extractMetricValue(data, 'comments_count'),
      shares: extractMetricValue(data, 'shares_count'),
      engagement_rate: 0, // Will be calculated below
    }

    // Calculate engagement rate
    transformedData.engagement_rate = calculateEngagementRate(
      transformedData.likes,
      transformedData.comments,
      transformedData.shares,
      transformedData.impressions
    )

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Backend API error:", error)
    return NextResponse.json(
      { error: "Failed to connect to backend server" },
      { status: 500 }
    )
  }
}

function getQuarterDateRange(quarter: string): { startDate: string; endDate: string } {
  const [q, year] = quarter.split(" ")
  const yearNum = Number.parseInt(year)

  const quarters = {
    Q1: { start: `${yearNum}-01-01`, end: `${yearNum}-03-31` },
    Q2: { start: `${yearNum}-04-01`, end: `${yearNum}-06-30` },
    Q3: { start: `${yearNum}-07-01`, end: `${yearNum}-09-30` },
    Q4: { start: `${yearNum}-10-01`, end: `${yearNum}-12-31` },
  }

  const quarterData = quarters[q as keyof typeof quarters]
  if (!quarterData) {
    throw new Error('Invalid quarter format. Use format like "Q1 2024"')
  }

  return {
    startDate: quarterData.start,
    endDate: quarterData.end,
  }
}

function extractMetricValue(data: any, metricName: string): number {
  // Handle different possible data structures from the backend
  if (typeof data === 'object' && data !== null) {
    // If data has a 'data' property with an array
    if (data.data && Array.isArray(data.data)) {
      return data.data.reduce((sum: number, item: any) => {
        const metrics = item.metrics || item
        return sum + (metrics[metricName] || 0)
      }, 0)
    }

    // If data has metrics directly
    if (data.metrics) {
      return data.metrics[metricName] || 0
    }

    // If the metric is directly on the data object
    return data[metricName] || 0
  }

  return 0
}

function calculateEngagementRate(likes: number, comments: number, shares: number, impressions: number): number {
  if (impressions === 0) return 0
  const totalEngagement = likes + comments + shares
  return Math.round(((totalEngagement / impressions) * 100) * 100) / 100 // Round to 2 decimal places
}
