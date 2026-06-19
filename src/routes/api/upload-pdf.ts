import { createFileRoute } from '@tanstack/react-router';
import fs from 'fs';
import path from 'path';

export const Route = createFileRoute('/api/upload-pdf')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { pdfBase64, orderNumber } = body;

          if (!pdfBase64 || !orderNumber) {
            return new Response(JSON.stringify({ error: "Missing data" }), { status: 400 });
          }

          const buffer = Buffer.from(pdfBase64, 'base64');
          const fileName = `${orderNumber}.pdf`;

          // Save locally to public directory
          try {
            const publicOrdersDir = path.join(process.cwd(), 'public', 'orders');
            if (!fs.existsSync(publicOrdersDir)) {
              fs.mkdirSync(publicOrdersDir, { recursive: true });
            }
            const filePath = path.join(publicOrdersDir, fileName);
            fs.writeFileSync(filePath, buffer);
            console.log(`Successfully saved invoice locally: ${filePath}`);
          } catch (fsErr) {
            console.error("Local file write failed (might be serverless/read-only environment):", fsErr);
          }

          return new Response(JSON.stringify({
            success: true,
            fileName
          }));
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
      }
    }
  }
});
