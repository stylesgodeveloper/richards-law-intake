import { NextRequest, NextResponse } from "next/server";
import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/extraction-prompt";

export const maxDuration = 120; // Allow up to 2 minutes for Claude processing

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdf_base64, matter_id, file_name } = body;

    if (!pdf_base64) {
      return NextResponse.json(
        { error: "Missing pdf_base64" },
        { status: 400 }
      );
    }
    if (!matter_id) {
      return NextResponse.json(
        { error: "Missing matter_id" },
        { status: 400 }
      );
    }

    // Option 1: Direct Claude API call (if ANTHROPIC_API_KEY is set)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    // Option 2: Make.com webhook (if MAKE_WEBHOOK_EXTRACT is set)
    const makeWebhook = process.env.MAKE_WEBHOOK_EXTRACT;

    if (anthropicKey) {
      // Direct Claude API call with PDF
      const claudeResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            temperature: 0,
            system: EXTRACTION_SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "document",
                    source: {
                      type: "base64",
                      media_type: "application/pdf",
                      data: pdf_base64,
                    },
                  },
                  {
                    type: "text",
                    text: `Extract all data from this police accident report PDF. The file is: ${file_name}. Return ONLY the JSON structure as specified.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!claudeResponse.ok) {
        const errText = await claudeResponse.text();
        console.error("Claude API error:", errText);
        return NextResponse.json(
          { error: `Claude API error: ${claudeResponse.status}` },
          { status: 502 }
        );
      }

      const claudeData = await claudeResponse.json();
      const textContent = claudeData.content?.find(
        (c: { type: string }) => c.type === "text"
      );

      if (!textContent?.text) {
        return NextResponse.json(
          { error: "No text response from Claude" },
          { status: 502 }
        );
      }

      // Parse the JSON from Claude's response (handle markdown code blocks)
      let extractedJson;
      try {
        let jsonText = textContent.text.trim();
        // Remove markdown code fences if present
        if (jsonText.startsWith("```")) {
          jsonText = jsonText
            .replace(/^```(?:json)?\s*\n?/, "")
            .replace(/\n?\s*```$/, "");
        }
        extractedJson = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error("Failed to parse Claude response:", textContent.text);
        return NextResponse.json(
          { error: "Failed to parse extraction result" },
          { status: 502 }
        );
      }

      return NextResponse.json({
        extraction: extractedJson,
        matter_id,
        source: "claude_direct",
      });
    } else if (makeWebhook) {
      // Forward to Make.com webhook
      const makeResponse = await fetch(makeWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_base64, matter_id, file_name }),
      });

      if (!makeResponse.ok) {
        return NextResponse.json(
          { error: `Make.com webhook error: ${makeResponse.status}` },
          { status: 502 }
        );
      }

      const makeData = await makeResponse.json();
      return NextResponse.json({
        extraction: makeData,
        matter_id,
        source: "make_webhook",
      });
    } else {
      return NextResponse.json(
        {
          error:
            "No extraction backend configured. Set ANTHROPIC_API_KEY or MAKE_WEBHOOK_EXTRACT.",
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Extract API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
