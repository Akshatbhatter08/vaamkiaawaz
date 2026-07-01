import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_PDF_MIMES,
  IMAGE_MAX_BYTES,
  PDF_MAX_BYTES,
  type UploadSubfolder,
  UPLOAD_SUBFOLDERS,
  mimeToExt,
  saveUpload,
} from "@/lib/fileStorage";

export async function POST(request: NextRequest) {
  const authPayload = await requireAuth(request);
  if (authPayload instanceof NextResponse) return authPayload;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const subfolderRaw = String(formData.get("subfolder") || "content");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "फ़ाइल आवश्यक है।" }, { status: 400 });
    }

    if (!UPLOAD_SUBFOLDERS.includes(subfolderRaw as UploadSubfolder)) {
      return NextResponse.json({ error: "अमान्य upload folder।" }, { status: 400 });
    }

    const subfolder = subfolderRaw as UploadSubfolder;
    const mimeType = file.type || "application/octet-stream";
    const isImage = ALLOWED_IMAGE_MIMES.has(mimeType);
    const isPdf = ALLOWED_PDF_MIMES.has(mimeType);

    if (subfolder === "resources") {
      if (!isPdf) {
        return NextResponse.json({ error: "केवल PDF अपलोड करें।" }, { status: 400 });
      }
      if (file.size > PDF_MAX_BYTES) {
        return NextResponse.json({ error: "फ़ाइल 3.5MB से कम होनी चाहिए।" }, { status: 400 });
      }
    } else if (!isImage) {
      return NextResponse.json({ error: "केवल image file अपलोड करें।" }, { status: 400 });
    } else if (file.size > IMAGE_MAX_BYTES) {
      return NextResponse.json({ error: "फ़ाइल 5MB से कम होनी चाहिए।" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = mimeToExt(mimeType);
    const url = await saveUpload(buffer, subfolder, ext);

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("POST /api/uploads error:", error);
    return NextResponse.json({ error: "अपलोड सेव नहीं हो सका।" }, { status: 500 });
  }
}
