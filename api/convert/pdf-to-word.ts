/**
 * api/convert/pdf-to-word.ts
 * Vercel Edge function — PDF → DOCX via CloudConvert Sync API
 *
 * Uses sync.api.cloudconvert.com — one request, no polling needed.
 *
 * Env var: CLOUDCONVERT_API_KEY (set in Vercel dashboard + .env locally)
 *
 * Client sends:
 *   POST /api/convert/pdf-to-word
 *   Content-Type: application/octet-stream
 *   X-Filename: document.pdf
 *   Body: raw PDF bytes
 */

export const config = { runtime: "edge" };

function jsonErr(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return jsonErr("Method not allowed", 405);

  const apiKey = process.env.CLOUDCONVERT_API_KEY;
  if (!apiKey) return jsonErr("CLOUDCONVERT_API_KEY env var not set", 500);

  // ── Read raw PDF bytes ──────────────────────────────────────
  const fileBuffer = await request.arrayBuffer();
  if (fileBuffer.byteLength === 0) return jsonErr("No file data received", 400);
  const filename = request.headers.get("x-filename") ?? "document.pdf";

  // ── Upload file to a temporary public URL via CloudConvert upload task ──
  // First, create an upload task to get a direct upload URL
  const createRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tasks: {
        "import-file": { operation: "import/upload" },
        "convert-file": {
          operation: "convert",
          input: "import-file",
          output_format: "docx",
          engine: "libreoffice",
        },
        "export-file": {
          operation: "export/url",
          input: "convert-file",
          inline: false,
          archive_multiple_files: false,
        },
      },
    }),
  });

  if (!createRes.ok) return jsonErr(`CloudConvert job error: ${await createRes.text()}`, 502);

  const job = (await createRes.json()) as {
    data: {
      id: string;
      tasks: Array<{
        name: string;
        result?: { form?: { url: string; parameters: Record<string, string> } };
      }>;
    };
  };

  const uploadTask = job.data.tasks.find((t) => t.name === "import-file");
  if (!uploadTask?.result?.form) return jsonErr("No upload URL returned", 502);

  const { url: uploadUrl, parameters } = uploadTask.result.form;

  // ── Upload the PDF ──────────────────────────────────────────
  const uploadForm = new FormData();
  for (const [k, v] of Object.entries(parameters)) uploadForm.append(k, v);
  uploadForm.append("file", new Blob([fileBuffer], { type: "application/pdf" }), filename);

  const uploadRes = await fetch(uploadUrl, { method: "POST", body: uploadForm });
  if (!uploadRes.ok) return jsonErr(`File upload failed: ${await uploadRes.text()}`, 502);

  // ── Wait for conversion to complete ────────────────────────
  const waitRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${job.data.id}/wait`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!waitRes.ok) return jsonErr(`Conversion wait failed: ${await waitRes.text()}`, 502);

  const done = (await waitRes.json()) as {
    data: {
      tasks: Array<{
        name: string;
        status: string;
        result?: { files?: Array<{ url: string }> };
      }>;
    };
  };

  // Check if conversion task failed
  const convertTask = done.data.tasks.find((t) => t.name === "convert-file");
  if (convertTask?.status === "error") {
    return jsonErr("CloudConvert conversion failed — check file format", 422);
  }

  const exportTask = done.data.tasks.find((t) => t.name === "export-file");
  const fileUrl = exportTask?.result?.files?.[0]?.url;
  if (!fileUrl) return jsonErr("No output file URL from CloudConvert", 502);

  // ── Download DOCX and stream to client ─────────────────────
  const docxRes = await fetch(fileUrl);
  if (!docxRes.ok) return jsonErr("Failed to download converted file", 502);

  const baseName = filename.replace(/\.[^.]+$/i, "");
  return new Response(docxRes.body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${baseName}.docx"`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
