import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

/* ---------- Static Categories ---------- */
const categories = [
  { id: 1, name: "Portrait" },
  { id: 2, name: "Landscape" },
  { id: 3, name: "Abstract" },
];

export default function Admin() {
  /* ================= ARTWORK CREATE ================= */
  const [artTitle, setArtTitle] = useState("");
  const [artDescription, setArtDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ================= EXISTING ARTWORKS ================= */
  const [artworks, setArtworks] = useState<any[]>([]);

  /* ================= EDITING ================= */
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);

  /* ================= COURSE ================= */
  const [markdown, setMarkdown] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [courseUploading, setCourseUploading] = useState(false);

  /* ================= LOAD COURSE ================= */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/course`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.markdown) setMarkdown(data.markdown);
        setHasVideo(!!data?.video_path);
      })
      .catch(console.error);
  }, []);

  /* ================= LOAD ARTWORKS ================= */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/artworks`)
      .then((res) => res.json())
      .then(setArtworks)
      .catch(console.error);
  }, []);

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/login";
  };

  /* ================= DROPZONE ================= */
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: ([selected]) => {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    },
  });

  /* ================= CREATE ARTWORK ================= */
  const handleSubmitArtwork = async () => {
    if (!file || !artTitle || !categoryId || !price) {
      alert("Fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/upload`,
        { method: "POST", credentials: "include", body: formData }
      );

      const uploadData = await uploadRes.json();

      const createRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/artworks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: artTitle,
            description: artDescription,
            category_id: Number(categoryId),
            image_url: uploadData.url,
            price_inr: Number(price),
          }),
        }
      );

      const newArtwork = await createRes.json();
      setArtworks((prev) => [newArtwork, ...prev]);

      setArtTitle("");
      setArtDescription("");
      setCategoryId("");
      setPrice("");
      setFile(null);
      setPreview(null);

      alert("Artwork uploaded");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ARTWORK ================= */
  const deleteArtwork = async (id: number) => {
    if (!confirm("Delete permanently?")) return;

    await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/artworks/${id}`,
      { method: "DELETE", credentials: "include" }
    );

    setArtworks((prev) => prev.filter((a) => a.id !== id));
  };

  /* ================= START EDIT ================= */
  const startEdit = (art: any) => {
    setEditingId(art.id);
    setEditTitle(art.title);
    setEditDescription(art.description);
    setEditCategory(String(art.category_id));
    setEditPrice(String(art.price_inr ?? ""));
  };

  /* ================= SAVE EDIT ================= */
  const saveEdit = async (id: number) => {
    try {
      let newImageUrl = null;

      if (editFile) {
        const fd = new FormData();
        fd.append("image", editFile);

        const up = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/upload`,
          { method: "POST", credentials: "include", body: fd }
        );

        const data = await up.json();
        newImageUrl = data.url;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/artworks/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: editTitle,
            description: editDescription,
            category_id: Number(editCategory),
            image_url: newImageUrl,
            price_inr: Number(editPrice),
          }),
        }
      );

      const updated = await res.json();

      setArtworks((prev) => prev.map((a) => (a.id === id ? updated : a)));

      setEditingId(null);
      setEditFile(null);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  /* ================= UPDATE COURSE ================= */
  const updateCourse = async () => {
    const fd = new FormData();
    fd.append("markdown", markdown);
    if (video) fd.append("video", video);

    setCourseUploading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/course`,
        { method: "PUT", credentials: "include", body: fd }
      );

      const data = await res.json();
      setHasVideo(!!data.video_path);
      setVideo(null);

      alert("Course updated");
    } catch {
      alert("Course update failed");
    } finally {
      setCourseUploading(false);
    }
  };

  /* ================= DELETE COURSE VIDEO ================= */
  const deleteCourseVideo = async () => {
    if (!confirm("Delete course video?")) return;

    await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/course/video`,
      { method: "DELETE", credentials: "include" }
    );

    setHasVideo(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-zinc-400 mt-1">
            Manage artworks, pricing, and course content
          </p>
        </div>

        {/* Logout */}
        <div className="flex justify-end mb-6">
          <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded">
            Logout
          </button>
        </div>

        {/* Existing Artworks */}
        <h2 className="text-2xl mb-4">Existing Artworks</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {artworks.map((art) => (
            <div
              key={art.id}
              className="relative group border border-zinc-800 p-2 rounded-lg transition hover:scale-[1.02] hover:border-zinc-600"
            >
              <img src={art.image_url} className="h-40 w-full object-cover mb-2" />

              {editingId === art.id ? (
                <>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full mb-1 bg-zinc-800 p-1" />
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full mb-1 bg-zinc-800 p-1" />
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full mb-1 bg-zinc-800 p-1" />

                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full mb-1 bg-zinc-800 p-1">
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <input type="file" accept="image/*" onChange={(e) => e.target.files && setEditFile(e.target.files[0])} className="mb-2" />

                  <button onClick={() => saveEdit(art.id)} className="bg-emerald-600 px-2 py-1 mr-2">Save</button>
                  <button onClick={() => setEditingId(null)} className="bg-zinc-600 px-2 py-1">Cancel</button>
                </>
              ) : (
                <>
                  <p className="font-semibold">{art.title}</p>
                  <p className="text-sm text-zinc-400">{art.description}</p>

                  {art.price_inr && (
                    <p className="text-white font-semibold mt-1">
                      ₹{art.price_inr.toLocaleString()}
                    </p>
                  )}

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                    <button onClick={() => startEdit(art)} className="bg-blue-600 text-xs px-2 py-1 rounded">Edit</button>
                    <button onClick={() => deleteArtwork(art.id)} className="bg-red-600 text-xs px-2 py-1 rounded">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Upload Artwork */}
        <h2 className="text-2xl mb-4">Upload Artwork</h2>

        <input placeholder="Title" value={artTitle} onChange={(e) => setArtTitle(e.target.value)} className="w-full mb-2 bg-zinc-800 p-2" />
        <textarea placeholder="Description" value={artDescription} onChange={(e) => setArtDescription(e.target.value)} className="w-full mb-2 bg-zinc-800 p-2" />
        <input type="number" placeholder="Price in ₹" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full mb-2 bg-zinc-800 p-2" />

        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full mb-2 bg-zinc-800 p-2">
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {!preview ? (
          <div {...getRootProps()} className="border-dashed border p-6 text-center mb-2">
            <input {...getInputProps()} />
            Drag & drop image
          </div>
        ) : (
          <img src={preview} className="h-40 mb-2" />
        )}

        <button onClick={handleSubmitArtwork} disabled={loading} className="bg-white text-black px-4 py-2">
          {loading ? "Uploading..." : "Publish Artwork"}
        </button>

        {/* Course Section */}
        <div className="mt-16 border-t border-zinc-800 pt-10">
          <h2 className="text-2xl mb-4">Course Content</h2>

          <input type="file" accept="video/*" onChange={(e) => e.target.files && setVideo(e.target.files[0])} className="mb-3 block" />

          {hasVideo && (
            <button onClick={deleteCourseVideo} className="bg-red-600 px-3 py-1 rounded mb-3">
              Delete Course Video
            </button>
          )}

          <textarea
            rows={12}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full bg-zinc-800 p-3 mb-4 rounded"
          />

          <button
            onClick={updateCourse}
            disabled={courseUploading}
            className="bg-emerald-500 px-4 py-2 rounded hover:bg-emerald-600 transition"
          >
            {courseUploading ? "Updating..." : "Update Course"}
          </button>
        </div>
      </div>
    </div>
  );
}
