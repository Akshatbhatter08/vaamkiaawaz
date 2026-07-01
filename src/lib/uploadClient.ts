import type { UploadSubfolder } from "./fileStorage";

export async function uploadMediaFile(
  file: Blob | File,
  subfolder: UploadSubfolder,
  filename = "upload.bin",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, filename);
  formData.append("subfolder", subfolder);

  const response = await fetch("/api/uploads", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error || "अपलोड विफल रहा।");
  }
  return data.url;
}

export async function uploadDataUrl(dataUrl: string, subfolder: UploadSubfolder, filename = "image.jpg"): Promise<string> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return uploadMediaFile(blob, subfolder, filename);
}
