import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, detailed } = await req.json();

    // Connect to Ollama and get response
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek/coder:1.5b",
        prompt: `${detailed ? "Provide a detailed response to" : "Briefly answer"}: ${message}`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from Ollama");
    }

    const data = await response.json();
    return NextResponse.json({
      response: data.response,
      confidence: Math.floor(Math.random() * 30) + 70, // Simulated confidence score
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}