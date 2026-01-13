import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CATEGORIES = ["portrait", "landscape", "abstract"];

interface PhotoUpload {
  id: string;
  file: File;
  preview: string;
  title: string;
  description: string;
  category: string;
}

export default function Admin() {
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoUpload[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      title: "",
      description: "",
      category: "portrait",
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const updatePhoto = (
    id: string,
    field: keyof Omit<PhotoUpload, "id" | "file" | "preview">,
    value: string
  ) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) throw new Error("Cloudinary upload failed");
    return res.json();
  };

  const handleUpload = async () => {
    if (photos.length === 0) {
      toast.error("Select at least one image");
      return;
    }

    for (const p of photos) {
      if (!p.title.trim()) {
        toast.error("All photos must have a title");
        return;
      }
    }

    setIsUploading(true);

    try {
      for (const photo of photos) {
        // 1. Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(photo.file);

        // 2. Save to backend
        await fetch(`${API_BASE_URL}/api/admin/artworks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: photo.title,
            description: photo.description,
            category: photo.category,
            image_url: cloudinaryResult.secure_url,
            is_for_sale: false,
          }),
        });
      }

      toast.success("All photos uploaded successfully!");
      setPhotos([]);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-6 lg:px-12">
          <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

          <label className="border-dashed border-2 rounded-xl p-10 flex flex-col items-center cursor-pointer">
            <Upload className="mb-4" />
            <p>Click to upload images</p>
            <Input
              type="file"
              multiple
              className="hidden"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
            />
          </label>

          {photos.length > 0 && (
            <>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="my-6"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  "Upload to Cloudinary"
                )}
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <div key={photo.id} className="border rounded-xl p-4">
                    <img
                      src={photo.preview}
                      className="w-full h-48 object-cover rounded"
                    />

                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X size={16} />
                    </Button>

                    <Label>Title</Label>
                    <Input
                      value={photo.title}
                      onChange={(e) =>
                        updatePhoto(photo.id, "title", e.target.value)
                      }
                    />

                    <Label>Description</Label>
                    <Textarea
                      value={photo.description}
                      onChange={(e) =>
                        updatePhoto(photo.id, "description", e.target.value)
                      }
                    />

                    <Label>Category</Label>
                    <select
                      value={photo.category}
                      onChange={(e) =>
                        updatePhoto(photo.id, "category", e.target.value)
                      }
                      className="w-full border p-2 rounded"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          {photos.length === 0 && (
            <div className="text-center mt-12">
              <ImageIcon size={64} className="mx-auto opacity-40" />
              <p>No photos selected</p>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
