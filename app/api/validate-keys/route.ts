import { NextResponse } from "next/server"

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"

    // Check if backend is running by hitting the health endpoint
    const healthResponse = await fetch(`${backendUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!healthResponse.ok) {
      return NextResponse.json(
        {
          error: "Backend server is not available. Please ensure the Python API server is running.",
          type: "backend_unavailable",
        },
        { status: 503 },
      )
    }

    // The backend will validate the API keys internally
    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Backend validation error:", error)
    return NextResponse.json(
      {
        error: "Failed to connect to backend server. Please ensure the Python API server is running.",
        type: "backend_unavailable",
      },
      { status: 503 }
    )
  }
}
