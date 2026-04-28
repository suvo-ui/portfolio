import { type ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarClock,
  Clapperboard,
  Layers3,
  LogOut,
  Palette,
  Play,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { apiUrl, fetchWithTimeout } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
}

interface CoursePage {
  markdown: string;
  video_path?: string | null;
  video_url?: string | null;
  updated_at?: string | null;
}

interface CourseDemoVideo {
  position: number;
  youtube_url: string;
}

interface ContactRequest {
  id: number;
  request_type: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at?: string | null;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const panelClassName =
  "relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,hsl(var(--card)/0.88),hsl(var(--background)/0.96))] shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl";

const fieldGridClassName =
  "grid items-start gap-6 md:grid-cols-2 md:gap-x-8 md:gap-y-6";

const controlClassName =
  "admin-control !h-12 !w-full !min-w-0 !rounded-none !border-white/12 !bg-zinc-950/95 !px-4 !text-white !shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] !placeholder:text-zinc-500 focus-visible:!border-primary/50 focus-visible:!ring-0 focus-visible:!ring-offset-0";

const selectClassName =
  "admin-control admin-select !h-12 !w-full !min-w-0 !appearance-none !rounded-none !border-white/12 !bg-zinc-950/95 !px-4 !py-2 !text-sm !text-white !shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors focus:!border-primary/50 focus:!outline-none";

const textareaClassName =
  "admin-control admin-textarea !w-full !rounded-none !border-white/12 !bg-zinc-950/95 !px-4 !py-3 !text-white !shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] !placeholder:text-zinc-500 focus-visible:!border-primary/50 focus-visible:!ring-0 focus-visible:!ring-offset-0";

const fileInputClassName =
  "admin-control admin-file-input block !h-12 !w-full !min-w-0 cursor-pointer !rounded-none !border-dashed !border-white/12 !bg-zinc-950/95 !px-4 !py-3 !text-sm !text-zinc-400 !shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors file:mr-4 file:border-0 file:bg-primary file:px-4 file:py-2 file:font-display file:text-xs file:uppercase file:tracking-[0.24em] file:text-primary-foreground hover:!border-primary/40";
const defaultDemoVideoUrls = ["", "", ""];

const formatAdminDate = (value?: string | null) => {
  if (!value) return "recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatAdminTimestamp = (value?: string | null) => {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatRequestType = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

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

function FieldShell({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-3">
      <Label className="font-display text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </Label>
      {hint && (
        <p className="text-xs leading-relaxed text-muted-foreground/75">
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

function PanelHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-4 inline-flex items-center gap-3 border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-md">
        <span className="text-primary">{icon}</span>
        <span className="font-display text-[11px] uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
        {description}
      </p>
    </div>
  );
}

export default function Admin() {
  const { logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [artTitle, setArtTitle] = useState("");
  const [artDescription, setArtDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [availableForPrint, setAvailableForPrint] = useState(false);
  const [forSale, setForSale] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [courseLoading, setCourseLoading] = useState(true);
  const [video, setVideo] = useState<File | null>(null);
  const [demoVideoUrls, setDemoVideoUrls] =
    useState<string[]>(defaultDemoVideoUrls);
  const [demoVideosLoading, setDemoVideosLoading] = useState(true);
  const [demoVideosSaving, setDemoVideosSaving] = useState(false);
  const [courseHasLiveVideo, setCourseHasLiveVideo] = useState(false);
  const [courseLastUpdated, setCourseLastUpdated] = useState<string | null>(
    null,
  );
  const [courseUploading, setCourseUploading] = useState(false);
  const [wsTitle, setWsTitle] = useState("");
  const [wsDescription, setWsDescription] = useState("");
  const [wsDate, setWsDate] = useState("");
  const [wsDuration, setWsDuration] = useState("");
  const [wsPrice, setWsPrice] = useState("");
  const [wsSeats, setWsSeats] = useState("");
  const [wsVenue, setWsVenue] = useState("");
  const [wsImage, setWsImage] = useState<File | null>(null);
  const [wsVideo, setWsVideo] = useState<File | null>(null);
  const [wsLoading, setWsLoading] = useState(false);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [contactLoading, setContactLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(apiUrl("/api/categories"));
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    const fetchCourse = async () => {
      try {
        const res = await fetch(apiUrl("/api/course"));
        const data: CoursePage | null = await res.json();

        if (!res.ok || !data) {
          throw new Error("Failed to load course");
        }

        setMarkdown(data.markdown || "");
        setCourseHasLiveVideo(Boolean(data.video_url || data.video_path));
        setCourseLastUpdated(data.updated_at || null);
      } catch (error) {
        console.error("Failed to load course:", error);
      } finally {
        setCourseLoading(false);
      }
    };

    const fetchDemoVideos = async () => {
      try {
        const res = await fetch(apiUrl("/api/course-demo-videos"));
        const data: CourseDemoVideo[] | null = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          throw new Error("Failed to load demo videos");
        }

        const nextUrls = [...defaultDemoVideoUrls];
        data.forEach((item) => {
          const index = Number(item.position) - 1;
          if (index >= 0 && index < nextUrls.length) {
            nextUrls[index] = item.youtube_url || "";
          }
        });
        setDemoVideoUrls(nextUrls);
      } catch (error) {
        console.error("Failed to load demo videos:", error);
        setDemoVideoUrls(defaultDemoVideoUrls);
      } finally {
        setDemoVideosLoading(false);
      }
    };

    const fetchContactRequests = async () => {
      try {
        const res = await fetch(apiUrl("/api/admin/contact-requests"), {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load contact requests");
        }

        setContactRequests(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load contact requests:", error);
        setContactRequests([]);
      } finally {
        setContactLoading(false);
      }
    };

    fetchCategories();
    fetchCourse();
    fetchDemoVideos();
    fetchContactRequests();
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (!forSale) {
      setPrice("");
    }
  }, [forSale]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const selected = acceptedFiles[0];
      if (!selected) return;
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    },
  });

  const handleLogout = async () => logout();

  const handleSubmitArtwork = async () => {
    if (!file || !artTitle || !categoryId || (forSale && !price)) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const uploadRes = await fetchWithTimeout(
        apiUrl("/api/upload"),
        {
          method: "POST",
          credentials: "include",
          body: fd,
        },
        30000,
      );
      const uploadData = await uploadRes.json().catch(() => null);

      if (!uploadRes.ok) {
        throw new Error(uploadData?.error || "Image upload failed");
      }

      if (!uploadData?.url) {
        throw new Error("Upload completed without an image URL.");
      }

      const createRes = await fetch(apiUrl("/api/admin/artworks"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: artTitle,
          description: artDescription,
          category_id: Number(categoryId),
          image_url: uploadData.url,
          price_inr: forSale ? Number(price) : null,
          size,
          available_for_print: availableForPrint,
          for_sale: forSale,
        }),
      });
      const createData = await createRes.json().catch(() => null);

      if (!createRes.ok) {
        throw new Error(createData?.error || "Artwork creation failed");
      }

      setArtTitle("");
      setArtDescription("");
      setCategoryId("");
      setPrice("");
      setSize("");
      setAvailableForPrint(false);
      setForSale(false);
      setFile(null);
      setPreview(null);
      alert("Artwork uploaded successfully.");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Artwork upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async () => {
    if (!markdown.trim()) {
      alert("Course markdown is required.");
      return;
    }

    const queuedVideo = video;
    setCourseUploading(true);
    try {
      const requestInit: RequestInit = queuedVideo
        ? {
            method: "PUT",
            credentials: "include",
            body: (() => {
              const fd = new FormData();
              fd.append("markdown", markdown);
              fd.append("video", queuedVideo);
              return fd;
            })(),
          }
        : {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              markdown,
            }),
          };

      const res = await fetch(apiUrl("/api/course"), {
        ...requestInit,
      });
      const responseText = await res.text();
      const data: (CoursePage & { error?: string }) | null = (() => {
        if (!responseText) return null;

        try {
          return JSON.parse(responseText) as CoursePage & { error?: string };
        } catch {
          return null;
        }
      })();

      if (!res.ok) {
        throw new Error(
          data?.error || responseText || `Course update failed (${res.status})`,
        );
      }

      if (data?.markdown) {
        setMarkdown(data.markdown);
      }

      setCourseLastUpdated(data?.updated_at || null);
      setCourseHasLiveVideo(
        Boolean(data?.video_path || queuedVideo || courseHasLiveVideo),
      );
      setVideo(null);
      alert("Course updated successfully.");
      localStorage.setItem("courses-link-blink", "true");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Course update failed.");
    } finally {
      setCourseUploading(false);
    }
  };

  const updateDemoVideos = async () => {
    const queuedDemoVideoUrls = demoVideoUrls.map((value) => value.trim());
    setDemoVideosSaving(true);

    try {
      const res = await fetch(apiUrl("/api/course-demo-videos"), {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          demo_video_1_url: queuedDemoVideoUrls[0] || "",
          demo_video_2_url: queuedDemoVideoUrls[1] || "",
          demo_video_3_url: queuedDemoVideoUrls[2] || "",
        }),
      });
      const responseText = await res.text();
      const data: CourseDemoVideo[] | null = (() => {
        if (!responseText) return null;

        try {
          return JSON.parse(responseText) as CourseDemoVideo[];
        } catch {
          return null;
        }
      })();

      if (!res.ok) {
        const errorMessage =
          data &&
          !Array.isArray(data) &&
          typeof data === "object" &&
          "error" in data
            ? String((data as any).error)
            : responseText || `Demo video update failed (${res.status})`;
        throw new Error(errorMessage);
      }

      const nextUrls = [...defaultDemoVideoUrls];
      (data || []).forEach((item) => {
        const index = Number(item.position) - 1;
        if (index >= 0 && index < nextUrls.length) {
          nextUrls[index] = item.youtube_url || "";
        }
      });

      setDemoVideoUrls(nextUrls);
      alert("Demo windows updated successfully.");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Demo video update failed.");
    } finally {
      setDemoVideosSaving(false);
    }
  };

  const handleCreateWorkshop = async () => {
    try {
      setWsLoading(true);
      const fd = new FormData();
      fd.append("title", wsTitle);
      fd.append("description", wsDescription);
      fd.append("date", wsDate);
      fd.append("duration", wsDuration);
      fd.append("price", wsPrice);
      fd.append("max_seats", wsSeats);
      fd.append("venue", wsVenue);
      if (wsImage) fd.append("image", wsImage);
      if (wsVideo) fd.append("video", wsVideo);
      const res = await fetch(apiUrl("/api/workshops"), {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Workshop creation failed");
      alert("Workshop created successfully.");
      localStorage.setItem("workshops-link-blink", "true");
      setWsTitle("");
      setWsDescription("");
      setWsDate("");
      setWsDuration("");
      setWsPrice("");
      setWsSeats("");
      setWsVenue("");
      setWsImage(null);
      setWsVideo(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Workshop creation failed.");
    } finally {
      setWsLoading(false);
    }
  };

  const hasArtworkDraft = Boolean(
    file && artTitle && categoryId && (!forSale || price),
  );
  const hasWorkshopMedia = Boolean(wsImage || wsVideo);
  const courseWordCount = markdown.trim()
    ? markdown.trim().split(/\s+/).length
    : 0;
  const selectedCategoryName =
    categories.find((category) => String(category.id) === categoryId)?.name ||
    "No category selected";
  const metrics = [
    {
      label: "Categories Live",
      value: String(categories.length).padStart(2, "0"),
      detail:
        categories.length > 0
          ? "Ready for assignment"
          : "Waiting on category feed",
    },
    {
      label: "Artwork Draft",
      value: preview ? "Loaded" : "Idle",
      detail: preview
        ? "Visual attached and staged"
        : "No artwork image selected",
    },
    {
      label: "Course Update",
      value: courseLoading
        ? "Syncing"
        : video
          ? "Queued"
          : courseHasLiveVideo
            ? "Live"
            : "Text",
      detail: courseLoading
        ? "Loading current lesson body"
        : video
          ? video.name
          : courseLastUpdated
            ? `Last refresh ${formatAdminDate(courseLastUpdated)}`
            : "Attach video when ready",
    },
    {
      label: "Workshop Build",
      value: wsTitle ? "Draft" : "Empty",
      detail: hasWorkshopMedia ? "Media attached" : "Waiting on media",
    },
  ];
  const launchChecklist = [
    {
      label: "Artwork release",
      status: hasArtworkDraft ? "Ready" : "In progress",
      active: hasArtworkDraft,
    },
    {
      label: "Course refresh",
      status: courseLoading
        ? "Syncing"
        : video
          ? "Ready"
          : courseHasLiveVideo
            ? "Live"
            : courseWordCount > 0
              ? "Text ready"
              : "Idle",
      active: Boolean(video) || courseHasLiveVideo || courseWordCount > 0,
    },
    {
      label: "Workshop launch",
      status: wsTitle && wsDate && wsPrice && wsVenue ? "Ready" : "In progress",
      active: Boolean(wsTitle && wsDate && wsPrice && wsVenue),
    },
  ];
  const assetStatus = [
    {
      label: "Artwork image",
      value: file ? file.name : "Waiting for upload",
      active: Boolean(file),
    },
    {
      label: "Course video",
      value: video
        ? video.name
        : courseHasLiveVideo
          ? "Live course video available"
          : "No course media selected",
      active: Boolean(video) || courseHasLiveVideo,
    },
    {
      label: "Demo windows",
      value: `${demoVideoUrls.filter(Boolean).length}/3 YouTube links ready`,
      active: demoVideoUrls.some(Boolean),
    },
    {
      label: "Workshop image",
      value: wsImage ? wsImage.name : "No workshop image selected",
      active: Boolean(wsImage),
    },
    {
      label: "Workshop video",
      value: wsVideo ? wsVideo.name : "No workshop video selected",
      active: Boolean(wsVideo),
    },
  ];
  const demoWindowPreviews = demoVideoUrls.map((url, index) => ({
    label: `Demo Window ${index + 1}`,
    href: url.trim() || null,
    thumbnail: buildYouTubeThumbnailUrl(url),
  }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_24%),radial-gradient(circle_at_80%_10%,hsl(22_85%_48%/0.14),transparent_18%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(15_10%_8%)_100%)]" />
      <motion.div
        className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl"
        animate={{
          x: [0, 60, -20, 0],
          y: [0, 40, 10, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-8rem] top-24 h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-3xl"
        animate={{
          x: [0, -40, 16, 0],
          y: [0, -30, 12, 0],
          scale: [0.95, 1.08, 1, 0.95],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(hsl(var(--foreground)/0.14)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.14)_1px,transparent_1px)] [background-size:120px_120px]" />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.section
            variants={itemVariants}
            className={cn(
              panelClassName,
              "px-5 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
            )}
          >
            <motion.div
              className="absolute left-0 top-0 h-px w-40 bg-gradient-to-r from-primary via-white/70 to-transparent"
              animate={{ x: ["-10%", "120%"] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
            />
            <div className="grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div>
                <Badge
                  variant="outline"
                  className="mb-6 inline-flex items-center gap-2 border-primary/30 bg-primary/10 px-4 py-2 font-display uppercase tracking-[0.28em] text-primary"
                >
                  <motion.span
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{
                      opacity: [0.35, 1, 0.35],
                      scale: [0.9, 1.15, 0.9],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  Studio Control
                </Badge>
                <h1 className="max-w-4xl font-display text-4xl font-bold leading-[0.94] text-foreground sm:text-5xl lg:text-7xl">
                  The admin panel now feels like a launch console.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                  Manage artwork drops, course refreshes, and workshop launches
                  from a single motion-rich control room designed to feel
                  premium, fast, and intentional.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <div className="inline-flex max-w-full items-center gap-3 border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Secure session active. All publishing tools are unlocked.
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLogout}
                    className="w-full border-destructive/30 bg-destructive/5 text-foreground hover:border-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    variants={itemVariants}
                    whileHover={{ y: -8, scale: 1.01 }}
                    transition={{ duration: 0.25 }}
                    className="relative overflow-hidden border border-white/10 bg-black/20 p-5 backdrop-blur-xl"
                  >
                    <div
                      className={cn(
                        "absolute left-0 top-0 h-full w-1",
                        index % 2 === 0 ? "bg-primary/80" : "bg-white/40",
                      )}
                    />
                    <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="mt-4 font-display text-3xl font-bold text-foreground">
                      {metric.value}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {metric.detail}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-8">
              <motion.section
                variants={itemVariants}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                className={panelClassName}
              >
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="p-6 lg:p-8">
                    <PanelHeader
                      icon={<Palette className="h-4 w-4" />}
                      eyebrow="Artwork Publishing"
                      title="Stage the next piece with impact."
                      description="Create the listing, choose the category, and preview the image before publishing."
                    />

                    <div className={fieldGridClassName}>
                      <FieldShell label="Artwork Title">
                        <Input
                          value={artTitle}
                          onChange={(e) => setArtTitle(e.target.value)}
                          placeholder="Title the release"
                          className={controlClassName}
                        />
                      </FieldShell>

                      <FieldShell label="Category" hint={selectedCategoryName}>
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className={selectClassName}
                        >
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </FieldShell>

                      <FieldShell
                        label="For Sale"
                        hint="Make this artwork available for purchase"
                      >
                        <div className="flex items-center gap-3 border border-white/12 bg-zinc-950/95 px-4 py-3 rounded-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <input
                            type="checkbox"
                            id="forSale"
                            checked={forSale}
                            onChange={(e) => setForSale(e.target.checked)}
                            className="h-5 w-5 accent-primary cursor-pointer"
                          />
                          <label
                            htmlFor="forSale"
                            className="cursor-pointer text-sm text-white flex-1"
                          >
                            Enable for sale
                          </label>
                        </div>
                      </FieldShell>

                      {forSale && (
                        <FieldShell label="Price" hint="INR">
                          <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Set collector price"
                            className={controlClassName}
                          />
                        </FieldShell>
                      )}

                      <FieldShell label="Size">
                        <Input
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          placeholder="e.g. 24 x 36 in"
                          className={controlClassName}
                        />
                      </FieldShell>
                    </div>

                    <div className="mt-5">
                      <FieldShell
                        label="Available for Print"
                        hint="Make this artwork available in the print section"
                      >
                        <div className="flex items-center gap-3 border border-white/12 bg-zinc-950/95 px-4 py-3 rounded-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <input
                            type="checkbox"
                            id="availableForPrint"
                            checked={availableForPrint}
                            onChange={(e) =>
                              setAvailableForPrint(e.target.checked)
                            }
                            className="h-5 w-5 accent-primary cursor-pointer"
                          />
                          <label
                            htmlFor="availableForPrint"
                            className="cursor-pointer text-sm text-white flex-1"
                          >
                            Enable print availability
                          </label>
                        </div>
                      </FieldShell>
                    </div>

                    <div className="mt-5">
                      <FieldShell
                        label="Description"
                        hint="Collector-facing copy"
                      >
                        <Textarea
                          value={artDescription}
                          onChange={(e) => setArtDescription(e.target.value)}
                          placeholder="Write the story behind the piece, the mood, the movement, and what makes it worth collecting."
                          className={cn(textareaClassName, "min-h-36")}
                        />
                      </FieldShell>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <Button
                        variant="gold"
                        size="xl"
                        onClick={handleSubmitArtwork}
                        disabled={loading}
                        className="w-full shadow-[0_18px_50px_hsl(var(--primary)/0.22)] sm:w-auto"
                      >
                        {loading ? "Publishing..." : "Publish Artwork"}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        {hasArtworkDraft
                          ? "Everything required is in place."
                          : "Add image, category, and price to publish."}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 p-6 lg:p-8 xl:border-l xl:border-t-0">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                          Visual Dropzone
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          Drop the artwork here to preview the release before it
                          goes live.
                        </p>
                      </div>
                      <UploadCloud className="h-5 w-5 text-primary" />
                    </div>

                    <div
                      {...getRootProps()}
                      className={cn(
                        "relative flex min-h-[260px] cursor-pointer items-center justify-center overflow-hidden border border-dashed border-white/15 bg-black/20 transition-colors sm:min-h-[320px]",
                        isDragActive && "border-primary/60 bg-primary/10",
                      )}
                    >
                      <input {...getInputProps()} />
                      <AnimatePresence mode="wait">
                        {preview ? (
                          <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.35 }}
                            className="absolute inset-0"
                          >
                            <img
                              src={preview}
                              alt="Artwork preview"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_45%,rgba(0,0,0,0.8)_100%)]" />
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                                Preview Loaded
                              </p>
                              <p className="mt-2 font-display text-2xl font-bold text-white">
                                {artTitle || file?.name || "Artwork ready"}
                              </p>
                              <p className="mt-2 text-sm text-white/70">
                                Click or drop again to replace the current
                                artwork visual.
                              </p>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex max-w-xs flex-col items-center text-center"
                          >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                              <UploadCloud className="h-7 w-7" />
                            </div>
                            <p className="mt-6 font-display text-xl uppercase tracking-[0.18em] text-foreground">
                              Drop the hero piece
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                              Drag and drop an image here, or click to choose a
                              file from the studio.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.section>

              <div className="grid gap-8 xl:grid-cols-2">
                <motion.section
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className={panelClassName}
                >
                  <div className="p-6 lg:p-8">
                    <PanelHeader
                      icon={<Clapperboard className="h-4 w-4" />}
                      eyebrow="Course Studio"
                      title="Refresh the learning experience."
                      description="Upload the latest lesson media and update the supporting markdown without touching the separate demo-window system."
                    />

                    <div className="mb-5 border border-white/10 bg-black/20 p-4">
                      <p className="font-display text-[11px] uppercase tracking-[0.26em] text-primary">
                        Live Course Sync
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                        {courseLoading
                          ? "Loading the current course body from the live page."
                          : `Markdown is synced from the live course${courseLastUpdated ? `, last updated ${formatAdminDate(courseLastUpdated)}` : ""}.`}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {courseHasLiveVideo
                          ? "A live course video is already attached."
                          : "No live course video is attached yet."}
                      </p>
                    </div>

                    <div className="space-y-5">
                      <FieldShell
                        label="Course Video"
                        hint={video ? "Media queued" : "Optional"}
                      >
                        <div className="space-y-3">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) =>
                              e.target.files && setVideo(e.target.files[0])
                            }
                            className={fileInputClassName}
                          />
                          {video && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground/85">
                              <span className="break-all">
                                Queued video: {video.name}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setVideo(null)}
                                className="border-primary/30 bg-transparent"
                              >
                                Clear
                              </Button>
                            </div>
                          )}
                        </div>
                      </FieldShell>

                      <FieldShell
                        label="Course Markdown"
                        hint={
                          courseLoading
                            ? "Loading current content"
                            : `${courseWordCount} words`
                        }
                      >
                        <Textarea
                          value={markdown}
                          onChange={(e) => setMarkdown(e.target.value)}
                          placeholder="Add or update the course copy, lesson notes, and any structured guidance."
                          className={cn(textareaClassName, "min-h-[220px]")}
                        />
                      </FieldShell>

                      <div className="flex flex-wrap items-center gap-4">
                        <Button
                          variant="hero"
                          size="lg"
                          onClick={updateCourse}
                          disabled={courseUploading || courseLoading}
                          className="w-full sm:w-auto"
                        >
                          {courseUploading ? "Updating..." : "Update Course"}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          {video
                            ? "Video is attached for this update."
                            : "This update can go out as text-only."}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.section>

                <motion.section
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className={panelClassName}
                >
                  <div className="p-6 lg:p-8">
                    <PanelHeader
                      icon={<Clapperboard className="h-4 w-4" />}
                      eyebrow="Demo Windows"
                      title="Attach course teasers separately."
                      description="This panel saves up to three YouTube demo windows on its own, fully separate from course markdown and lesson media."
                    />

                    <div className={fieldGridClassName}>
                      {demoVideoUrls.map((value, index) => (
                        <FieldShell
                          key={`demo-video-${index + 1}`}
                          label={`Demo Window ${index + 1}`}
                          hint="Optional YouTube link for this demo slot"
                        >
                          <Input
                            type="url"
                            value={value}
                            onChange={(e) =>
                              setDemoVideoUrls((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index ? e.target.value : item,
                                ),
                              )
                            }
                            placeholder="https://www.youtube.com/watch?v=..."
                            className={controlClassName}
                          />
                        </FieldShell>
                      ))}
                    </div>

                    <div className="mt-5 border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-display text-[11px] uppercase tracking-[0.26em] text-primary">
                            Demo Window Attachments
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Paste up to three YouTube links here. Saving this
                            panel only updates the public demo windows and does
                            not touch course markdown or the main course video.
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-primary">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          {
                            demoWindowPreviews.filter((item) => item.href)
                              .length
                          }
                          /3 attached
                        </div>
                      </div>

                      {demoWindowPreviews.some((item) => item.href) ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {demoWindowPreviews
                            .filter((item) => item.href)
                            .map((preview) => (
                              <div
                                key={preview.label}
                                className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 shadow-[0_18px_44px_rgba(0,0,0,0.3)]"
                              >
                                <div className="flex items-center justify-between border-b border-white/10 bg-black/35 px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-primary/85" />
                                    <span className="h-2 w-2 rounded-full bg-amber-300/70" />
                                    <span className="h-2 w-2 rounded-full bg-white/25" />
                                  </div>
                                  <p className="font-display text-[9px] uppercase tracking-[0.24em] text-white/60">
                                    {preview.label}
                                  </p>
                                </div>

                                <a
                                  href={preview.href!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                                    {preview.thumbnail ? (
                                      <img
                                        src={preview.thumbnail}
                                        alt={preview.label}
                                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_42%),linear-gradient(180deg,#18181b_0%,#09090b_100%)]" />
                                    )}
                                    <div className="absolute inset-0 bg-black/30" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white shadow-lg backdrop-blur-sm">
                                        <Play className="ml-0.5 h-4 w-4 fill-current" />
                                      </span>
                                    </div>
                                    <div className="absolute bottom-2 right-2 rounded-full border border-white/15 bg-black/45 p-1.5 text-white/80 backdrop-blur-sm">
                                      <ArrowUpRight className="h-3 w-3" />
                                    </div>
                                  </div>
                                </a>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-muted-foreground">
                          {demoVideosLoading
                            ? "Loading current demo window attachments."
                            : "Attached demo windows will appear here after you paste at least one YouTube link."}
                        </div>
                      )}
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <Button
                        variant="gold"
                        size="lg"
                        onClick={updateDemoVideos}
                        disabled={demoVideosSaving || demoVideosLoading}
                        className="w-full sm:w-auto"
                      >
                        {demoVideosSaving
                          ? "Updating..."
                          : "Update Demo Windows"}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        {demoVideoUrls.some((value) => value.trim())
                          ? "Only these attached links will show on the public course page."
                          : "Leave all three fields empty if you do not want demo windows yet."}
                      </p>
                    </div>
                  </div>
                </motion.section>

                <motion.section
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className={panelClassName}
                >
                  <div className="p-6 lg:p-8">
                    <PanelHeader
                      icon={<CalendarClock className="h-4 w-4" />}
                      eyebrow="Workshop Launch"
                      title="Compose the next live experience."
                      description="Shape the workshop offer, assign the schedule, and attach launch-ready media without overloading the page."
                    />

                    <div className={fieldGridClassName}>
                      <FieldShell label="Workshop Title">
                        <Input
                          value={wsTitle}
                          onChange={(e) => setWsTitle(e.target.value)}
                          placeholder="Title the workshop"
                          className={controlClassName}
                        />
                      </FieldShell>

                      <FieldShell label="Date">
                        <Input
                          type="datetime-local"
                          value={wsDate}
                          onChange={(e) => setWsDate(e.target.value)}
                          className={controlClassName}
                        />
                      </FieldShell>

                      <FieldShell label="Duration">
                        <Input
                          value={wsDuration}
                          onChange={(e) => setWsDuration(e.target.value)}
                          placeholder="e.g. 3 hours"
                          className={controlClassName}
                        />
                      </FieldShell>

                      <FieldShell label="Price" hint="INR">
                        <Input
                          type="number"
                          value={wsPrice}
                          onChange={(e) => setWsPrice(e.target.value)}
                          placeholder="Seat price"
                          className={controlClassName}
                        />
                      </FieldShell>

                      <FieldShell label="Seats">
                        <Input
                          type="number"
                          value={wsSeats}
                          onChange={(e) => setWsSeats(e.target.value)}
                          placeholder="Capacity"
                          className={controlClassName}
                        />
                      </FieldShell>

                      <FieldShell label="Venue Address">
                        <Input
                          value={wsVenue}
                          onChange={(e) => setWsVenue(e.target.value)}
                          placeholder="e.g. Studio A, 123 Art Street"
                          className={controlClassName}
                        />
                      </FieldShell>
                    </div>

                    <div className="mt-5">
                      <FieldShell label="Description">
                        <Textarea
                          value={wsDescription}
                          onChange={(e) => setWsDescription(e.target.value)}
                          placeholder="Describe the workshop energy, outcomes, audience, and what makes the experience worth booking."
                          className={cn(textareaClassName, "min-h-32")}
                        />
                      </FieldShell>
                    </div>

                    <div className={cn(fieldGridClassName, "mt-5")}>
                      <FieldShell
                        label="Workshop Image"
                        hint={wsImage ? "Attached" : "Optional"}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files && setWsImage(e.target.files[0])
                          }
                          className={fileInputClassName}
                        />
                      </FieldShell>

                      <FieldShell
                        label="Workshop Video"
                        hint={wsVideo ? "Attached" : "Optional"}
                      >
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) =>
                            e.target.files && setWsVideo(e.target.files[0])
                          }
                          className={fileInputClassName}
                        />
                      </FieldShell>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <Button
                        variant="gold"
                        size="lg"
                        onClick={handleCreateWorkshop}
                        disabled={wsLoading}
                        className="w-full sm:w-auto"
                      >
                        {wsLoading ? "Creating..." : "Create Workshop"}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        {hasWorkshopMedia
                          ? "Launch media is attached."
                          : "You can add media now or publish later."}
                      </p>
                    </div>
                  </div>
                </motion.section>
              </div>
            </div>
            <motion.aside
              variants={itemVariants}
              className="space-y-8 xl:sticky xl:top-6 xl:self-start"
            >
              <div className="space-y-8">
                <div className={cn(panelClassName, "p-6")}>
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                        Live Snapshot
                      </p>
                      <h3 className="mt-3 font-display text-2xl font-bold text-foreground">
                        What is staged right now.
                      </h3>
                    </div>
                    <Layers3 className="h-5 w-5 text-primary" />
                  </div>

                  <div className="space-y-4">
                    {assetStatus.map((item) => (
                      <div
                        key={item.label}
                        className="border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                            {item.label}
                          </p>
                          <span
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              item.active ? "bg-primary" : "bg-white/20",
                            )}
                          />
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cn(panelClassName, "p-6")}>
                  <div className="mb-5">
                    <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                      Category Index
                    </p>
                    <h3 className="mt-3 font-display text-2xl font-bold text-foreground">
                      Collection map
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <Badge
                          key={category.id}
                          variant="outline"
                          className={cn(
                            "border px-3 py-2 font-display uppercase tracking-[0.18em]",
                            String(category.id) === categoryId
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-white/10 bg-white/5 text-muted-foreground",
                          )}
                        >
                          {category.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Category data is still loading.
                      </p>
                    )}
                  </div>
                </div>

                <div className={cn(panelClassName, "p-6")}>
                  <div className="mb-5">
                    <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                      Launch Checklist
                    </p>
                    <h3 className="mt-3 font-display text-2xl font-bold text-foreground">
                      Command flow
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {launchChecklist.map((item, index) => (
                      <div
                        key={item.label}
                        className="flex items-start gap-4 border border-white/10 bg-black/20 p-4"
                      >
                        <div
                          className={cn(
                            "mt-1 flex h-8 w-8 items-center justify-center border text-xs font-bold",
                            item.active
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-white/10 bg-white/5 text-muted-foreground",
                          )}
                        >
                          {item.active
                            ? String(index + 1).padStart(2, "0")
                            : "--"}
                        </div>
                        <div>
                          <p className="font-display text-sm uppercase tracking-[0.22em] text-foreground">
                            {item.label}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {item.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cn(panelClassName, "p-6")}>
                  <div className="mb-5">
                    <p className="font-display text-[11px] uppercase tracking-[0.28em] text-primary">
                      Recent Inquiries
                    </p>
                    <h3 className="mt-3 font-display text-2xl font-bold text-foreground">
                      Contact feed
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {contactLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Loading recent inquiries.
                      </p>
                    ) : contactRequests.length > 0 ? (
                      contactRequests.map((request) => (
                        <div
                          key={request.id}
                          className="border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">
                                {formatRequestType(request.request_type)}
                              </p>
                              <p className="mt-2 font-display text-lg text-foreground">
                                {request.name}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatAdminTimestamp(request.created_at)}
                            </p>
                          </div>
                          <p className="mt-3 break-words text-sm text-foreground/85">
                            {request.subject}
                          </p>
                          <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
                            {request.message}
                          </p>
                          <p className="mt-3 break-all text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {request.email}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        New contact requests will show up here after they are
                        submitted from the site.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
