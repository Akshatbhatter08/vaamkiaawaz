import { NextRequest, NextResponse } from "next/server";
import {
  IMAGE_MAX_BYTES,
  PDF_MAX_BYTES,
  type UploadSubfolder,
  UPLOAD_SUBFOLDERS,
  detectFileType,
  saveUpload,
} from "@/lib/fileStorage";
import { requireUser, canPublishContent, isMasterAdmin } from "@/lib/requireUser";

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

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

    if (subfolder === "resources") {
      if (!isMasterAdmin(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (!canPublishContent(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectFileType(buffer);
    if (!detected) {
      return NextResponse.json({ error: "फ़ाइल प्रकार पहचान नहीं हो सका।" }, { status: 400 });
    }

    if (subfolder === "resources") {
      if (detected.mime !== "application/pdf") {
        return NextResponse.json({ error: "केवल PDF अपलोड करें।" }, { status: 400 });
      }
      if (buffer.length > PDF_MAX_BYTES) {
        return NextResponse.json({ error: "फ़ाइल 3.5MB से कम होनी चाहिए।" }, { status: 400 });
      }
    } else {
      if (!detected.mime.startsWith("image/")) {
        return NextResponse.json({ error: "केवल image file अपलोड करें।" }, { status: 400 });
      }
      if (buffer.length > IMAGE_MAX_BYTES) {
        return NextResponse.json({ error: "फ़ाइल 5MB से कम होनी चाहिए।" }, { status: 400 });
      }
    }

    const url = await saveUpload(buffer, subfolder, detected.ext);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("POST /api/uploads error:", error);
    return NextResponse.json({ error: "अपलोड सेव नहीं हो सका।" }, { status: 500 });
  }
}
