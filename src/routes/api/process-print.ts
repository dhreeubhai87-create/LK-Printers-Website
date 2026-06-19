import { createFileRoute } from '@tanstack/react-router';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

export const Route = createFileRoute('/api/process-print')({
  server: {
    handlers: {
      POST: async ({ request }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const productStr = formData.get('product') as string;
      const action = formData.get('action') as string;

      if (!file || !productStr) {
        return new Response(JSON.stringify({ error: "Missing file or product" }), { status: 400 });
      }

      const product = JSON.parse(productStr);
      const buffer = Buffer.from(await file.arrayBuffer());
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');

      let report: any = {
        status: "valid",
        issues: [],
        dimensions: { width: 0, height: 0 },
        dpi: 300, // placeholder default
        colorMode: "RGB" // placeholder default
      };

      if (isImage) {
        // Use Sharp to analyze image
        const metadata = await sharp(buffer).metadata();

        // Convert px to mm (assume default 300 dpi if not provided)
        const dpiX = metadata.density || 300;
        const widthMm = (metadata.width! / dpiX) * 25.4;
        const heightMm = (metadata.height! / dpiX) * 25.4;

        report.dimensions = { width: widthMm, height: heightMm };
        report.dpi = dpiX;
        report.colorMode = metadata.space === 'cmyk' ? 'CMYK' : 'RGB';

        const targetW = product.w;
        const targetH = product.h;

        // Validate Dimensions (allow 1mm tolerance)
        if (Math.abs(widthMm - targetW) > 1 || Math.abs(heightMm - targetH) > 1) {
          report.status = "invalid";
          report.issues.push(`Dimensions mismatch: Expected ${targetW}x${targetH}mm, got ${widthMm.toFixed(1)}x${heightMm.toFixed(1)}mm.`);
        }

        if (report.colorMode !== "CMYK" && product.color === "CMYK") {
          report.issues.push("Color mode is RGB. Print requires CMYK.");
          // Only warn, usually we can auto convert
        }

        if (dpiX < product.dpi) {
          report.issues.push(`Low resolution: Expected at least ${product.dpi} DPI, got ${dpiX} DPI.`);
        }
      } else if (isPdf) {
        // Use pdf-lib to analyze PDF
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();
        const pageCount = pages.length;

        if (pageCount !== product.pages) {
          report.status = "invalid";
          report.issues.push(`Page count mismatch: Expected ${product.pages} pages, got ${pageCount} pages.`);
        }

        if (pageCount > 0) {
          const firstPage = pages[0];
          const { width, height } = firstPage.getSize(); // in points (1/72 inch)
          const widthMm = (width / 72) * 25.4;
          const heightMm = (height / 72) * 25.4;
          report.dimensions = { width: widthMm, height: heightMm };

          const targetW = product.w;
          const targetH = product.h;

          if (Math.abs(widthMm - targetW) > 1 || Math.abs(heightMm - targetH) > 1) {
            report.status = "invalid";
            report.issues.push(`Dimensions mismatch: Expected ${targetW}x${targetH}mm, got ${widthMm.toFixed(1)}x${heightMm.toFixed(1)}mm.`);
          }
        }
      }

      if (action === "analyze") {
        return new Response(JSON.stringify({
          report,
          // For initial preview of image, just send base64
          previewUrl: isImage ? `data:${file.type};base64,${buffer.toString('base64')}` : null
        }));
      }

      // AUTO FIX LOGIC
      if (action === "fix" && isImage) {
        // Calculate new dimensions in pixels at 300 dpi
        const targetDpi = 300;
        const pxPerMm = targetDpi / 25.4;

        // Target dimensions including bleed
        const totalW_px = Math.round((product.w + product.bleed * 2) * pxPerMm);
        const totalH_px = Math.round((product.h + product.bleed * 2) * pxPerMm);

        const fixedBuffer = await sharp(buffer)
          .resize({
            width: totalW_px,
            height: totalH_px,
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 } // Add white background
          })
          .jpeg({ quality: 90 }) // convert to jpeg for easy web preview
          .toBuffer();

        const fixedUrl = `data:image/jpeg;base64,${fixedBuffer.toString('base64')}`;

        // Return fixed file URL
        return new Response(JSON.stringify({ fixedUrl }));
      }

      if (action === "fix" && isPdf) {
        // For PDF we might add a bounding box / scale it up
        const pdfDoc = await PDFDocument.load(buffer);
        const pages = pdfDoc.getPages();

        for (const page of pages) {
          const { width, height } = page.getSize();
          const scale = Math.min((product.w * 72 / 25.4) / width, (product.h * 72 / 25.4) / height);
          page.scale(scale, scale);
        }

        const fixedPdfBytes = await pdfDoc.save();
        const fixedUrl = `data:application/pdf;base64,${Buffer.from(fixedPdfBytes).toString('base64')}`;

        return new Response(JSON.stringify({ fixedUrl }));
      }

      return new Response(JSON.stringify({ error: "Unsupported operation" }), { status: 400 });

    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
      },
    },
  },
});
