const MAX_UPLOAD_WIDTH = 2400;
const MAX_UPLOAD_HEIGHT = 3600;
const WEBP_QUALITY = 0.86;
const WEBP_MIME_TYPE = "image/webp";

function getOptimizedImageName(fileName: string) {
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "image";
  return `${baseName}.webp`;
}

function getTargetSize(width: number, height: number) {
  const scale = Math.min(
    1,
    MAX_UPLOAD_WIDTH / width,
    MAX_UPLOAD_HEIGHT / height,
  );

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToWebpBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, WEBP_MIME_TYPE, WEBP_QUALITY);
  });
}

async function loadImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    image.decoding = "async";
    image.src = objectUrl;

    if (image.decode) {
      await image.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Unable to decode image"));
      });
    }

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function decodeImage(file: File) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, {
        imageOrientation: "from-image",
      } as ImageBitmapOptions);
    } catch {
      // Fall back to <img> decoding below.
    }
  }

  return loadImageElement(file);
}

export async function optimizeImageForUpload(file: File) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const isGif = file.type === "image/gif";
  let decoded: ImageBitmap | HTMLImageElement | null = null;

  try {
    decoded = await decodeImage(file);
    const { width, height } = getTargetSize(decoded.width, decoded.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", {
      alpha: true,
    });

    if (!context) {
      return file;
    }

    context.drawImage(decoded, 0, 0, width, height);

    const blob = await canvasToWebpBlob(canvas);
    if (!blob || blob.type !== WEBP_MIME_TYPE) {
      return file;
    }

    if (blob.size >= file.size && !isGif) {
      return file;
    }

    return new File([blob], getOptimizedImageName(file.name), {
      type: WEBP_MIME_TYPE,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    if (decoded && "close" in decoded) {
      decoded.close();
    }
  }
}
