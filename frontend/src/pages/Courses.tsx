import { Layout } from "@/components/Layout";
import ReactMarkdown from "react-markdown";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function Courses() {
  // undefined = loading, null = not found, object = success
  const [course, setCourse] = useState<any | undefined>(undefined);

  useEffect(() => {
  const loadCourse = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/course`
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`HTTP ${res.status}: ${err}`);
      }

      const data = await res.json();
      setCourse(data);
    } catch (err) {
      console.error("Failed to load course:", err);
      setCourse(null);
    }
  };

  loadCourse();
}, []);


  /* ---------- Loading ---------- */
  if (course === undefined) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          Loading course…
        </div>
      </Layout>
    );
  }

  /* ---------- Not found ---------- */
  if (course === null) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          Course not available
        </div>
      </Layout>
    );
  }

  const videoUrl = course.video_path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/course vids/${course.video_path}`
    : null;

  console.log("VIDEO URL USED BY <video>:", videoUrl);


  return (
    <Layout>
      {/* Video */}
      {videoUrl && (
        <div className="max-w-4xl mx-auto mt-20 aspect-video">
          <video
            controls
            className="w-full h-full rounded-2xl"
            src={videoUrl}
          />
        </div>
      )}

      {/* Styled Markdown */}
      <div className="max-w-4xl mx-auto mt-16 space-y-6">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <div className="bg-card border rounded-xl p-6">
                <span className="text-xs uppercase tracking-widest text-primary">
                  {children}
                </span>
              </div>
            ),
            h3: ({ children }) => (
              <h3 className="font-display text-xl font-semibold mt-4">
                {children}
              </h3>
            ),
            ul: ({ children }) => (
              <ul className="space-y-2 mt-2">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary/60" />
                {children}
              </li>
            ),
          }}
        >
          {course.markdown}
        </ReactMarkdown>
      </div>
    </Layout>
  );
}
