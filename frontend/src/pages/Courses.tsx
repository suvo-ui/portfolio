import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  CalendarClock,
  Clapperboard,
  Clock3,
  Layers3,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { fadeUp, scaleIn, stagger, hoverLift, buttonTap } from "@/lib/motion";

interface CoursePage {
  id: boolean;
  markdown: string;
  video_path?: string | null;
  video_url?: string | null;
  updated_at?: string | null;
}

interface Workshop {
  id: number;
  title: string;
  description?: string | null;
  date: string;
  duration?: string | null;
  price?: number | null;
  max_seats?: number | null;
  image_url?: string | null;
  video_url?: string | null;
  is_active?: boolean;
  created_at?: string | null;
}

const shellClassName =
  "relative overflow-hidden border border-primary/16 bg-[linear-gradient(180deg,hsl(var(--card)/0.94),hsl(var(--background)/0.96))] shadow-[0_30px_90px_hsl(0_0%_0%/0.34)] backdrop-blur-xl";

const formatLongDate = (value?: string | null) => {
  if (!value) return "Being updated";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Being updated";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatShortDate = (value?: string | null) => {
  if (!value) return "Date to be announced";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatPrice = (value?: number | null) => {
  if (!value) return "On request";
  return `INR ${value.toLocaleString()}`;
};

const extractLeadParagraph = (markdown: string) => {
  return (
    markdown
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith("#") && !line.startsWith("-")) ||
    "A studio-built learning page shaped around atmosphere, process, and practical growth."
  );
};

export default function Courses() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [course, setCourse] = useState<CoursePage | null | undefined>(
    undefined,
  );
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    new Set(),
  );

  type CourseModule = {
    title: string;
    description: string;
    lessons: { title: string; details: string }[];
  };

  const parseCourseModules = (markdown: string): CourseModule[] => {
    const lines = markdown.split(/\r?\n/);
    const modules: CourseModule[] = [];
    let currentModule: CourseModule | null = null;
    let currentLesson: { title: string; details: string } | null = null;

    for (const line of lines) {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);

      if (h2Match) {
        if (currentLesson && currentModule) {
          currentModule.lessons.push(currentLesson);
          currentLesson = null;
        }
        if (currentModule) modules.push(currentModule);

        currentModule = { title: h2Match[1], description: "", lessons: [] };
      } else if (h3Match) {
        if (!currentModule) continue;
        if (currentLesson) {
          currentModule.lessons.push(currentLesson);
        }
        currentLesson = { title: h3Match[1], details: "" };
      } else {
        if (currentLesson) {
          currentLesson.details += (currentLesson.details ? "\n" : "") + line;
        } else if (currentModule) {
          currentModule.description +=
            (currentModule.description ? "\n" : "") + line;
        }
      }
    }

    if (currentLesson && currentModule) {
      currentModule.lessons.push(currentLesson);
    }
    if (currentModule) modules.push(currentModule);

    return modules;
  };

  const modules = course ? parseCourseModules(course.markdown) : [];
  const moduleCount = modules.length;
  const focusCount = modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0,
  );

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/course`)
      .then((res) => res.json())
      .then(setCourse)
      .catch(() => setCourse(null));

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/workshops`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setWorkshops(data);
        else if (Array.isArray(data?.data)) setWorkshops(data.data);
        else setWorkshops([]);
      })
      .catch(() => setWorkshops([]));
  }, []);

  useEffect(() => {
    if (location.pathname !== "/courses") return;
    if (!location.hash) return;

    const anchor = location.hash.replace("#", "");
    const target = document.getElementById(anchor);
    if (!target) {
      const tm = setTimeout(() => {
        document
          .getElementById(anchor)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => clearTimeout(tm);
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.pathname, location.hash]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this workshop?")) return;

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/workshops/${id}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      alert(data?.error || "Failed to delete workshop");
      return;
    }

    setWorkshops((prev) => prev.filter((workshop) => workshop.id !== id));
  };

  const toggleSection = (index: number) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (course === undefined) {
    return (
      <Layout>
        <div className="relative min-h-screen overflow-hidden bg-background pt-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,hsl(var(--primary)/0.18),transparent_22%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card))_100%)]" />
          <div className="relative flex min-h-[70vh] items-center justify-center px-6">
            <div className="border border-primary/18 bg-card/55 px-8 py-8 text-center shadow-[0_24px_80px_hsl(0_0%_0%/0.32)] backdrop-blur-xl">
              <p className="font-display text-[11px] uppercase tracking-[0.34em] text-primary">
                Loading
              </p>
              <div className="mx-auto mt-5 h-12 w-12 rounded-full border border-primary/25 border-t-primary animate-spin" />
              <p className="mt-5 text-sm text-muted-foreground">
                Preparing the learning experience.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (course === null) {
    return (
      <Layout>
        <div className="relative min-h-screen overflow-hidden bg-background pt-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,hsl(var(--primary)/0.16),transparent_24%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card))_100%)]" />
          <div className="relative flex min-h-[70vh] items-center justify-center px-6">
            <div className="max-w-xl border border-border/60 bg-card/55 p-8 text-center shadow-[0_24px_80px_hsl(0_0%_0%/0.32)] backdrop-blur-xl">
              <p className="font-display text-[11px] uppercase tracking-[0.34em] text-primary">
                Learning Page
              </p>
              <h1 className="mt-5 font-display text-4xl text-foreground">
                Course not available.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                The course content is being rearranged right now. Please check
                back soon.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const videoUrl = course.video_url || null;
  const leadParagraph = extractLeadParagraph(course.markdown);
  const liveWorkshops = workshops.filter(
    (workshop) => workshop.is_active !== false,
  );
  const now = Date.now();
  const nextWorkshop =
    [...liveWorkshops]
      .filter((workshop) => new Date(workshop.date).getTime() >= now)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )[0] ||
    liveWorkshops[0] ||
    null;
  const totalSeats = liveWorkshops.reduce(
    (sum, workshop) => sum + (Number(workshop.max_seats) || 0),
    0,
  );
  const heroStats = [
    {
      label: "Modules",
      value: String(moduleCount || 0).padStart(2, "0"),
      copy: "Structured sections inside the course body.",
    },
    {
      label: "Focus Points",
      value: String(focusCount || 0).padStart(2, "0"),
      copy: "Distinct practice areas guiding the learning flow.",
    },
    {
      label: "Live Workshops",
      value: String(liveWorkshops.length || 0).padStart(2, "0"),
      copy: nextWorkshop
        ? `Next drop: ${formatShortDate(nextWorkshop.date)}`
        : "New sessions are being arranged.",
    },
    {
      label: "Open Seats",
      value: String(totalSeats || 0).padStart(2, "0"),
      copy:
        totalSeats > 0
          ? "Current workshop capacity across live sessions."
          : "Seats will appear as workshops go live.",
    },
  ];

  return (
    <Layout>
      <div className="relative overflow-hidden bg-background pt-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,hsl(var(--primary)/0.16),transparent_22%),radial-gradient(circle_at_82%_12%,hsl(var(--accent)/0.12),transparent_20%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card))_100%)]" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(hsl(var(--foreground)/0.12)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.12)_1px,transparent_1px)] [background-size:120px_120px]" />
          <motion.div
            className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-primary/18 blur-3xl"
            animate={{
              x: [0, 48, -14, 0],
              y: [0, 34, 10, 0],
              scale: [1, 1.08, 0.96, 1],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[-7rem] top-36 h-[26rem] w-[26rem] rounded-full bg-orange-500/10 blur-3xl"
            animate={{
              x: [0, -42, 18, 0],
              y: [0, -20, 16, 0],
              scale: [0.95, 1.06, 1, 0.95],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative"
        >
          <section className="container mx-auto px-6 pb-14 pt-10 lg:px-12 lg:pb-18 lg:pt-16">
            <div className="grid gap-10 xl:grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)] xl:items-start">
              <motion.div variants={fadeUp} className="max-w-4xl">
                <div className="inline-flex items-center gap-3 border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-md">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-display text-[11px] uppercase tracking-[0.34em] text-primary">
                    Learning Studio
                  </span>
                </div>

                <h1 className="mt-7 max-w-4xl font-display text-5xl font-bold leading-[0.92] text-foreground sm:text-6xl lg:text-7xl">
                  Learn the visual
                  <span className="block text-gradient">
                    language of impact.
                  </span>
                </h1>

                <p className="mt-7 max-w-2xl text-base leading-relaxed text-foreground/74 sm:text-lg">
                  {leadParagraph}
                </p>

                <div className="mt-9 flex flex-wrap gap-4">
                  <Button
                    variant="gold"
                    size="xl"
                    asChild
                    className="shadow-[0_20px_60px_hsl(var(--primary)/0.22)]"
                  >
                    <Link to="/contact">
                      Join the Learning Line
                      <ArrowUpRight />
                    </Link>
                  </Button>
                  <Button
                    variant="hero"
                    size="xl"
                    asChild
                    className="border-primary/30 bg-background/12"
                  >
                    <Link to="/#about">See Studio Story</Link>
                  </Button>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {heroStats.map((stat) => (
                    <motion.div
                      key={stat.label}
                      variants={fadeUp}
                      className="border border-border/60 bg-card/45 p-5 backdrop-blur-sm"
                    >
                      <p className="font-display text-[11px] uppercase tracking-[0.32em] text-primary">
                        {stat.label}
                      </p>
                      <p className="mt-3 font-display text-4xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {stat.copy}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={scaleIn} className="relative">
                <div className="absolute inset-0 translate-x-4 translate-y-4 border border-primary/16 bg-primary/6" />

                <div className={cn(shellClassName, "relative p-5 sm:p-6")}>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-[11px] uppercase tracking-[0.32em] text-primary">
                        Course Reel
                      </p>
                      <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
                        A page that feels like an opening scene.
                      </h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center border border-primary/20 bg-primary/10">
                      <Clapperboard className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {videoUrl ? (
                    <motion.div
                      variants={scaleIn}
                      className="relative overflow-hidden border border-border/60 bg-background/60"
                    >
                      <video
                        controls
                        className="aspect-[16/10] w-full object-cover"
                        src={videoUrl}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_50%,hsl(var(--background)/0.84)_100%)]" />
                    </motion.div>
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center border border-border/60 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_32%),linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--background))_100%)]">
                      <div className="max-w-xs text-center">
                        <p className="font-display text-[11px] uppercase tracking-[0.32em] text-primary">
                          Lesson Film
                        </p>
                        <p className="mt-4 font-display text-3xl text-foreground">
                          Visual lesson coming soon.
                        </p>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                          The course body is live already. Video media can slide
                          into this frame as soon as it is uploaded.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="border border-border/50 bg-background/40 p-4">
                      <p className="font-display text-[11px] uppercase tracking-[0.3em] text-primary">
                        Last Updated
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-foreground">
                        {formatLongDate(course.updated_at)}
                      </p>
                    </div>
                    <div className="border border-border/50 bg-background/40 p-4">
                      <p className="font-display text-[11px] uppercase tracking-[0.3em] text-primary">
                        Next Workshop
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-foreground">
                        {nextWorkshop
                          ? formatShortDate(nextWorkshop.date)
                          : "New workshop date coming soon."}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="container mx-auto px-6 pb-16 lg:px-12 lg:pb-20">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
              <motion.div
                variants={fadeUp}
                className={cn(shellClassName, "p-6 sm:p-8 lg:p-10")}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                  <div>
                    <p className="font-display text-[11px] uppercase tracking-[0.34em] text-primary">
                      Course Architecture
                    </p>
                    <h2 className="mt-4 max-w-md font-display text-4xl font-bold leading-[0.98] text-foreground">
                      A premium syllabus experience
                      <span className="block text-foreground/72">
                        structured for clarity, progression, and studio-level
                        polish.
                      </span>
                    </h2>
                    <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                      Explore each module with achievable milestones, hands-on
                      lessons, and an organized learning path.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <article className="rounded-xl border border-border/60 bg-background/70 p-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">
                          Modules
                        </p>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                          {moduleCount}
                        </p>
                      </article>
                      <article className="rounded-xl border border-border/60 bg-background/70 p-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">
                          Lessons
                        </p>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                          {focusCount}
                        </p>
                      </article>
                      <article className="rounded-xl border border-border/60 bg-background/70 p-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">
                          Workshops
                        </p>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                          {liveWorkshops.length}
                        </p>
                      </article>
                      <article className="rounded-xl border border-border/60 bg-background/70 p-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">
                          Open Seats
                        </p>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                          {totalSeats}
                        </p>
                      </article>
                    </div>

                    <div className="space-y-3">
                      {modules.map((mod, index) => {
                        const open = !collapsedSections.has(index);
                        return (
                          <article
                            key={`${mod.title}-${index}`}
                            className="group overflow-hidden rounded-2xl border border-border/60 bg-background/70 shadow-sm transition-all hover:shadow-lg"
                          >
                            <button
                              type="button"
                              onClick={() => toggleSection(index)}
                              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                            >
                              <div>
                                <p className="text-xs uppercase tracking-widest text-primary">
                                  Module {index + 1}
                                </p>
                                <h3 className="mt-1 text-xl font-semibold text-foreground">
                                  {mod.title}
                                </h3>
                              </div>
                              <motion.div
                                animate={{ rotate: open ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-muted-foreground"
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </motion.div>
                            </button>

                            <AnimatePresence initial={false}>
                              {open && (
                                <motion.div
                                  key="content"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden border-t border-border/50 px-5 pb-5"
                                >
                                  {mod.description.trim() ? (
                                    <ReactMarkdown
                                      components={{
                                        p: ({ children }) => (
                                          <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                                            {children}
                                          </p>
                                        ),
                                        ul: ({ children }) => (
                                          <div className="ml-4 list-disc text-sm text-foreground">
                                            {children}
                                          </div>
                                        ),
                                        li: ({ children }) => (
                                          <p className="mb-2 text-sm leading-relaxed text-foreground">
                                            {children}
                                          </p>
                                        ),
                                      }}
                                    >
                                      {mod.description}
                                    </ReactMarkdown>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No module description provided yet.
                                    </p>
                                  )}

                                  <div className="mt-3 space-y-2">
                                    {mod.lessons.map((lesson, i) => (
                                      <div
                                        key={`${lesson.title}-${i}`}
                                        className="rounded-xl border border-border/60 bg-card/60 p-4"
                                      >
                                        <p className="text-sm font-semibold text-foreground">
                                          {lesson.title}
                                        </p>
                                        {lesson.details.trim() ? (
                                          <ReactMarkdown
                                            components={{
                                              p: ({ children }) => (
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                  {children}
                                                </p>
                                              ),
                                            }}
                                          >
                                            {lesson.details}
                                          </ReactMarkdown>
                                        ) : (
                                          <p className="mt-1 text-sm text-muted-foreground">
                                            Lesson details not available yet.
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </article>
                        );
                      })}

                      {modules.length === 0 && (
                        <div className="rounded-2xl border border-border/60 bg-card/45 p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            No modules are published yet. The course structure
                            will be added soon.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.aside
                variants={fadeUp}
                className="space-y-5 xl:sticky xl:top-28 xl:self-start"
              >
                <div className={cn(shellClassName, "p-5")}>
                  <p className="font-display text-[11px] uppercase tracking-[0.32em] text-primary">
                    Learning Pulse
                  </p>
                  <div className="mt-5 space-y-4">
                    <div className="border border-border/50 bg-background/38 p-4">
                      <div className="flex items-center gap-3">
                        <Layers3 className="h-4 w-4 text-primary" />
                        <p className="font-display text-sm uppercase tracking-[0.2em] text-foreground">
                          Structured Flow
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {moduleCount > 0
                          ? `${moduleCount} modules arranged to move from foundations into a stronger visual voice.`
                          : "The curriculum is being arranged right now."}
                      </p>
                    </div>

                    <div className="border border-border/50 bg-background/38 p-4">
                      <div className="flex items-center gap-3">
                        <Clock3 className="h-4 w-4 text-primary" />
                        <p className="font-display text-sm uppercase tracking-[0.2em] text-foreground">
                          Rhythm
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        The page balances recorded learning with live workshop
                        energy so it does not feel static.
                      </p>
                    </div>

                    <div className="border border-border/50 bg-background/38 p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-primary" />
                        <p className="font-display text-sm uppercase tracking-[0.2em] text-foreground">
                          Seats
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {totalSeats > 0
                          ? `${totalSeats} open seats are currently visible across live workshops.`
                          : "Workshop seating appears here as soon as sessions are published."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={cn(shellClassName, "p-5")}>
                  <p className="font-display text-[11px] uppercase tracking-[0.32em] text-primary">
                    Next Move
                  </p>
                  <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
                    Keep the momentum going.
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Ask about the course, reserve a workshop seat, or start a
                    commission conversation if you want a more direct studio
                    connection.
                  </p>
                  <div className="mt-5 grid gap-3">
                    <Button variant="gold" size="lg" asChild>
                      <Link to="/contact">
                        Contact the Studio
                        <ArrowUpRight />
                      </Link>
                    </Button>
                    <Button
                      variant="hero"
                      size="lg"
                      asChild
                      className="border-primary/30 bg-background/12"
                    >
                      <Link to="/#gallery">View the Collection</Link>
                    </Button>
                  </div>
                </div>
              </motion.aside>
            </div>
          </section>

          <section
            id="workshops"
            className="container mx-auto px-6 pb-24 lg:px-12"
          >
            <motion.div
              variants={fadeUp}
              className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end"
            >
              <div>
                <p className="font-display text-[11px] uppercase tracking-[0.34em] text-primary">
                  Live Workshops
                </p>
                <h2 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[0.96] text-foreground md:text-5xl lg:text-6xl">
                  The workshop section should feel
                  <span className="block text-foreground/72">
                    like event drops, not cards in a grid.
                  </span>
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
                Each session gets more presence, clearer details, and a stronger
                sense that something time-bound is happening here.
              </p>
            </motion.div>

            {liveWorkshops.length === 0 ? (
              <motion.div
                variants={fadeUp}
                className={cn(shellClassName, "p-8 text-center sm:p-10")}
              >
                <div className="inline-flex items-center gap-3 border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-md mb-6">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-display text-[11px] uppercase tracking-[0.34em] text-primary">
                    Workshop Studio
                  </span>
                </div>
                <p className="font-display text-[11px] uppercase tracking-[0.34em] text-primary">
                  Workshop Update
                </p>
                <h3 className="mt-4 font-display text-3xl text-foreground">
                  New sessions are being composed right now.
                </h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  The page is ready for workshop drops. As soon as a live
                  session is published from the admin side, it will land here
                  with the new presentation.
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {liveWorkshops.map((workshop, index) => {
                  const workshopDate = new Date(workshop.date);
                  const now = new Date();

                  const isUpcoming = workshopDate > now;
                  const isToday =
                    workshopDate.toDateString() === now.toDateString();

                  return (
                    <motion.article
                      key={workshop.id}
                      variants={fadeUp}
                      {...hoverLift}
                      className={cn(
                        shellClassName,
                        "group relative flex h-full flex-col overflow-hidden",
                        index === 0 &&
                          liveWorkshops.length > 2 &&
                          "md:col-span-2 xl:col-span-2",
                      )}
                    >
                      {/* STATUS */}
                      <div className="absolute left-6 top-6 z-10">
                        <div
                          className={cn(
                            "inline-flex items-center gap-2 border px-3 py-1.5 backdrop-blur-md",
                            isToday
                              ? "border-green-500/50 bg-green-500/14 text-green-300"
                              : isUpcoming
                                ? "border-blue-500/50 bg-blue-500/14 text-blue-300"
                                : "border-orange-500/50 bg-orange-500/14 text-orange-300",
                          )}
                        >
                          <span className="text-xs uppercase">
                            {isToday
                              ? "Live Today"
                              : isUpcoming
                                ? "Upcoming"
                                : "Completed"}
                          </span>
                        </div>
                      </div>

                      {/* IMAGE */}
                      {workshop.image_url ? (
                        <motion.img
                          src={workshop.image_url}
                          alt={workshop.title}
                          className="w-full object-cover transition-transform duration-700 group-hover:scale-105 aspect-[4/3]"
                          variants={scaleIn}
                        />
                      ) : (
                        <div className="aspect-[4/3] flex items-center justify-center bg-zinc-800">
                          <p>{workshop.title}</p>
                        </div>
                      )}

                      {/* DELETE BUTTON */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(workshop.id)}
                          className="absolute right-6 top-6 bg-red-500 px-3 py-1 text-xs rounded"
                        >
                          Delete
                        </button>
                      )}

                      {/* CONTENT */}
                      <div className="flex flex-1 flex-col p-6">
                        <h3 className="text-xl font-bold mb-2">
                          {workshop.title}
                        </h3>

                        <p className="text-sm text-zinc-400 mb-4 flex-1">
                          {workshop.description || "Coming soon"}
                        </p>

                        <div className="flex justify-between items-center">
                          <span className="font-bold">
                            {formatPrice(workshop.price)}
                          </span>

                          <motion.div {...buttonTap}>
                            <Button asChild>
                              <Link to="/contact">Reserve →</Link>
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </section>
        </motion.div>
      </div>
    </Layout>
  );
}
