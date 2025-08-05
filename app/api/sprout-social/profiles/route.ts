import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
    
    const response = await fetch(`${backendUrl}/profiles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch profiles" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Enhanced data processing to capture platform information
    const enhancedData = {
      ...data,
      data: data.data?.map((profile: any) => ({
        ...profile,
        // Ensure platform info is preserved
        platform_type: profile.platform_type || profile.network_type || profile.type,
        network: profile.network,
        network_type: profile.network_type
      }))
    }
    
    return NextResponse.json(enhancedData)
  } catch (error) {
    console.error("Profiles API error:", error)
    return NextResponse.json(
      { error: "Failed to connect to backend server" },
      { status: 500 }
    )
  }
}
