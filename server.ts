import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const resend = new Resend(process.env.RESEND_API_KEY);

  app.use(express.json());

  // API Route for sending welcome email
  app.post("/api/send-welcome-email", async (req, res) => {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: "TidyUpped <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to TidyUpped Business Card Scanner!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #00548B; margin-bottom: 20px;">Welcome, ${name || "there"}!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #475569;">
              We're thrilled to have you join <strong>TidyUpped Business Card Scanner</strong>. 
              Our AI-powered tool is designed to help you organize your networking effortlessly.
            </p>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="font-size: 18px; color: #00548B; margin-top: 0;">What's Next?</h2>
              <ul style="padding-left: 20px; color: #475569;">
                <li>Scan your first business card using your camera.</li>
                <li>Export your contacts to CSV or vCard.</li>
                <li>Manage your networking events in one place.</li>
              </ul>
            </div>
            <p style="font-size: 14px; color: #94a3b8; margin-top: 30px;">
              If you have any questions, just reply to this email. We're here to help!
            </p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
              &copy; 2026 TidyUpped Business Card Scanner. All rights reserved.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(400).json({ error });
      }

      res.status(200).json({ data });
    } catch (err) {
      console.error("Server error sending email:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
