import { NextResponse } from "next/server";

const CLOUDFLARE_MODEL =
  "@cf/black-forest-labs/flux-1-schnell";

export async function POST(request: Request) {
  try {
    const accountId =
      process.env.CLOUDFLARE_ACCOUNT_ID;

    const apiToken =
      process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId) {
      return NextResponse.json(
        {
          error:
            "CLOUDFLARE_ACCOUNT_ID is missing",
        },
        {
          status: 500,
        }
      );
    }

    if (!apiToken) {
      return NextResponse.json(
        {
          error:
            "CLOUDFLARE_API_TOKEN is missing",
        },
        {
          status: 500,
        }
      );
    }

    const body = await request.json();

    const {
      title,
      subtitle,
      visual,
      style,
    } = body;

    if (!title || !visual) {
      return NextResponse.json(
        {
          error:
            "Slide title and visual are required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * FLUX has a 2048 character prompt limit.
     *
     * We intentionally keep this prompt short.
     */

    const cleanVisual = String(
      visual
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 700);

    const cleanTitle = String(
      title
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);

    const cleanSubtitle = String(
      subtitle || ""
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

    const cleanStyle = String(
      style || "Dark"
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);

    const prompt = `
Premium cinematic presentation visual.

Scene:
${cleanVisual}

Context:
${cleanTitle}
${cleanSubtitle}

Style:
${cleanStyle}, modern, cinematic, premium, vivid colors,
strong contrast, realistic lighting, detailed textures,
dramatic depth, professional editorial photography.

Composition:
16:9 widescreen.
Strong focal point.
Balanced composition.
Leave some calmer negative space for presentation text.

IMPORTANT:
Generate ONLY the visual scene.

No text.
No letters.
No words.
No numbers.
No logos.
No captions.
No subtitles.
No watermarks.
No UI.
No interface.
No charts.
No diagrams.
No borders.
No presentation frame.

Make the image vivid, realistic, polished and visually striking.
`;

    /*
     * Final safety check.
     * Cloudflare FLUX accepts a maximum of 2048 characters.
     */

    const finalPrompt =
      prompt.slice(0, 2000);

    console.log(
      "Generating image with Cloudflare:",
      cleanTitle
    );

    console.log(
      "Prompt length:",
      finalPrompt.length
    );

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_MODEL}`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          prompt: finalPrompt,
          steps: 8,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Cloudflare AI error:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.errors?.[0]?.message ||
            "Cloudflare image generation failed",
        },
        {
          status: response.status,
        }
      );
    }

    const generatedImage =
      data?.result?.image;

    if (!generatedImage) {
      console.error(
        "Cloudflare returned no image:",
        data
      );

      return NextResponse.json(
        {
          error:
            "Cloudflare returned no image",
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "Cloudflare image generated successfully:",
      cleanTitle
    );

    return NextResponse.json({
      image:
        `data:image/jpeg;base64,${generatedImage}`,
    });
  } catch (error) {
    console.error(
      "Cloudflare image generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate image",
      },
      {
        status: 500,
      }
    );
  }
}