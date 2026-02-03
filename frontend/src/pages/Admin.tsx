import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";

/* ---------- Static Categories (Artwork only) ---------- */
const categories = [
  { id: 1, name: "Portrait" },
  { id: 2, name: "Landscape" },
  { id: 3, name: "Abstract" },
];

export default function Admin() {
  const navigate = useNavigate();

  /* ================= ARTWORK STATES ================= */
  const [artTitle, setArtTitle] = useState("");
  const [artDescription, setArtDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ================= COURSE STATES ================= */
  const [markdown, setMarkdown] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [courseUploading, setCourseUploading] = useState(false);

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/login");
  }, [navigate]);

  /* ================= LOAD EXISTING COURSE ================= */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/course`)
      .then(res => res.json())
      .then(data => {
        if (data?.markdown) setMarkdown(data.markdown);
        setHasVideo(!!data?.video_path);
      })
      .catch(console.error);
  }, []);

  /* ================= IMAGE DROPZONE ================= */
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: ([selectedFile]) => {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    },
  });

  /* ================= ARTWORK SUBMIT ================= */
  const handleSubmitArtwork = async () => {
    if (!file || !artTitle || !categoryId) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/upload`,
        { method: "POST", body: formData }
      );

      const uploadResult = await uploadRes.json();

      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/artworks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: artTitle,
          description: artDescription,
          category_id: Number(categoryId),
          image_url: uploadResult.url,
        }),
      });

      alert("Artwork uploaded successfully!");
      setArtTitle("");
      setArtDescription("");
      setCategoryId("");
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
      alert("Artwork upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= COURSE UPDATE ================= */
  const updateCourse = async () => {
    if (!markdown.trim()) {
      alert("Course markdown is required");
      return;
    }

    const formData = new FormData();
    formData.append("markdown", markdown);
    if (video) formData.append("video", video);

    setCourseUploading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/course`,
        { method: "PUT", body: formData }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Course update failed");
      }

      const data = await res.json();
      setHasVideo(!!data.video_path);
      setVideo(null);

      alert("Course updated successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Course update failed");
    } finally {
      setCourseUploading(false);
    }
  };

  /* ================= DELETE COURSE VIDEO ================= */
  const deleteCourseVideo = async () => {
    if (!confirm("Delete course video permanently?")) return;

    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/course/video`, {
        method: "DELETE",
      });

      setHasVideo(false);
      alert("Course video deleted");
    } catch (err) {
      console.error(err);
      alert("Failed to delete video");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-zinc-900 rounded-2xl p-10 border border-zinc-800">

        {/* ================= ARTWORK ================= */}
        <h1 className="text-3xl text-zinc-100 mb-6">Artwork Upload</h1>

        <input
          placeholder="Artwork title"
          value={artTitle}
          onChange={(e) => setArtTitle(e.target.value)}
          className="w-full mb-3 bg-zinc-800 p-2 text-white"
        />

        <textarea
          placeholder="Artwork description"
          value={artDescription}
          onChange={(e) => setArtDescription(e.target.value)}
          className="w-full mb-3 bg-zinc-800 p-2 text-white"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full mb-3 bg-zinc-800 p-2 text-white"
        >
          <option value="">Select category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {!preview ? (
          <div {...getRootProps()} className="border-dashed border p-6 text-center text-zinc-400">
            <input {...getInputProps()} />
            Drag & drop image
          </div>
        ) : (
          <img src={preview} className="rounded" />
        )}

        <button
          onClick={handleSubmitArtwork}
          disabled={loading}
          className="mt-4 w-full bg-white text-black py-2 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Publish Artwork"}
        </button>

        {/* ================= COURSE ================= */}
        <div className="mt-16 border-t border-zinc-800 pt-10">
          <h2 className="text-2xl text-zinc-100 mb-2">
            Update Course (Markdown + Video)
          </h2>

          <input
            type="file"
            accept="video/*"
            onChange={(e) => e.target.files && setVideo(e.target.files[0])}
            className="w-full bg-zinc-800 p-2 text-white"
          />

          {hasVideo && (
            <button
              onClick={deleteCourseVideo}
              className="mt-3 w-full bg-red-600 text-white py-2 rounded"
            >
              Delete Course Video
            </button>
          )}

          <textarea
            rows={16}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="mt-6 w-full bg-zinc-800 p-3 text-white font-mono"
          />

          <button
            onClick={updateCourse}
            disabled={courseUploading}
            className="mt-6 w-full bg-emerald-500 py-3 disabled:opacity-50"
          >
            {courseUploading ? "Updating..." : "Update Course"}
          </button>
        </div>
      </div>
    </div>
  );
}
