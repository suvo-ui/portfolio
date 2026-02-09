import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

export default function Admin() {
  /* ================= CATEGORIES ================= */
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState("");

  /* ================= CREATE ARTWORK ================= */
  const [artTitle, setArtTitle] = useState("");
  const [artDescription, setArtDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ================= EXISTING ARTWORKS ================= */
  const [artworks, setArtworks] = useState<any[]>([]);

  /* ================= EDIT ================= */
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);

  /* ================= COURSE ================= */
  const [markdown, setMarkdown] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [courseUploading, setCourseUploading] = useState(false);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/artworks`)
      .then((res) => res.json())
      .then(setArtworks)
      .catch(console.error);

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/course`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.markdown) setMarkdown(data.markdown);
        setHasVideo(!!data?.video_path);
      })
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

  /* ================= CATEGORY CRUD ================= */
  const createCategory = async () => {
    if (!newCategory.trim()) return;

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newCategory }),
      }
    );

    const created = await res.json();
    setCategories((prev) => [...prev, created]);
    setNewCategory("");
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete category?")) return;

    await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/categories/${id}`,
      { method: "DELETE", credentials: "include" }
    );

    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  /* ================= CREATE ARTWORK ================= */
  const handleSubmitArtwork = async () => {
    if (!file || !artTitle || !categoryId || !price) return;

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("image", file);

      const uploadRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/upload`,
        { method: "POST", credentials: "include", body: fd }
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
            size,
          }),
        }
      );

      const newArtwork = await createRes.json();
      setArtworks((prev) => [newArtwork, ...prev]);

      setArtTitle("");
      setArtDescription("");
      setCategoryId("");
      setPrice("");
      setSize("");
      setFile(null);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteArtwork = async (id: number) => {
    if (!confirm("Delete permanently?")) return;

    await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/artworks/${id}`,
      { method: "DELETE", credentials: "include" }
    );

    setArtworks((prev) => prev.filter((a) => a.id !== id));
  };

  /* ================= SOLD TOGGLE ================= */
  const toggleSold = async (art: any) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/artworks/${art.id}/sold`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_sold: !art.is_sold }),
      }
    );

    const updated = await res.json();
    setArtworks((prev) => prev.map((a) => (a.id === art.id ? updated : a)));
  };

  /* ================= EDIT ================= */
  const startEdit = (art: any) => {
    setEditingId(art.id);
    setEditTitle(art.title);
    setEditDescription(art.description);
    setEditCategory(String(art.category_id));
    setEditPrice(String(art.price_inr ?? ""));
    setEditSize(String(art.size ?? ""));
  };

  const saveEdit = async (id: number) => {
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
          size: editSize,
        }),
      }
    );

    const updated = await res.json();
    setArtworks((prev) => prev.map((a) => (a.id === id ? updated : a)));

    setEditingId(null);
    setEditFile(null);
  };

  /* ================= COURSE ================= */
  const updateCourse = async () => {
    const fd = new FormData();
    fd.append("markdown", markdown);
    if (video) fd.append("video", video);

    setCourseUploading(true);

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/course`, {
      method: "PUT",
      credentials: "include",
      body: fd,
    });

    const data = await res.json();
    setHasVideo(!!data.video_path);
    setVideo(null);
    setCourseUploading(false);
  };

  const deleteCourseVideo = async () => {
    if (!confirm("Delete course video?")) return;

    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/course/video`, {
      method: "DELETE",
      credentials: "include",
    });

    setHasVideo(false);
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">

        {/* HEADER + LOGOUT */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        {/* CATEGORY MANAGEMENT */}
        <h2 className="text-2xl mb-4">Categories</h2>

        <div className="flex gap-2 mb-4">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category"
            className="flex-1 bg-zinc-800 p-2 rounded"
          />
          <button onClick={createCategory} className="bg-emerald-600 px-4 py-2 rounded">
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((c) => (
            <div key={c.id} className="bg-zinc-800 px-3 py-1 rounded-full flex gap-2">
              <span>{c.name}</span>
              <button onClick={() => deleteCategory(c.id)} className="text-red-400">✕</button>
            </div>
          ))}
        </div>

        {/* EXISTING ARTWORKS */}
        <h2 className="text-2xl mb-4">Existing Artworks</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {artworks.map((art) => (
            <div key={art.id} className="border border-zinc-800 p-2 rounded-lg">
              <img src={art.image_url} className="h-40 w-full object-cover mb-2" />

              {editingId === art.id ? (
                <>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full mb-1 bg-zinc-800 p-1" />
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full mb-1 bg-zinc-800 p-1" />
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full mb-1 bg-zinc-800 p-1" />
                  <input value={editSize} onChange={(e) => setEditSize(e.target.value)} className="w-full mb-1 bg-zinc-800 p-1" />

                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full mb-1 bg-zinc-800 p-1">
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <input type="file" onChange={(e) => e.target.files && setEditFile(e.target.files[0])} className="mb-2" />

                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(art.id)} className="bg-emerald-600 text-xs px-2 py-1 rounded">Save</button>
                    <button onClick={() => setEditingId(null)} className="bg-zinc-600 text-xs px-2 py-1 rounded">Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold">{art.title}</p>
                  {art.price_inr && <p>₹{art.price_inr.toLocaleString()}</p>}
                  {art.size && <p className="text-xs text-zinc-400">{art.size}</p>}

                  <button
                    onClick={() => toggleSold(art)}
                    className="mt-2 text-xs px-2 py-1 rounded bg-yellow-500 text-black"
                  >
                    {art.is_sold ? "Mark Available" : "Mark Sold"}
                  </button>

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => startEdit(art)} className="bg-blue-600 text-xs px-2 py-1 rounded">Edit</button>
                    <button onClick={() => deleteArtwork(art.id)} className="bg-red-600 text-xs px-2 py-1 rounded">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* UPLOAD ARTWORK */}
        <h2 className="text-2xl mb-4">Upload Artwork</h2>

        <input placeholder="Title" value={artTitle} onChange={(e) => setArtTitle(e.target.value)} className="w-full mb-2 bg-zinc-800 p-2" />
        <textarea placeholder="Description" value={artDescription} onChange={(e) => setArtDescription(e.target.value)} className="w-full mb-2 bg-zinc-800 p-2" />
        <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full mb-2 bg-zinc-800 p-2" />
        <input placeholder="Size" value={size} onChange={(e) => setSize(e.target.value)} className="w-full mb-2 bg-zinc-800 p-2" />

        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full mb-2 bg-zinc-800 p-2">
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {!preview ? (
          <div {...getRootProps()} className="border-dashed border p-6 text-center mb-2 cursor-pointer">
            <input {...getInputProps()} />
            Drag & drop image
          </div>
        ) : (
          <img src={preview} className="h-40 mb-2" />
        )}

        <button onClick={handleSubmitArtwork} disabled={loading} className="bg-white text-black px-4 py-2 mb-12">
          {loading ? "Uploading..." : "Publish Artwork"}
        </button>

        {/* COURSE */}
        <div className="border-t border-zinc-800 pt-10">
          <h2 className="text-2xl mb-4">Course Content</h2>

          <input type="file" accept="video/*" onChange={(e) => e.target.files && setVideo(e.target.files[0])} className="mb-3" />

          {hasVideo && (
            <button onClick={deleteCourseVideo} className="bg-red-600 px-3 py-1 rounded mb-3">
              Delete Course Video
            </button>
          )}

          <textarea rows={12} value={markdown} onChange={(e) => setMarkdown(e.target.value)} className="w-full bg-zinc-800 p-3 mb-4 rounded" />

          <button onClick={updateCourse} disabled={courseUploading} className="bg-emerald-500 px-4 py-2 rounded">
            {courseUploading ? "Updating..." : "Update Course"}
          </button>
        </div>
      </div>
    </div>
  );
}
