"use client";

import { useEffect, useRef, useState } from "react";
import pptxgen from "pptxgenjs";

type PresentationStyle =
  | "dark"
  | "minimal"
  | "corporate"
  | "creative"
  | "futuristic";

type Slide = {
  title: string;
  subtitle: string;
  bullets: string[];
  visual: string;
  image?: string;
};

type Presentation = {
  title: string;
  description: string;
  slides: Slide[];
  style?: PresentationStyle;
};

type HistoryItem = Presentation & {
  id: string;
  createdAt: string;
};

const HISTORY_KEY = "slideforge_history";

const STYLE_OPTIONS: {
  id: PresentationStyle;
  name: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "dark",
    name: "Dark",
    description: "Premium & elegant",
    icon: "◐",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean & simple",
    icon: "○",
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Business & professional",
    icon: "▣",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Bold & expressive",
    icon: "✦",
  },
  {
    id: "futuristic",
    name: "Futuristic",
    description: "AI & technology",
    icon: "⌁",
  },
];

const STYLE_CONFIG: Record<
  PresentationStyle,
  {
    label: string;
    accent: string;
    accentBg: string;
    background: string;
    card: string;
    text: string;
    muted: string;
    gradient: string;
    pptAccent: string;
    pptBackground: string;
  }
> = {
  dark: {
    label: "Dark",
    accent: "text-violet-400",
    accentBg: "bg-violet-400",
    background:
      "bg-gradient-to-br from-[#15111f] via-[#0e1017] to-[#090a0f]",
    card: "bg-white/[0.04] border-white/10",
    text: "text-white",
    muted: "text-zinc-400",
    gradient:
      "from-violet-500/20 via-[#11131b] to-[#090a0f]",
    pptAccent: "A78BFA",
    pptBackground: "090A0F",
  },

  minimal: {
    label: "Minimal",
    accent: "text-sky-400",
    accentBg: "bg-sky-400",
    background:
      "bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0b1120]",
    card: "bg-white/[0.035] border-white/10",
    text: "text-white",
    muted: "text-slate-400",
    gradient:
      "from-sky-500/15 via-[#111827] to-[#0b1120]",
    pptAccent: "38BDF8",
    pptBackground: "0B1120",
  },

  corporate: {
    label: "Corporate",
    accent: "text-blue-400",
    accentBg: "bg-blue-400",
    background:
      "bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0c1220]",
    card: "bg-blue-500/[0.04] border-blue-400/10",
    text: "text-white",
    muted: "text-slate-400",
    gradient:
      "from-blue-500/20 via-[#111827] to-[#0c1220]",
    pptAccent: "60A5FA",
    pptBackground: "0C1220",
  },

  creative: {
    label: "Creative",
    accent: "text-fuchsia-400",
    accentBg: "bg-fuchsia-400",
    background:
      "bg-gradient-to-br from-[#1b1020] via-[#140f1c] to-[#090a0f]",
    card: "bg-fuchsia-500/[0.04] border-fuchsia-400/10",
    text: "text-white",
    muted: "text-fuchsia-100/50",
    gradient:
      "from-fuchsia-500/25 via-[#15101c] to-[#090a0f]",
    pptAccent: "E879F9",
    pptBackground: "090A0F",
  },

  futuristic: {
    label: "Futuristic",
    accent: "text-cyan-400",
    accentBg: "bg-cyan-400",
    background:
      "bg-gradient-to-br from-[#06151a] via-[#071015] to-[#05080c]",
    card: "bg-cyan-500/[0.035] border-cyan-400/10",
    text: "text-white",
    muted: "text-cyan-100/45",
    gradient:
      "from-cyan-500/20 via-[#07151a] to-[#05080c]",
    pptAccent: "22D3EE",
    pptBackground: "05080C",
  },
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const [loading, setLoading] = useState(false);

  const [presentation, setPresentation] =
    useState<Presentation | null>(null);

  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const [exporting, setExporting] = useState(false);

  const [style, setStyle] =
    useState<PresentationStyle>("dark");

  const [generatingImages, setGeneratingImages] =
    useState(false);

  const [imageProgress, setImageProgress] =
    useState(0);

  useEffect(() => {
    try {
      const savedHistory =
        localStorage.getItem(HISTORY_KEY);

      if (savedHistory) {
        const parsedHistory =
          JSON.parse(savedHistory);

        if (Array.isArray(parsedHistory)) {
          setHistory(parsedHistory);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load history:",
        error
      );
    }
  }, []);

  // ==========================================
  // GENERATE AI IMAGES
  // ==========================================

  const generateImages = async (
    presentationData: Presentation
  ) => {
    if (generatingImages) return;

    setGeneratingImages(true);
    setImageProgress(0);
    setError("");

    for (
      let index = 0;
      index < presentationData.slides.length;
      index++
    ) {
      const slide =
        presentationData.slides[index];

      try {
        const response = await fetch(
          "/api/generate-image",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              title: slide.title,
              subtitle: slide.subtitle,
              visual: slide.visual,
              style:
                STYLE_CONFIG[
                  presentationData.style ||
                    "dark"
                ].label,
            }),
          }
        );

        // IMPORTANT:
        // Prevent "Unexpected token '<'"
        // when Next.js returns an HTML 404/error page.
        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        if (
          !contentType.includes(
            "application/json"
          )
        ) {
          const html =
            await response.text();

          console.error(
            "Generate-image returned non-JSON:",
            {
              status: response.status,
              statusText:
                response.statusText,
              contentType,
              response:
                html.slice(0, 500),
            }
          );

          throw new Error(
            `Image API returned ${response.status}. Check app/api/generate-image/route.ts`
          );
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              `Failed to generate image ${
                index + 1
              }`
          );
        }

        if (!data.image) {
          throw new Error(
            `Image ${
              index + 1
            } was not returned by Gemini`
          );
        }

        setPresentation(
          (previous) => {
            if (!previous)
              return previous;

            return {
              ...previous,
              slides:
                previous.slides.map(
                  (
                    currentSlide,
                    slideIndex
                  ) =>
                    slideIndex === index
                      ? {
                          ...currentSlide,
                          image:
                            data.image,
                        }
                      : currentSlide
                ),
            };
          }
        );
      } catch (error) {
        console.error(
          `Image ${
            index + 1
          } generation error:`,
          error
        );

        // Continue with the next slide.
      }

      setImageProgress(index + 1);
    }

    setGeneratingImages(false);
  };

  // ==========================================
  // GENERATE PRESENTATION
  // ==========================================

  const generatePresentation =
    async () => {
      if (
        !prompt.trim() ||
        loading
      ) {
        return;
      }

      setLoading(true);
      setError("");
      setPresentation(null);
      setCurrentSlide(0);
      setImageProgress(0);
      setGeneratingImages(false);

      try {
        const selectedStyle =
          STYLE_CONFIG[style];

        const response =
          await fetch("/api/generate", {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              prompt: `${prompt.trim()}

Presentation style: ${selectedStyle.label}

Style requirements:
- Use the ${selectedStyle.label} visual style.
- Keep every slide visually consistent with this style.
- Make visual suggestions match this style.
- Use a professional presentation structure.
- Keep content concise and presentation-ready.
- Avoid unnecessary filler.`,
            }),
          });

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        if (
          !contentType.includes(
            "application/json"
          )
        ) {
          const text =
            await response.text();

          throw new Error(
            `Presentation API returned ${response.status}: ${text.slice(
              0,
              200
            )}`
          );
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Generation failed"
          );
        }

        if (
          !data.slides ||
          !Array.isArray(
            data.slides
          )
        ) {
          throw new Error(
            "Invalid presentation format"
          );
        }

        const newPresentation: HistoryItem =
          {
            ...data,
            style,
            id: crypto.randomUUID(),
            createdAt:
              new Date().toISOString(),
          };

        setHistory(
          (previousHistory) => {
            const updatedHistory = [
              newPresentation,
              ...previousHistory,
            ];

            localStorage.setItem(
              HISTORY_KEY,
              JSON.stringify(
                updatedHistory
              )
            );

            return updatedHistory;
          }
        );

        // Show presentation immediately.
        setPresentation(
          newPresentation
        );

        // Generate AI visuals.
        await generateImages(
          newPresentation
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Не удалось создать презентацию."
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================
  // OPEN HISTORY
  // ==========================================

  const openHistoryPresentation = (
    item: HistoryItem
  ) => {
    setPresentation(item);

    if (item.style) {
      setStyle(item.style);
    }

    setCurrentSlide(0);
    setImageProgress(0);
    setGeneratingImages(false);
    setError("");

    window.scrollTo({
      top: 500,
      behavior: "smooth",
    });
  };

  // ==========================================
  // REGENERATE IMAGES
  // ==========================================

  const regenerateImages =
    async () => {
      if (
        !presentation ||
        generatingImages
      ) {
        return;
      }

      const presentationWithoutImages: Presentation =
        {
          ...presentation,
          slides:
            presentation.slides.map(
              (slide) => ({
                ...slide,
                image: undefined,
              })
            ),
        };

      setPresentation(
        presentationWithoutImages
      );

      await generateImages(
        presentationWithoutImages
      );
    };

  // ==========================================
  // DELETE HISTORY
  // ==========================================

  const deleteHistoryPresentation = (
    id: string
  ) => {
    setHistory(
      (previousHistory) => {
        const updatedHistory =
          previousHistory.filter(
            (item) =>
              item.id !== id
          );

        localStorage.setItem(
          HISTORY_KEY,
          JSON.stringify(
            updatedHistory
          )
        );

        return updatedHistory;
      }
    );

    if (
      presentation &&
      "id" in presentation &&
      presentation.id === id
    ) {
      setPresentation(null);
      setCurrentSlide(0);
    }
  };

  // ==========================================
  // CLEAR HISTORY
  // ==========================================

  const clearHistory = () => {
    const confirmed =
      window.confirm(
        "Delete all presentation history?"
      );

    if (!confirmed) return;

    localStorage.removeItem(
      HISTORY_KEY
    );

    setHistory([]);
  };

  // ==========================================
  // NEW PRESENTATION
  // ==========================================

  const newPresentation = () => {
    setPresentation(null);
    setCurrentSlide(0);
    setError("");
    setImageProgress(0);
    setGeneratingImages(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // SLIDE NAVIGATION
  // ==========================================

  const nextSlide = () => {
    if (!presentation) return;

    setCurrentSlide(
      (prev) =>
        prev ===
        presentation.slides.length - 1
          ? 0
          : prev + 1
    );
  };

  const previousSlide = () => {
    if (!presentation) return;

    setCurrentSlide(
      (prev) =>
        prev === 0
          ? presentation.slides.length -
            1
          : prev - 1
    );
  };

  const selectSlide = (
    index: number
  ) => {
    setCurrentSlide(index);
  };

  // ==========================================
  // EXPORT POWERPOINT
  // ==========================================

  const exportToPptx =
    async () => {
      if (
        !presentation ||
        exporting
      ) {
        return;
      }

      setExporting(true);
      setError("");

      try {
        const pptx =
          new pptxgen();

        const activeStyle =
          presentation.style ||
          "dark";

        const config =
          STYLE_CONFIG[
            activeStyle
          ];

        pptx.layout =
          "LAYOUT_WIDE";

        pptx.author =
          "SlideForge";

        pptx.company =
          "SlideForge";

        pptx.subject =
          presentation.description;

        pptx.title =
          presentation.title;

        pptx.lang =
          "en-US";

        pptx.theme = {
          headFontFace:
            "Aptos Display",
          bodyFontFace:
            "Aptos",
          lang: "en-US",
        };

        presentation.slides.forEach(
          (slideData, index) => {
            const slide =
              pptx.addSlide();

            slide.background = {
              color:
                config.pptBackground,
            };

            // TOP GLOW
            slide.addShape(
              pptx.ShapeType
                .ellipse,
              {
                x: 8.2,
                y: -1.0,
                w: 5.0,
                h: 4.0,
                fill: {
                  color:
                    config.pptAccent,
                  transparency: 84,
                },
                line: {
                  color:
                    config.pptAccent,
                  transparency: 100,
                },
              }
            );

            // BOTTOM GLOW
            slide.addShape(
              pptx.ShapeType
                .ellipse,
              {
                x: -1.2,
                y: 5.2,
                w: 4.0,
                h: 3.0,
                fill: {
                  color:
                    activeStyle ===
                    "futuristic"
                      ? "06B6D4"
                      : "2563EB",
                  transparency: 90,
                },
                line: {
                  color:
                    activeStyle ===
                    "futuristic"
                      ? "06B6D4"
                      : "2563EB",
                  transparency: 100,
                },
              }
            );

            // SLIDE NUMBER
            slide.addText(
              String(
                index + 1
              ).padStart(2, "0"),
              {
                x: 11.8,
                y: 0.45,
                w: 0.7,
                h: 0.3,
                fontFace:
                  "Aptos",
                fontSize: 10,
                bold: true,
                color:
                  "52525B",
                align: "right",
                margin: 0,
              }
            );

            // ACCENT LINE
            slide.addShape(
              pptx.ShapeType.line,
              {
                x: 0.8,
                y: 1.05,
                w: 0.55,
                h: 0,
                line: {
                  color:
                    config.pptAccent,
                  width: 2,
                },
              }
            );

            // LABEL
            slide.addText(
              `SLIDE ${index + 1}`,
              {
                x: 1.5,
                y: 0.88,
                w: 1.2,
                h: 0.25,
                fontFace:
                  "Aptos",
                fontSize: 9,
                bold: true,
                color:
                  config.pptAccent,
                charSpacing: 2,
                margin: 0,
              }
            );

            // TITLE
            slide.addText(
              slideData.title,
              {
                x: 0.8,
                y: 1.45,
                w: slideData.image
                  ? 7.0
                  : 8.9,
                h: 1.0,
                fontFace:
                  "Aptos Display",
                fontSize: 29,
                bold: true,
                color: "FFFFFF",
                margin: 0,
                breakLine: false,
                fit: "shrink",
              }
            );

            // SUBTITLE
            slide.addText(
              slideData.subtitle,
              {
                x: 0.8,
                y: 2.55,
                w: slideData.image
                  ? 6.8
                  : 8.5,
                h: 0.65,
                fontFace:
                  "Aptos",
                fontSize: 14,
                color:
                  "A1A1AA",
                margin: 0,
                breakLine: false,
                fit: "shrink",
              }
            );

            // BULLETS
            const bulletText =
              slideData.bullets.map(
                (bullet) => ({
                  text: bullet,
                  options: {
                    bullet: {
                      indent: 14,
                    },
                    hanging: 4,
                  },
                })
              );

            slide.addText(
              bulletText,
              {
                x: 0.95,
                y: 3.55,
                w: slideData.image
                  ? 6.6
                  : 7.4,
                h: 2.4,
                fontFace:
                  "Aptos",
                fontSize: 15,
                color:
                  "D4D4D8",
                breakLine: true,
                paraSpaceAfterPt: 13,
                margin: 0,
                valign: "mid",
                fit: "shrink",
              }
            );

            // AI IMAGE
            if (
              slideData.image
            ) {
              slide.addShape(
                pptx.ShapeType
                  .roundRect,
                {
                  x: 8.0,
                  y: 1.55,
                  w: 4.25,
                  h: 4.65,
                  rectRadius:
                    0.08,
                  fill: {
                    color:
                      "FFFFFF",
                    transparency: 100,
                  },
                  line: {
                    color:
                      config.pptAccent,
                    transparency: 70,
                    width: 1,
                  },
                }
              );

              slide.addImage({
                data:
                  slideData.image,
                x: 8.08,
                y: 1.63,
                w: 4.09,
                h: 4.49,
              });
            } else {
              // VISUAL PLACEHOLDER
              slide.addShape(
                pptx.ShapeType
                  .roundRect,
                {
                  x: 9.25,
                  y: 3.45,
                  w: 3.15,
                  h: 2.35,
                  rectRadius:
                    0.08,
                  fill: {
                    color:
                      "FFFFFF",
                    transparency: 94,
                  },
                  line: {
                    color:
                      config.pptAccent,
                    transparency: 80,
                    width: 1,
                  },
                }
              );

              slide.addText(
                "VISUAL",
                {
                  x: 9.55,
                  y: 3.72,
                  w: 1.0,
                  h: 0.25,
                  fontFace:
                    "Aptos",
                  fontSize: 8,
                  bold: true,
                  color:
                    "52525B",
                  charSpacing: 2,
                  margin: 0,
                }
              );

              slide.addText(
                slideData.visual,
                {
                  x: 9.55,
                  y: 4.15,
                  w: 2.55,
                  h: 1.15,
                  fontFace:
                    "Aptos",
                  fontSize: 11,
                  color:
                    "A1A1AA",
                  margin: 0,
                  valign: "mid",
                  fit: "shrink",
                }
              );
            }

            // FOOTER
            slide.addText(
              "SLIDEFORGE",
              {
                x: 0.8,
                y: 7.0,
                w: 1.5,
                h: 0.2,
                fontFace:
                  "Aptos",
                fontSize: 7,
                bold: true,
                color:
                  "3F3F46",
                charSpacing: 1.5,
                margin: 0,
              }
            );

            slide.addText(
              `${index + 1} / ${presentation.slides.length}`,
              {
                x: 11.0,
                y: 7.0,
                w: 1.4,
                h: 0.2,
                fontFace:
                  "Aptos",
                fontSize: 7,
                color:
                  "3F3F46",
                align: "right",
                margin: 0,
              }
            );
          }
        );

        // SAFE FILE NAME
        const safeTitle =
          presentation.title
            .replace(
              /[<>:"/\\|?*]+/g,
              ""
            )
            .trim()
            .slice(0, 80);

        const fileName =
          `${
            safeTitle ||
            "SlideForge-Presentation"
          }.pptx`;

        await pptx.writeFile({
          fileName,
        });
      } catch (err) {
        console.error(
          "PPTX export error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Не удалось экспортировать презентацию."
        );
      } finally {
        setExporting(false);
      }
    };

  const activeSlide =
    presentation?.slides[
      currentSlide
    ];

  const activeStyle =
    presentation?.style ||
    style;

  const styleConfig =
    STYLE_CONFIG[activeStyle];

  const focusPrompt = () => {
    promptRef.current?.focus();
    promptRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05060a] text-white selection:bg-violet-500/30">
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -18px, 0) scale(1.03); }
        }

        @keyframes float-reverse {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(18px, 14px, 0) scale(0.97); }
        }

        @keyframes grid-drift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(60px, 60px, 0); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }

        @keyframes pulse-ring {
          0%, 100% { opacity: .16; transform: scale(.94) rotate(0deg); }
          50% { opacity: .42; transform: scale(1.03) rotate(8deg); }
        }

        @keyframes aurora-sweep {
          0% { transform: translate3d(-18%, 8%, 0) rotate(-12deg) scale(1); opacity: .22; }
          50% { transform: translate3d(12%, -6%, 0) rotate(8deg) scale(1.12); opacity: .42; }
          100% { transform: translate3d(-18%, 8%, 0) rotate(-12deg) scale(1); opacity: .22; }
        }

        @keyframes orb-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          25% { transform: translate3d(70px, -35px, 0) scale(1.08); }
          50% { transform: translate3d(20px, 55px, 0) scale(.94); }
          75% { transform: translate3d(-65px, 20px, 0) scale(1.06); }
        }

        @keyframes particle-float {
          0%, 100% { transform: translate3d(0, 20px, 0) scale(.7); opacity: 0; }
          15% { opacity: .65; }
          50% { transform: translate3d(35px, -80px, 0) scale(1); opacity: .9; }
          85% { opacity: .35; }
        }

        @keyframes beam-move {
          0% { transform: translateX(-65%) rotate(-18deg); opacity: 0; }
          20% { opacity: .22; }
          50% { opacity: .5; }
          80% { opacity: .2; }
          100% { transform: translateX(65%) rotate(-18deg); opacity: 0; }
        }

        .slideforge-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: grid-drift 22s linear infinite;
        }

        .slideforge-float {
          animation: float-slow 8s ease-in-out infinite;
        }

        .slideforge-float-reverse {
          animation: float-reverse 10s ease-in-out infinite;
        }

        .slideforge-ring {
          animation: pulse-ring 7s ease-in-out infinite;
        }

        .slideforge-aurora {
          animation: aurora-sweep 14s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .slideforge-orb {
          animation: orb-drift 16s ease-in-out infinite;
          will-change: transform;
        }

        .slideforge-particle {
          animation: particle-float 6s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .slideforge-beam {
          animation: beam-move 11s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .slideforge-shimmer {
          animation: shimmer 3.5s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient animated background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(124,58,237,0.30),transparent_30%),radial-gradient(circle_at_8%_42%,rgba(37,99,235,0.22),transparent_27%),radial-gradient(circle_at_92%_36%,rgba(217,70,239,0.18),transparent_27%),radial-gradient(circle_at_52%_85%,rgba(6,182,212,0.12),transparent_25%)]" />
        <div className="slideforge-grid absolute -inset-32 opacity-55 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

        <div className="slideforge-aurora absolute -left-[20%] top-[8%] h-[48vh] w-[80vw] rounded-full bg-gradient-to-r from-violet-600/0 via-violet-500/25 to-fuchsia-500/0 blur-[90px]" />
        <div className="slideforge-aurora absolute -right-[25%] top-[34%] h-[42vh] w-[75vw] rounded-full bg-gradient-to-r from-cyan-500/0 via-blue-500/20 to-violet-500/0 blur-[100px]" style={{ animationDelay: "-7s" }} />

        <div className="slideforge-orb absolute left-[4%] top-[12%] h-80 w-80 rounded-full bg-violet-500/20 blur-[95px]" />
        <div className="slideforge-orb absolute right-[2%] top-[22%] h-96 w-96 rounded-full bg-blue-500/18 blur-[110px]" style={{ animationDelay: "-5s" }} />
        <div className="slideforge-orb absolute bottom-[-120px] left-[32%] h-[460px] w-[460px] rounded-full bg-fuchsia-500/16 blur-[120px]" style={{ animationDelay: "-10s" }} />

        <div className="slideforge-beam absolute left-[-25%] top-[34%] h-24 w-[150%] bg-gradient-to-r from-transparent via-violet-400/25 to-transparent blur-2xl" />
        <div className="slideforge-beam absolute left-[-25%] top-[68%] h-20 w-[150%] bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent blur-2xl" style={{ animationDelay: "-5s" }} />

        <div className="absolute left-1/2 top-[9%] h-[620px] w-[620px] -translate-x-1/2 rounded-full border border-violet-300/[0.10] shadow-[0_0_120px_rgba(139,92,246,0.10)] slideforge-ring" />
        <div className="absolute left-1/2 top-[15%] h-[450px] w-[450px] -translate-x-1/2 rounded-full border border-cyan-300/[0.07] slideforge-ring" style={{ animationDelay: "-2s" }} />

        <div className="absolute inset-0">
          {Array.from({ length: 24 }).map((_, index) => (
            <span
              key={index}
              className="slideforge-particle absolute h-1 w-1 rounded-full bg-white shadow-[0_0_12px_rgba(167,139,250,0.9)]"
              style={{
                left: `${(index * 37) % 100}%`,
                top: `${12 + ((index * 53) % 76)}%`,
                animationDelay: `${-(index % 8) * 0.75}s`,
                animationDuration: `${5 + (index % 5)}s`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Desktop left rail */}
      <aside className="fixed left-5 top-5 z-50 hidden h-[calc(100vh-40px)] w-[210px] flex-col rounded-[28px] border border-white/10 bg-[#090a10]/75 p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl lg:flex">
        <button
          type="button"
          onClick={newPresentation}
          className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white text-black shadow-lg shadow-white/10">
            <span className="absolute h-5 w-5 rotate-45 rounded-[5px] border-[3px] border-black/80" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-black" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-[0.14em]">SLIDEFORGE</span>
            <span className="mt-0.5 block text-[9px] uppercase tracking-[0.18em] text-zinc-600">AI presentation studio</span>
          </span>
        </button>

        <div className="my-5 h-px bg-white/10" />

        <nav className="space-y-1">
          {[
            ["Home", "⌂", () => newPresentation()],
            ["Features", "✦", () => scrollToSection("features")],
            ["Templates", "◇", () => scrollToSection("templates")],
            ["History", "◷", () => scrollToSection("history")],
            ["Pricing", "◆", () => scrollToSection("pricing")],
          ].map(([label, icon, action]) => (
            <button
              key={String(label)}
              type="button"
              onClick={action as () => void}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
            >
              <span className="w-5 text-center text-xs text-zinc-600 transition group-hover:text-violet-300">
                {String(icon)}
              </span>
              {String(label)}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-violet-400/10 bg-violet-500/[0.05] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/80">
            Built for ideas
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Turn one prompt into a complete visual story.
          </p>
        </div>
      </aside>

      {/* Top bar */}
      <header className="relative z-40 px-5 py-5 lg:ml-[240px] lg:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2 backdrop-blur-xl lg:bg-transparent lg:border-transparent lg:px-0 lg:py-0">
          {/* Mobile logo */}
          <button
            type="button"
            onClick={newPresentation}
            className="flex items-center gap-2 lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-black">
              ✦
            </span>
            <span className="text-sm font-bold tracking-[0.14em]">SLIDEFORGE</span>
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-400 sm:flex">
              <span className="text-zinc-600">◎</span>
              <select
                aria-label="Interface language"
                defaultValue="EN"
                className="cursor-pointer bg-transparent text-xs text-zinc-300 outline-none"
              >
                <option value="EN" className="bg-[#0b0c11]">EN</option>
                <option value="RU" className="bg-[#0b0c11]">RU</option>
                <option value="UZ" className="bg-[#0b0c11]">UZ</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => setError("Authentication will be connected in the next step.")}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              Log in
            </button>

            <button
              type="button"
              onClick={focusPrompt}
              className="group relative overflow-hidden rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-xl shadow-white/10 transition hover:-translate-y-0.5 hover:bg-zinc-200 active:translate-y-0 sm:px-5"
            >
              <span className="relative z-10">Try free</span>
              <span className="slideforge-shimmer absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/50 blur-md" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO / LANDING */}
      {!presentation && (
        <>
          <section className="relative z-10 mx-auto min-h-[calc(100vh-86px)] max-w-[1500px] px-5 pb-24 lg:ml-[240px] lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-110px)] max-w-6xl flex-col items-center justify-center text-center">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 backdrop-blur-xl">
                <span className="flex h-1.5 w-1.5 rounded-full bg-violet-400 shadow-lg shadow-violet-400/70" />
                The future of presentations
                <span className="text-zinc-700">/</span>
                AI powered
              </div>

              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[88px]">
                Your idea.
                <br />
                <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                  Beautifully presented.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-500 sm:text-lg">
                Create a complete presentation from a single idea.
                <span className="text-zinc-300"> SlideForge writes the story, builds the structure and creates the visuals.</span>
              </p>

              {/* Main prompt */}
              <div id="generator" className="relative mt-11 w-full max-w-4xl">
                <div className="absolute -inset-5 rounded-[38px] bg-violet-500/[0.06] blur-2xl" />
                <div className="relative rounded-[30px] border border-white/10 bg-[#090b11]/85 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl transition duration-500 hover:border-white/20">
                  <div className="relative overflow-hidden rounded-[23px] border border-white/[0.07] bg-[#0d0f15]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

                    <div className="flex items-center justify-between px-5 pt-5 text-left">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        <span className="text-violet-400">✦</span>
                        Create with AI
                      </div>
                      <span className="text-[10px] text-zinc-700">CTRL + ENTER</span>
                    </div>

                    <textarea
                      ref={promptRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          generatePresentation();
                        }
                      }}
                      placeholder="Describe the presentation you want to create..."
                      className="min-h-[145px] w-full resize-none bg-transparent px-5 pb-2 pt-4 text-base leading-7 text-white outline-none placeholder:text-zinc-600 sm:text-lg"
                    />

                    <div className="flex flex-col gap-3 border-t border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] text-zinc-400">
                          6 slides
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] text-zinc-400">
                          16:9
                        </span>
                        <span className="rounded-full border border-violet-400/15 bg-violet-500/[0.06] px-3 py-1.5 text-[11px] text-violet-300">
                          ✦ AI visuals
                        </span>
                        <span className="hidden rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] text-zinc-500 sm:inline-flex">
                          {STYLE_CONFIG[style].label}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={generatePresentation}
                        disabled={loading || generatingImages || !prompt.trim()}
                        className="group relative overflow-hidden rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-black shadow-xl shadow-white/10 transition hover:-translate-y-0.5 hover:bg-zinc-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="relative z-10">
                          {loading ? "Building..." : "Generate presentation"}
                          <span className="ml-2">{loading ? "◌" : "✦"}</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick style row */}
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {STYLE_OPTIONS.map((option) => {
                    const selected = style === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setStyle(option.id)}
                        className={`rounded-full border px-3.5 py-2 text-xs transition ${
                          selected
                            ? "border-violet-400/30 bg-violet-500/10 text-violet-300"
                            : "border-white/10 bg-white/[0.025] text-zinc-600 hover:border-white/20 hover:text-zinc-300"
                        }`}
                      >
                        {option.icon} {option.name}
                      </button>
                    );
                  })}
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-left text-sm text-red-300">
                    {error}
                  </div>
                )}
              </div>

              {/* Trust strip */}
              <div id="features" className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs text-zinc-600">
                <span>✦ Intelligent structure</span>
                <span>✦ Topic-aware content</span>
                <span>✦ AI-generated visuals</span>
                <span>✦ PPTX export</span>
                <span>✦ Local history</span>
              </div>

              <div className="mt-14 grid w-full max-w-3xl grid-cols-3 gap-2 sm:gap-3">
                {[
                  ["01", "Idea", "Start with a prompt"],
                  ["02", "Story", "AI builds the narrative"],
                  ["03", "Slides", "Visuals complete the deck"],
                ].map(([number, title, text]) => (
                  <div
                    key={number}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left backdrop-blur-xl"
                  >
                    <span className="text-[10px] font-semibold tracking-[0.18em] text-violet-400">{number}</span>
                    <p className="mt-3 text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-zinc-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Templates */}
          <section
            id="templates"
            className="relative z-10 mx-auto max-w-[1500px] scroll-mt-10 px-5 pb-32 lg:ml-[240px] lg:px-8"
          >
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Explore the possibilities</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">One idea. Many directions.</h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-zinc-600">
                  SlideForge adapts the story to the subject instead of forcing every topic into the same template.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Technology", "The Future of AI", "Context → systems → impact → what comes next", "from-violet-500/20"],
                  ["Business", "Startup Strategy", "Problem → market → solution → action", "from-blue-500/20"],
                  ["Science", "Exploring Space", "Discovery → mechanism → evidence → implications", "from-fuchsia-500/20"],
                ].map(([category, title, text, glow]) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setPrompt(
                        category === "Technology"
                          ? "The future of artificial intelligence"
                          : category === "Business"
                          ? "Startup strategy for a new product"
                          : "The future of space exploration"
                      );
                      focusPrompt();
                    }}
                    className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${glow} via-[#0d0f15] to-[#08090d] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-white/20`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[21px] border border-white/10 bg-[#0a0c11] p-6">
                      <div className="absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full bg-white/[0.04] blur-2xl transition group-hover:scale-125" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">{category}</span>
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-2xl font-semibold tracking-tight text-white">{title}</h3>
                        <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-600">{text}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-1 pt-4 text-xs">
                      <span className="text-zinc-600">Use as starting point</span>
                      <span className="text-zinc-400 transition group-hover:translate-x-1">→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Generated presentation */}
      {presentation && activeSlide && (
        <section className="relative z-10 mx-auto max-w-[1500px] px-5 pb-32 lg:ml-[240px] lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${styleConfig.accent}`}>
                  Generated presentation
                </p>
                <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl">{presentation.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{presentation.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs ${styleConfig.accent}`}>
                    ✦ {STYLE_CONFIG[activeStyle].label}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-500">
                    {presentation.slides.length} slides
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={newPresentation}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                ← New presentation
              </button>
            </div>

            {generatingImages && (
              <div className="mx-auto mb-6 max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Creating AI visuals</p>
                    <p className="mt-1 text-xs text-zinc-500">Generating a unique image for each slide...</p>
                  </div>
                  <span className={`text-sm font-semibold ${styleConfig.accent}`}>
                    {imageProgress}/{presentation.slides.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${styleConfig.accentBg}`}
                    style={{
                      width: `${presentation.slides.length ? (imageProgress / presentation.slides.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {!generatingImages && presentation.slides.some((slide) => slide.image) && (
              <div className="mb-5 flex justify-center">
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/5 px-4 py-2 text-xs text-emerald-300">
                  ✦ AI visuals ready
                </span>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
                <div className="mb-3 px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Slides</p>
                  <p className="mt-1 text-sm text-zinc-400">{presentation.slides.length} slides</p>
                </div>

                <div className="space-y-2">
                  {presentation.slides.map((slide, index) => (
                    <button
                      key={index}
                      onClick={() => selectSlide(index)}
                      className={`group w-full rounded-2xl border p-2 text-left transition ${
                        currentSlide === index
                          ? "border-violet-400/50 bg-violet-500/10"
                          : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-[#10121a]">
                        {slide.image && (
                          <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="relative flex h-full flex-col justify-between p-3">
                          <div className={`text-[7px] font-medium uppercase tracking-wider ${styleConfig.accent}`}>Slide {index + 1}</div>
                          <div className="line-clamp-2 text-[10px] font-semibold leading-tight text-white">{slide.title}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>

              <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Presentation preview</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      16:9 · {STYLE_CONFIG[activeStyle].label} theme
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={previousSlide}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-zinc-300 transition hover:bg-white/10 hover:text-white"
                      aria-label="Previous slide"
                    >
                      ←
                    </button>
                    <div className="min-w-[70px] text-center text-sm text-zinc-400">
                      {currentSlide + 1}
                      <span className="mx-1 text-zinc-700">/</span>
                      {presentation.slides.length}
                    </div>
                    <button
                      onClick={nextSlide}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-zinc-300 transition hover:bg-white/10 hover:text-white"
                      aria-label="Next slide"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0d12] p-2 shadow-2xl shadow-black/50">
                  <div className={`relative aspect-video overflow-hidden rounded-[22px] border border-white/10 ${styleConfig.background}`}>
                    {activeSlide.image && (
                      <>
                        <img src={activeSlide.image} alt={activeSlide.title} className="absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/60" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
                      </>
                    )}

                    {!activeSlide.image && (
                      <>
                        <div className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-[90px] ${styleConfig.accentBg}/20`} />
                        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-blue-500/10 blur-[90px]" />
                      </>
                    )}

                    <div className="absolute right-8 top-8 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                      {String(currentSlide + 1).padStart(2, "0")}
                    </div>

                    <div className="relative flex h-full flex-col justify-between p-8 sm:p-12 lg:p-16">
                      <div>
                        <div className="mb-6 flex items-center gap-3">
                          <div className={`h-px w-8 ${styleConfig.accentBg}`} />
                          <span className={`text-xs font-medium uppercase tracking-[0.25em] ${styleConfig.accent}`}>
                            Slide {currentSlide + 1}
                          </span>
                        </div>

                        <h3 className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
                          {activeSlide.title}
                        </h3>

                        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 drop-shadow sm:text-base">
                          {activeSlide.subtitle}
                        </p>
                      </div>

                      <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-end">
                        <div>
                          <ul className="space-y-3">
                            {activeSlide.bullets.map((bullet, index) => (
                              <li key={index} className="flex gap-3 text-sm leading-6 text-zinc-200 drop-shadow sm:text-base">
                                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${styleConfig.accentBg}`} />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {!activeSlide.image && (
                          <div className={`rounded-2xl border p-4 backdrop-blur-xl ${styleConfig.card}`}>
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">Visual</p>
                            <p className="mt-2 text-sm leading-5 text-zinc-400">{activeSlide.visual}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {presentation.slides.map((slide, index) => (
                      <button
                        key={index}
                        onClick={() => selectSlide(index)}
                        className={`h-1.5 rounded-full transition-all ${
                          currentSlide === index
                            ? `w-8 ${styleConfig.accentBg}`
                            : slide.image
                            ? "w-2 bg-zinc-500 hover:bg-zinc-300"
                            : "w-2 bg-zinc-700 hover:bg-zinc-500"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={regenerateImages}
                      disabled={generatingImages}
                      className="rounded-xl border border-violet-400/20 bg-violet-500/5 px-4 py-2.5 text-sm text-violet-300 transition hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generatingImages ? `Generating ${imageProgress}/${presentation.slides.length}...` : "Generate visuals"}
                    </button>

                    <button
                      onClick={newPresentation}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
                    >
                      New presentation
                    </button>

                    <button
                      onClick={exportToPptx}
                      disabled={exporting}
                      className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {exporting ? "Exporting..." : "Export PPTX"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* History */}
      <section
        id="history"
        className="relative z-10 mx-auto max-w-[1500px] scroll-mt-10 px-5 pb-32 lg:ml-[240px] lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Your creations</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Presentation history</h2>
              <p className="mt-3 text-sm text-zinc-600">Saved locally on this device for now.</p>
            </div>

            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10"
              >
                Clear history
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.025] px-6 py-16 text-center backdrop-blur-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">✦</div>
              <h3 className="mt-5 text-xl font-semibold text-white">No presentations yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
                Generate your first presentation and it will appear here.
              </p>
              <button
                onClick={focusPrompt}
                className="mt-6 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Create your first deck
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {history.map((item) => {
                const itemStyle = item.style || "dark";
                const itemConfig = STYLE_CONFIG[itemStyle];

                return (
                  <div
                    key={item.id}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20"
                  >
                    <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${itemConfig.gradient} p-5`}>
                      <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-[#10121a] p-5">
                        <div>
                          <div className={`text-[10px] font-medium uppercase tracking-[0.2em] ${itemConfig.accent}`}>SlideForge</div>
                          <h3 className="mt-4 line-clamp-2 text-xl font-semibold leading-tight text-white">{item.title}</h3>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{item.description}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-zinc-600">
                          <span>{item.slides.length} slides</span>
                          <span className={itemConfig.accent}>{itemConfig.label}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="line-clamp-1 font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-xs text-zinc-600">{new Date(item.createdAt).toLocaleString()}</p>

                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={() => openHistoryPresentation(item)}
                          className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => deleteHistoryPresentation(item.id)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-red-500/10 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Pricing preview / footer */}
      <footer
        id="pricing"
        className="relative z-10 border-t border-white/10 px-5 py-12 lg:ml-[240px] lg:px-8"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-black">✦</span>
              <span className="text-sm font-bold tracking-[0.14em]">SLIDEFORGE</span>
            </div>
            <p className="mt-3 text-xs text-zinc-600">AI presentation studio · 2026</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
            <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-2">4 credits</span>
            <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-2">6 credits</span>
            <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-2">8 credits</span>
            <span className="rounded-full border border-violet-400/10 bg-violet-500/[0.04] px-3 py-2 text-violet-300">Billing coming next</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
