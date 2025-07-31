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
    const {
      currentStats,
      previousStats,
    }: {
      currentStats: QuarterStats
      previousStats: QuarterStats
    } = await request.json()

    if (!currentStats || !previousStats) {
      return NextResponse.json({ error: "Current and previous quarter stats are required" }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"

    // Prepare the report data for the backend
    const reportData = {
      current_quarter: currentStats,
      previous_quarter: previousStats,
      comparison: {
        impressions_change: calculatePercentageChange(currentStats.impressions, previousStats.impressions),
        likes_change: calculatePercentageChange(currentStats.likes, previousStats.likes),
        comments_change: calculatePercentageChange(currentStats.comments, previousStats.comments),
        shares_change: calculatePercentageChange(currentStats.shares, previousStats.shares),
        engagement_rate_change: calculatePercentageChange(currentStats.engagement_rate, previousStats.engagement_rate),
      }
    }

    // Call the Python backend to generate strategies
    const response = await fetch(`${backendUrl}/generate_strategy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        report_data: reportData,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))

      if (response.status === 429) {
        return NextResponse.json({ error: "OpenAI API rate limit exceeded. Please try again later." }, { status: 429 })
      }
      if (response.status === 401) {
        return NextResponse.json({ error: "Invalid OpenAI API key" }, { status: 401 })
      }

      return NextResponse.json(
        { error: errorData.detail || "Failed to generate strategies from backend" },
        { status: response.status }
      )
    }

    const strategyText = await response.text()

    // Parse the response into individual strategies
    const strategies = parseStrategiesFromResponse(strategyText)

    return NextResponse.json({
      strategies,
      analysis: {
        currentStats,
        previousStats,
        changes: reportData.comparison,
      },
    })
  } catch (error) {
    console.error("Backend API error:", error)
    return NextResponse.json(
      { error: "Failed to connect to backend server" },
      { status: 500 }
    )
  }
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100 * 100) / 100
}

function parseStrategiesFromResponse(response: string): string[] {
  // Split the response into individual strategies
  const lines = response.split("\n").filter((line) => line.trim().length > 0)

  const strategies: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip headers, numbers, or very short lines
    if (trimmed.length < 50) continue
    if (trimmed.toLowerCase().includes("strategies:")) continue
    if (/^\d+\./.test(trimmed)) {
      // Remove numbering and add the strategy
      strategies.push(trimmed.replace(/^\d+\.\s*/, ""))
    } else if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
      // Remove bullet points and add the strategy
      strategies.push(trimmed.replace(/^[-•]\s*/, ""))
    } else if (strategies.length < 5 && trimmed.length > 50) {
      // Add as strategy if we don't have 5 yet and it's substantial
      strategies.push(trimmed)
    }
  }

  // Ensure we have exactly 5 strategies
  return strategies.slice(0, 5)
}
