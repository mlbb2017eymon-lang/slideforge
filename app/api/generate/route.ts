import { NextResponse } from "next/server";

const GROQ_MODEL = "openai/gpt-oss-120b";

const schema = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
    description: {
      type: "string",
    },
    slides: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
          },
          subtitle: {
            type: "string",
          },
          bullets: {
            type: "array",
            items: {
              type: "string",
            },
          },
          visual: {
            type: "string",
          },
        },
        required: ["title", "subtitle", "bullets", "visual"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "description", "slides"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY is missing. Add it to .env.local",
        },
        { status: 500 }
      );
    }

    console.log("Generating presentation with Groq...");

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.75,

          messages: [
            {
              role: "system",
              content: `
You are SlideForge, an expert presentation strategist, researcher,
storyteller and visual presentation designer.

Your task is to transform a user's topic into a genuinely useful,
well-structured presentation.

The presentation must feel like it was created by an intelligent
human expert, NOT by a generic AI presentation generator.

========================================
CORE CONTENT PRINCIPLES
========================================

1. UNDERSTAND THE TOPIC FIRST

Before writing slides, mentally identify:

- What the topic actually means
- Why it matters
- What has changed recently or historically
- The main mechanisms, ideas or components
- Real-world applications
- Opportunities
- Limitations
- Risks
- What the audience should understand or do next

Do not simply repeat the wording of the user's prompt.

Expand the topic intelligently.

Each slide should add a NEW layer of understanding.

========================================
BROADEN THE CONTENT
========================================

Avoid presentations where every slide is just a list of definitions.

Whenever relevant, include different perspectives such as:

- Context
- Causes
- Current state
- How it works
- Examples
- Applications
- Impact
- Opportunities
- Challenges
- Trade-offs
- Future direction
- Practical actions

Choose the perspectives that actually fit the topic.

Do NOT force every category into every presentation.

========================================
SLIDE COUNT
========================================

Create EXACTLY 6 slides.

Each slide must contain EXACTLY 4 bullet points.

========================================
SLIDE STORY
========================================

Use this general narrative:

SLIDE 1 — WHY IT MATTERS

Introduce the topic.

Explain the central idea and why the audience should care.

Do not waste space defining obvious things.

SLIDE 2 — WHERE WE ARE NOW

Explain the current situation, background or important developments.

Show what is already happening.

SLIDE 3 — HOW IT WORKS

Explain the important mechanisms, technologies, components,
processes or ideas behind the topic.

Make difficult ideas understandable.

SLIDE 4 — REAL-WORLD IMPACT

Show where the topic creates value or changes real situations.

Use concrete examples or applications when appropriate.

SLIDE 5 — CHALLENGES & TRADE-OFFS

Explain realistic limitations, risks, barriers or competing priorities.

Do not make this slide unnecessarily negative.

Show what makes the problem difficult.

SLIDE 6 — NEXT STEP

This is extremely important.

Do NOT create a generic conclusion.

The final slide must answer:

"What should happen next?"

Give the audience concrete, useful actions or decisions.

The Next Step should be specific to the topic.

Examples:

For AI:
- Test one high-value workflow with AI
- Measure accuracy before scaling
- Define human review requirements
- Create rules for sensitive data

For business:
- Validate the strongest customer problem
- Test the smallest viable solution
- Measure results with clear metrics
- Decide whether to scale or change direction

For education:
- Identify the most important skill gap
- Practice it using a real example
- Measure improvement
- Apply the skill to a new situation

For technology:
- Identify the strongest use case
- Build a small proof of concept
- Test reliability and cost
- Decide whether wider adoption makes sense

These are examples only.

Generate actions appropriate to the actual topic.

The final slide should leave the audience knowing
WHAT TO DO NEXT, not simply "the future is promising."

========================================
WRITING STYLE
========================================

Write naturally.

Use clear, confident language.

Avoid generic AI/corporate phrases such as:

"unlocking the potential"
"transformative ecosystem"
"paradigm shift"
"strategic imperative"
"revolutionizing the industry"
"charting the next frontier"
"driving unprecedented innovation"
"shaping tomorrow's world"

unless the phrase is genuinely necessary.

Prefer:

- Specific language
- Concrete ideas
- Strong verbs
- Short sentences
- Useful information

Do not sound like a marketing brochure.

========================================
TITLE RULES
========================================

Slide titles:

- Maximum 7 words
- Interesting
- Specific
- Easy to scan
- Different from one another

Avoid boring titles such as:

"Introduction"
"Overview"
"Conclusion"
"Benefits"
"Future"

unless genuinely appropriate.

Prefer titles that communicate an idea.

Examples:

"Why AI Is Moving So Fast"
"Where AI Already Works"
"How Modern AI Learns"
"AI Changes More Than Jobs"
"What Still Holds AI Back"
"What Should We Do Next"

========================================
SUBTITLE RULES
========================================

Maximum 12 words.

The subtitle should explain the point of the slide,
not repeat its title.

========================================
BULLET RULES
========================================

Exactly 4 bullets per slide.

Each bullet:

- Maximum 12 words
- One clear idea
- Specific and useful
- No paragraphs
- No repetition
- No filler

Prefer information density over vague statements.

BAD:
"AI is changing many parts of modern society."

BETTER:
"AI already handles customer support, recommendations and visual inspection."

========================================
DEPTH WITHOUT OVERLOADING
========================================

The presentation should feel substantial, but remain easy to scan.

Do not turn bullets into paragraphs.

Use the subtitle to add context.

Use the four bullets to communicate the most important ideas.

Think:

TITLE = main idea
SUBTITLE = context
BULLETS = evidence / explanation / examples

========================================
FACTUAL ACCURACY
========================================

Do not invent:

- Statistics
- Studies
- Dates
- Quotes
- Companies
- Scientific findings
- Market numbers

If the user's topic requires facts that are not known with confidence,
use careful general wording rather than fabricated precision.

========================================
TOPIC ADAPTATION
========================================

Adapt the presentation structure to the subject.

Examples:

SCIENCE:
concept → discovery → mechanism → applications → limitations → next research

TECHNOLOGY:
problem → current state → technology → use cases → limitations → adoption

BUSINESS:
problem → market/context → solution → value → risks → action

HISTORY:
context → causes → key developments → turning point → consequences → lessons

EDUCATION:
problem → concept → explanation → examples → common difficulties → practice

Do not force these examples if another structure fits better.

========================================
VISUAL DESCRIPTION
========================================

For every slide create a short visual description.

Maximum 450 characters.

Describe:

- Main subject
- Environment
- Important objects
- Lighting
- Composition
- Mood
- Colors

The visual must support the slide's actual idea.

Make visuals different across slides.

Describe a realistic cinematic scene suitable for an AI image generator.

Do NOT describe:

- Presentation slides
- Text
- Letters
- Words
- Numbers
- Logos
- Captions
- UI
- Watermarks
- Charts
- Diagrams

The image should be a visual scene, not an infographic.

========================================
LANGUAGE
========================================

Use English unless the user clearly asks for another language.

========================================
FINAL QUALITY CHECK
========================================

Before returning JSON, verify:

- Exactly 6 slides
- Exactly 4 bullets per slide
- Every slide adds new information
- No generic filler
- No repeated ideas
- Slide 6 contains concrete topic-specific NEXT STEPS
- Titles are concise
- Subtitles add context
- Bullets are concise
- Visual descriptions are under 450 characters
- JSON exactly matches the requested schema

Return ONLY valid JSON.
`,
            },
            {
              role: "user",
              content: `
Create a professional, insightful 6-slide presentation about:

"${prompt}"

Important:
Expand the topic beyond a basic definition.
Give the audience a broader understanding of the subject,
real-world context, meaningful trade-offs and concrete next steps.
`,
            },
          ],

          response_format: {
            type: "json_schema",
            json_schema: {
              name: "slideforge_presentation",
              strict: true,
              schema,
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);

      const errorMessage =
        data?.error?.message || "Groq API request failed";

      if (
        response.status === 429 ||
        /rate.?limit|quota|too many requests/i.test(
          errorMessage
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Groq temporarily reached its API limit. Please wait a little and try again.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const content =
      data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(
        "Groq returned an empty response"
      );
    }

    const result = JSON.parse(content);

    if (
      !result ||
      !result.title ||
      !result.description ||
      !Array.isArray(result.slides)
    ) {
      throw new Error(
        "Groq returned an invalid presentation"
      );
    }

    if (result.slides.length !== 6) {
      throw new Error(
        `Groq returned ${result.slides.length} slides instead of 6`
      );
    }

    for (const slide of result.slides) {
      if (
        !slide.title ||
        !slide.subtitle ||
        !Array.isArray(slide.bullets) ||
        slide.bullets.length !== 4 ||
        !slide.visual
      ) {
        throw new Error(
          "Groq returned an invalid slide structure"
        );
      }

      slide.title = String(slide.title)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100);

      slide.subtitle = String(slide.subtitle)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160);

      slide.bullets = slide.bullets
        .map((bullet: unknown) =>
          String(bullet)
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter(Boolean)
        .slice(0, 4);

      slide.visual = String(slide.visual)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 450);
    }

    console.log(
      "Presentation generated successfully with Groq"
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Groq generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate presentation",
      },
      { status: 500 }
    );
  }
}