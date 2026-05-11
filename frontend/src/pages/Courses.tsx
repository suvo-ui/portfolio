import { useEffect, useRef, useState, type ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  CalendarClock,
  Clapperboard,
  Clock3,
  Layers3,
  MapPin,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sparkles,
  Users,
  Volume2,
  X,
} from "lucide-react";

import { Layout } from "@/components/Layout";
import LazyImage from "@/components/LazyImage";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { apiUrl } from "@/lib/api";
import type { ImageVariants } from "@/lib/imageVariants";
import { cn } from "@/lib/utils";
import { fadeUp, scaleIn, stagger, hoverLift } from "@/lib/motion";

interface CoursePage {
  id: boolean;
  markdown: string;
  video_path?: string | null;
  video_url?: string | null;
  updated_at?: string | null;
}

interface CourseDemoVideo {
  position: number;
  youtube_url: string;
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
  image_variants?: ImageVariants | null;
  video_url?: string | null;
  venue?: string | null;
  is_active?: boolean;
  completed?: boolean;
  created_at?: string | null;
}

type LegacyFullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type LegacyFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

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

const formatTime = (seconds: number) => {
  if (!seconds || Number.isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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

const extractYouTubeVideoId = (value?: string | null) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (hostname === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || null;
    }

    const queryVideoId = url.searchParams.get("v");
    if (queryVideoId) return queryVideoId;

    const pathSegments = url.pathname.split("/").filter(Boolean);
    if (pathSegments[0] === "shorts" || pathSegments[0] === "embed") {
      return pathSegments[1] || null;
    }

    return null;
  } catch {
    return null;
  }
};

const buildYouTubeThumbnailUrl = (value?: string | null) => {
  const videoId = extractYouTubeVideoId(value);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
};

export default function Courses() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [course, setCourse] = useState<CoursePage | null | undefined>(
    undefined,
  );
  const [demoVideos, setDemoVideos] = useState<CourseDemoVideo[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    new Set(),
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [volume, setVolume] = useState(0.88);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasRequestedVideo, setHasRequestedVideo] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

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
  const videoUrl = course?.video_url || null;

  useEffect(() => {
    fetch(apiUrl("/api/course"))
      .then((res) => res.json())
      .then(setCourse)
      .catch(() => setCourse(null));

    fetch(apiUrl("/api/workshops"))
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setWorkshops(data);
        else if (Array.isArray(data?.data)) setWorkshops(data.data);
        else setWorkshops([]);
      })
      .catch(() => setWorkshops([]));

    fetch(apiUrl("/api/course-demo-videos"))
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDemoVideos(data);
        else setDemoVideos([]);
      })
      .catch(() => setDemoVideos([]));
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

  useEffect(() => {
    setHasRequestedVideo(false);
    setIsVideoPlaying(false);
    setVideoTime(0);
    setVideoDuration(0);
  }, [videoUrl]);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const onLoadedMetadata = () => setVideoDuration(video.duration || 0);
    const onTimeUpdate = () => setVideoTime(video.currentTime);
    const onPlay = () => setIsVideoPlaying(true);
    const onPause = () => setIsVideoPlaying(false);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    video.volume = volume;
    video.muted = isMuted;
    video.playbackRate = playbackRate;
  }, [volume, isMuted, playbackRate]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const resetHideTimer = () => {
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        window.clearTimeout(hideControlsTimerRef.current);
      }
      hideControlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3200);
    };

    const container = videoContainerRef.current;
    if (!container) return;

    const onMouseMove = () => resetHideTimer();
    const onMouseLeave = () => {
      if (hideControlsTimerRef.current) {
        window.clearTimeout(hideControlsTimerRef.current);
      }
      setShowControls(false);
    };

    const onClick = () => resetHideTimer();

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("touchstart", onMouseMove);
    container.addEventListener("click", onClick);

    resetHideTimer();

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("touchstart", onMouseMove);
      container.removeEventListener("click", onClick);
      if (hideControlsTimerRef.current) {
        window.clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current || !videoUrl) return;

    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      if (!hasRequestedVideo) {
        setHasRequestedVideo(true);
        videoRef.current.src = videoUrl;
        videoRef.current.load();
      }

      const playAttempt = videoRef.current.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {});
      }
    }
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!videoRef.current || Number.isNaN(value)) return;
    videoRef.current.currentTime = value;
    setVideoTime(value);
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (Number.isNaN(value)) return;
    setVolume(value);
    setIsMuted(value <= 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  };

  const togglePlaybackRate = () => {
    setPlaybackRate((prev) => {
      const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
      const nextIndex = (rates.indexOf(prev) + 1) % rates.length;
      return rates[nextIndex];
    });
  };

  const toggleFullscreen = () => {
    const container =
      videoContainerRef.current as LegacyFullscreenElement | null;
    const legacyDocument = document as LegacyFullscreenDocument;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) container.requestFullscreen();
      else if (container.webkitRequestFullscreen)
        container.webkitRequestFullscreen();
      else if (container.mozRequestFullScreen) container.mozRequestFullScreen();
      else if (container.msRequestFullscreen) container.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (legacyDocument.webkitExitFullscreen)
        legacyDocument.webkitExitFullscreen();
      else if (legacyDocument.mozCancelFullScreen)
        legacyDocument.mozCancelFullScreen();
      else if (legacyDocument.msExitFullscreen)
        legacyDocument.msExitFullscreen();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this workshop?")) return;

    const response = await fetch(apiUrl(`/api/workshops/${id}`), {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      alert(data?.error || "Failed to delete workshop");
      return;
    }

    setWorkshops((prev) => prev.filter((workshop) => workshop.id !== id));
  };

  const handleToggleComplete = async (
    id: number,
    currentCompleted: boolean,
  ) => {
    const newCompleted = !currentCompleted;
    const action = newCompleted ? "complete" : "incomplete";

    if (!confirm(`Mark this workshop as ${action}?`)) return;

    const response = await fetch(apiUrl(`/api/workshops/${id}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ completed: newCompleted }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      alert(data?.error || `Failed to mark workshop as ${action}`);
      return;
    }

    setWorkshops((prev) =>
      prev.map((workshop) =>
        workshop.id === id
          ? { ...workshop, completed: newCompleted }
          : workshop,
      ),
    );
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
              <p className="mobile-eyebrow text-primary">Loading</p>
              <div className="mx-auto mt-5 h-12 w-12 rounded-full border border-primary/25 border-t-primary animate-spin" />
              <p className="mobile-body-copy mt-5 text-muted-foreground">
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
              <p className="mobile-eyebrow text-primary">Learning Page</p>
              <h1 className="mobile-section-title mt-5 text-foreground sm:text-4xl">
                Course not available.
              </h1>
              <p className="mobile-body-copy mt-4 text-muted-foreground">
                The course content is being rearranged right now. Please check
                back soon.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const leadParagraph = extractLeadParagraph(course.markdown);
  const mobileLeadParagraph =
    leadParagraph.length > 150
      ? `${leadParagraph.slice(0, 147).trimEnd()}...`
      : leadParagraph;
  const liveWorkshops = workshops.filter(
    (workshop) => workshop.is_active !== false && workshop.completed !== true,
  );
  const selectedVenueMapUrl = selectedVenue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVenue)}`
    : null;
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
  const demoVideoWindows = demoVideos.map((item, index) => ({
    label: `Demo ${String(index + 1).padStart(2, "0")}`,
    href: item.youtube_url,
    thumbnail: buildYouTubeThumbnailUrl(item.youtube_url),
  }));

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
          <section id="courses" className="py-8 sm:py-14 lg:py-16">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] xl:items-start xl:gap-10">
              <motion.div variants={fadeUp} className="max-w-4xl">
                <div className="inline-flex items-center gap-3 border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-md">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="mobile-eyebrow text-primary">
                    Learning Studio
                  </span>
                </div>

                <h1 className="mobile-hero-title mt-6 max-w-4xl text-foreground xl:text-7xl">
                  Learn the visual
                  <span className="block text-gradient">
                    language of impact.
                  </span>
                </h1>

                <p className="mobile-intro-copy mt-5 max-w-2xl text-foreground/74">
                  <span className="md:hidden">{mobileLeadParagraph}</span>
                  <span className="hidden md:inline">{leadParagraph}</span>
                </p>

                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <Button
                    variant="gold"
                    size="xl"
                    asChild
                    className="w-full shadow-[0_20px_60px_hsl(var(--primary)/0.22)]"
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
                    className="w-full border-primary/30 bg-background/12"
                  >
                    <Link to="/#about">See Studio Story</Link>
                  </Button>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
                  {heroStats.map((stat) => (
                    <motion.div
                      key={stat.label}
                      variants={fadeUp}
                      className="app-surface border-border/60 bg-card/45 p-4 sm:p-5"
                    >
                      <p className="mobile-label text-primary">{stat.label}</p>
                      <p className="mt-2 font-display text-3xl font-bold text-foreground sm:mt-3 sm:text-4xl">
                        {stat.value}
                      </p>
                      <p className="mobile-card-copy mt-2 text-muted-foreground sm:mt-3 sm:text-sm">
                        {stat.copy}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={scaleIn} className="relative">
                <div className="absolute inset-0 translate-x-4 translate-y-4 border border-primary/16 bg-primary/6" />

                <div className={cn(shellClassName, "relative p-4 sm:p-6")}>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="mobile-eyebrow text-primary">Course Reel</p>
                      <h2 className="mt-3 font-display text-2xl font-bold text-foreground sm:text-3xl">
                        A page that feels like an opening scene.
                      </h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center border border-primary/20 bg-primary/10">
                      <Clapperboard className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {videoUrl ? (
                    <motion.div
                      ref={videoContainerRef}
                      variants={scaleIn}
                      className="premium-video-wrapper relative overflow-hidden rounded-2xl border border-border/60 bg-[radial-gradient(ellipse_at_top,_rgba(245,247,255,0.12),_rgba(15,23,42,0.75))]"
                    >
                      <div
                        className={cn(
                          "relative aspect-video w-full",
                          isFullscreen && "aspect-auto h-screen",
                        )}
                      >
                        <video
                          ref={videoRef}
                          className="h-full w-full object-cover"
                          src={hasRequestedVideo ? videoUrl : undefined}
                          preload="none"
                          playsInline
                        />

                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(15,23,42,0.55)_60%,rgba(15,23,42,0.9)_100%)]" />

                        <button
                          onClick={togglePlay}
                          className={`absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white shadow-lg transition hover:scale-105 ${
                            showControls ? "opacity-100" : "opacity-0"
                          }`}
                          aria-label={
                            isVideoPlaying ? "Pause video" : "Play video"
                          }
                        >
                          {isVideoPlaying ? (
                            <Pause className="h-6 w-6" />
                          ) : (
                            <Play className="h-6 w-6" />
                          )}
                        </button>

                        <div
                          className={`absolute inset-x-0 bottom-0 z-20 p-4 text-white transition-opacity duration-300 ${
                            showControls ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          <input
                            type="range"
                            min={0}
                            max={videoDuration || 0}
                            step={0.1}
                            value={videoTime}
                            onChange={handleSeek}
                            className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-500/40 accent-primary"
                            aria-label="Video progress"
                          />

                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => {
                                  if (!videoRef.current) return;
                                  videoRef.current.currentTime = Math.max(
                                    0,
                                    videoRef.current.currentTime - 10,
                                  );
                                }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition hover:bg-white/20"
                                aria-label="Rewind 10 seconds"
                              >
                                <SkipBack className="h-4 w-4" />
                              </button>

                              <button
                                onClick={togglePlay}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition hover:bg-white/20"
                                aria-label={isVideoPlaying ? "Pause" : "Play"}
                              >
                                {isVideoPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  if (!videoRef.current) return;
                                  videoRef.current.currentTime = Math.min(
                                    videoDuration,
                                    videoRef.current.currentTime + 10,
                                  );
                                }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition hover:bg-white/20"
                                aria-label="Forward 10 seconds"
                              >
                                <SkipForward className="h-4 w-4" />
                              </button>

                              <button
                                onClick={toggleMute}
                                className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition hover:bg-white/20 sm:inline-flex"
                                aria-label={isMuted ? "Unmute" : "Mute"}
                              >
                                <Volume2 className="h-4 w-4" />
                              </button>

                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="hidden h-1 w-full min-w-24 cursor-pointer appearance-none rounded-lg bg-white/20 accent-primary sm:block sm:w-24"
                                aria-label="Volume control"
                              />
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={togglePlaybackRate}
                                className="hidden min-h-10 rounded-md border border-white/25 bg-black/45 px-3 py-1 text-xs text-white transition hover:bg-white/20 sm:inline-flex"
                                aria-label="Change playback speed"
                              >
                                {playbackRate}x
                              </button>

                              <button
                                onClick={toggleFullscreen}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white transition hover:bg-white/20"
                                aria-label={
                                  isFullscreen
                                    ? "Exit fullscreen"
                                    : "Fullscreen"
                                }
                              >
                                {isFullscreen ? (
                                  <Minimize2 className="h-4 w-4" />
                                ) : (
                                  <Maximize2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span>{formatTime(videoTime)}</span>
                            <span>{formatTime(videoDuration)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center border border-border/60 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_32%),linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--background))_100%)] p-6">
                      <div className="max-w-sm text-center">
                        <p className="mobile-eyebrow text-primary">
                          Lesson Film
                        </p>
                        <p className="mt-4 font-display text-2xl text-foreground sm:text-3xl">
                          Visual lesson coming soon.
                        </p>
                        <p className="mobile-body-copy mt-4 text-muted-foreground">
                          The course body is live already. Video media can slide
                          into this frame as soon as it is uploaded.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="border border-border/50 bg-background/40 p-4">
                      <p className="mobile-label text-primary">Last Updated</p>
                      <p className="mt-3 text-sm leading-relaxed text-foreground">
                        {formatLongDate(course.updated_at)}
                      </p>
                    </div>
                    <div className="border border-border/50 bg-background/40 p-4">
                      <p className="mobile-label text-primary">Next Workshop</p>
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

          <section className="pb-12 sm:pb-16 lg:pb-20">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_320px]">
              <motion.div
                variants={fadeUp}
                className={cn(shellClassName, "p-5 sm:p-8 lg:p-10")}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-stretch">
                  <div className="flex flex-col lg:h-full">
                    <div>
                      <p className="mobile-eyebrow text-primary">
                        Course Architecture
                      </p>
                      <h2 className="mobile-section-title mt-4 max-w-md text-foreground">
                        A premium syllabus experience
                        <span className="block text-foreground/72">
                          structured for clarity, progression, and studio-level
                          polish.
                        </span>
                      </h2>
                      <p className="mobile-body-copy mt-5 max-w-md text-muted-foreground">
                        Explore each module with achievable milestones, hands-on
                        lessons, and an organized learning path.
                      </p>
                    </div>

                    {demoVideoWindows.length > 0 && (
                      <div className="mt-6 flex flex-col pt-1">
                        {/* HEADER */}
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-display text-[10px] uppercase tracking-[0.32em] text-primary">
                            Demo Windows
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                            Click to open on YouTube
                          </p>
                        </div>

                        {/* GRID */}
                        <div
                          className={cn(
                            "mt-3 grid gap-3",
                            "grid-cols-1",
                            demoVideoWindows.length >= 2 && "sm:grid-cols-2",
                          )}
                        >
                          {demoVideoWindows.map((demo) => (
                            <motion.div
                              key={demo.label}
                              variants={fadeUp}
                              {...hoverLift}
                              className={cn(
                                "group overflow-hidden rounded-[1.15rem] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--card)/0.96),hsl(var(--background)/0.99))] shadow-[0_18px_44px_hsl(0_0%_0%/0.2)]",
                                demoVideoWindows.length === 1 &&
                                  "sm:col-span-2",
                              )}
                            >
                              <a
                                href={demo.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="grid h-full grid-rows-[auto_minmax(0,1fr)]"
                              >
                                {/* HEADER BAR */}
                                <div className="flex items-center justify-between border-b border-border/50 bg-background/78 px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-primary/85" />
                                    <span className="h-2 w-2 rounded-full bg-amber-200/70" />
                                    <span className="h-2 w-2 rounded-full bg-foreground/35" />
                                  </div>
                                  <p className="font-display text-[9px] uppercase tracking-[0.24em] text-foreground/55">
                                    {demo.label}
                                  </p>
                                </div>

                                {/* VIDEO */}
                                <div className="relative aspect-video w-full min-h-[180px] sm:min-h-[200px] md:max-h-[220px] overflow-hidden bg-black">
                                  {demo.thumbnail ? (
                                    <img
                                      src={demo.thumbnail}
                                      alt={demo.label}
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_42%),linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--background))_100%)]" />
                                  )}

                                  {/* OVERLAY */}
                                  <div className="absolute inset-0 bg-black/28 transition-colors duration-300 group-hover:bg-black/18" />

                                  {/* PLAY BUTTON */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                                      <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                                    </span>
                                  </div>

                                  {/* EXTERNAL ICON */}
                                  <div className="absolute bottom-2 right-2 rounded-full border border-white/20 bg-black/45 p-1.5 text-white/80 backdrop-blur-sm">
                                    <ArrowUpRight className="h-3 w-3" />
                                  </div>
                                </div>
                              </a>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                              className="flex w-full flex-col gap-3 px-5 py-4 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4"
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
                className="space-y-5 xl:sticky xl:top-24 xl:self-start"
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
                    <Button variant="gold" size="lg" asChild className="w-full">
                      <Link to="/contact">
                        Contact the Studio
                        <ArrowUpRight />
                      </Link>
                    </Button>
                    <Button
                      variant="hero"
                      size="lg"
                      asChild
                      className="w-full border-primary/30 bg-background/12"
                    >
                      <Link to="/#gallery">View the Collection</Link>
                    </Button>
                  </div>
                </div>
              </motion.aside>
            </div>
          </section>

          <section id="workshops" className="pb-20 sm:pb-24">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div
                variants={fadeUp}
                className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-end"
              >
                <div>
                  <p className="mobile-eyebrow text-primary">Live Workshops</p>
                  <h2 className="mobile-section-title mt-4 max-w-3xl text-foreground">
                    Workshops with cleaner layout, clearer details, and better
                    spacing.
                  </h2>
                </div>
                <p className="mobile-body-copy max-w-sm text-muted-foreground">
                  Each session gets room to breathe without crowding the
                  viewport.
                </p>
              </motion.div>

              {liveWorkshops.length === 0 ? (
                <motion.div
                  variants={fadeUp}
                  className={cn(shellClassName, "p-8 text-center sm:p-10")}
                >
                  <div className="mb-6 inline-flex items-center gap-3 border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-md">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="mobile-eyebrow text-primary">
                      Workshop Studio
                    </span>
                  </div>
                  <p className="mobile-eyebrow text-primary">Workshop Update</p>
                  <h3 className="mobile-section-title mt-4 text-foreground">
                    New sessions are being composed right now.
                  </h3>
                  <p className="mobile-body-copy mx-auto mt-4 max-w-2xl text-muted-foreground">
                    The page is ready for workshop drops. As soon as a live
                    session is published from the admin side, it will land here
                    with the updated layout.
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 2xl:grid-cols-3">
                  {liveWorkshops.map((workshop, index) => {
                    const workshopDate = new Date(workshop.date);
                    const now = new Date();

                    const isUpcoming =
                      workshopDate > now && !workshop.completed;
                    const isToday =
                      workshopDate.toDateString() === now.toDateString() &&
                      !workshop.completed;
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
                            "sm:col-span-2 2xl:col-span-2",
                        )}
                      >
                        {/* STATUS */}
                        <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
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
                          <motion.div
                            variants={scaleIn}
                            className="aspect-[4/3] overflow-hidden"
                          >
                            <LazyImage
                              src={workshop.image_url}
                              imageVariants={workshop.image_variants}
                              variant="card"
                              alt={workshop.title}
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          </motion.div>
                        ) : (
                          <div className="aspect-[4/3] flex items-center justify-center bg-zinc-800">
                            <p>{workshop.title}</p>
                          </div>
                        )}

                        {/* ADMIN BUTTONS */}
                        {isAdmin && (
                          <div className="absolute right-4 top-14 z-10 flex flex-wrap justify-end gap-2 sm:right-6 sm:top-6">
                            <button
                              onClick={() =>
                                handleToggleComplete(
                                  workshop.id,
                                  workshop.completed || false,
                                )
                              }
                              className={cn(
                                "min-h-10 rounded-md px-3 text-xs text-white",
                                workshop.completed
                                  ? "bg-orange-500 hover:bg-orange-600"
                                  : "bg-green-500 hover:bg-green-600",
                              )}
                            >
                              {workshop.completed
                                ? "Mark Incomplete"
                                : "Mark Complete"}
                            </button>
                            <button
                              onClick={() => handleDelete(workshop.id)}
                              className="min-h-10 rounded-md bg-red-500 px-3 text-xs text-white hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        {/* CONTENT */}
                        <div className="flex flex-1 flex-col p-4 sm:p-6">
                          <h3 className="mb-2 text-lg font-bold sm:text-xl">
                            {workshop.title}
                          </h3>

                          <p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-400">
                            {workshop.description || "Coming soon"}
                          </p>

                          <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
                              <span>{formatShortDate(workshop.date)}</span>
                            </div>
                            {workshop.duration && (
                              <div className="flex items-center gap-2 text-sm text-zinc-300">
                                <Clock3 className="h-4 w-4 shrink-0 text-primary" />
                                <span>{workshop.duration}</span>
                              </div>
                            )}
                            {workshop.max_seats ? (
                              <div className="flex items-center gap-2 text-sm text-zinc-300">
                                <Users className="h-4 w-4 shrink-0 text-primary" />
                                <span>{workshop.max_seats} seats</span>
                              </div>
                            ) : null}
                            <div className="text-sm font-semibold text-foreground">
                              {formatPrice(workshop.price)}
                            </div>
                          </div>

                          {workshop.venue && (
                            <button
                              onClick={() => setSelectedVenue(workshop.venue)}
                              className="mt-4 inline-flex min-h-10 items-center gap-2 text-left text-sm text-primary transition-colors hover:text-primary/80"
                            >
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span className="break-words">
                                {workshop.venue}
                              </span>
                            </button>
                          )}

                          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Button asChild size="lg" className="w-full">
                              <Link to="/contact">Reserve Seat</Link>
                            </Button>
                            <Button
                              variant="hero"
                              size="lg"
                              asChild
                              className="w-full border-primary/30 bg-background/12"
                            >
                              <Link to="/contact">Ask a Question</Link>
                            </Button>
                          </div>

                          {workshop.venue && (
                            <button
                              onClick={() => setSelectedVenue(workshop.venue)}
                              className="hidden"
                            >
                              📍 {workshop.venue}
                            </button>
                          )}

                          <div className="hidden flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {workshop.price && (
                              <span className="font-bold">
                                {formatPrice(workshop.price)}
                              </span>
                            )}

                            <div className="flex w-full gap-2 sm:w-auto">
                              <div>
                                <Button asChild className="w-full sm:w-auto">
                                  <Link to="/contact">Reserve →</Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* GOOGLE MAPS MODAL */}
          {selectedVenue && (
            <AnimatePresence>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedVenue(null)}
              >
                <motion.div
                  className="relative w-full max-w-2xl rounded-2xl border border-border/60 bg-card shadow-2xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedVenue(null)}
                    className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-transparent transition hover:bg-black/60"
                    aria-label="Close venue map"
                  >
                    <X className="absolute h-5 w-5 text-white" />✕
                  </button>

                  <div className="p-5 sm:p-6">
                    <h3 className="mb-4 break-words text-lg font-bold">
                      {selectedVenue}
                    </h3>
                    <div className="rounded-xl border border-border/60 bg-background/50 p-5">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Open the venue in Google Maps to view directions without
                        exposing a browser-side API key in the website bundle.
                      </p>
                      {selectedVenueMapUrl && (
                        <Button asChild className="mt-4 w-full sm:w-auto">
                          <a
                            href={selectedVenueMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open in Google Maps
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {selectedVenue}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
