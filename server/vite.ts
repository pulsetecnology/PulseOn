import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

/**
 * Log utilitário com timestamp e origem.
 */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Configura o Vite em modo middleware para desenvolvimento.
 */
export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
    port: parseInt(process.env.PORT || "3000"),
    strictPort: true,
    host: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1); // Encerra se o Vite der erro crítico
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Ativa os middlewares do Vite
  app.use(vite.middlewares);

  // Serve index.html dinâmico (com transformação do Vite)
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      // Adiciona hash simples na dev para evitar cache do navegador
      if (process.env.NODE_ENV !== "production") {
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`
        );
      }

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

/**
 * Serve arquivos estáticos em produção (dist/public).
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  console.log("serveStatic using distPath:", distPath);

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `❌ Could not find the build directory: ${distPath}. Run 'vite build' first.`
    );
  }

  app.use(express.static(distPath));

  // Rota catch-all para aplicações SPA
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
