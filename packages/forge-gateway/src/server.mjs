import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { buildCatalog, searchCatalog, getEntry } from "./catalog.mjs";
import { runSandboxed } from "./sandbox.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYGROUND = path.join(__dirname, "..", "playground", "index.html");

export function createApp({ root, token } = {}) {
  const entries = buildCatalog(root);
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  const requireAuth = (req, res, next) => {
    if (!token) return next();
    const header = req.headers.authorization || "";
    if (header === `Bearer ${token}`) return next();
    res.status(401).json({ error: "unauthorized" });
  };

  app.get("/health", (req, res) => {
    res.json({ status: "ok", catalog: entries.length, uptime: process.uptime(), time: new Date().toISOString() });
  });

  app.get("/api/search", (req, res) => {
    const q = String(req.query.q || "");
    const ids = searchCatalog(entries, q, { type: req.query.type }).slice(0, 10);
    res.json({ query: q, count: ids.length, hits: ids.map((id) => getEntry(entries, id)) });
  });

  app.post("/api/execute", requireAuth, (req, res) => {
    const catalogApi = {
      get: (id) => getEntry(entries, String(id)),
      search: (q) => searchCatalog(entries, String(q)).map((id) => ({ id, title: getEntry(entries, id).title })),
    };
    res.json(runSandboxed(String(req.body?.code || ""), catalogApi));
  });

  app.get("/playground", (req, res) => {
    res.type("html").send(fs.readFileSync(PLAYGROUND, "utf8"));
  });

  // MCP endpoint on a raw node http server — the SDK transport manages the
  // request stream itself, so it must not be pre-parsed by express.json().
  // One transport + one server per request, closed on response close (canonical
  // stateless pattern from the SDK examples).
  const mcpHandler = async (req, res) => {
    if (token) {
      const header = req.headers.authorization || "";
      if (header !== `Bearer ${token}`) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null }));
        return;
      }
    }
    if (req.method !== "POST") {
      res.writeHead(405, { Allow: "POST", "Content-Type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }));
      return;
    }
    try {
      const server = new McpServer({ name: "forge-gateway", version: "0.1.0" });
      server.registerTool("search", {
        title: "Search the Stellar context catalog",
        description:
          "Ranked search over the Forge catalog: docs, skills, playbooks, standards (SEP/CAP), ecosystem data, community intel, evals, agents and contract templates. Returns entry IDs ranked by relevance.",
        inputSchema: {
          query: z.string().describe("natural-language or keyword query"),
          type: z.enum(["skill", "playbook", "standard", "ecosystem", "intel", "eval", "agent", "template", "doc", "operation"]).optional().describe("optional entry-type filter"),
          limit: z.number().int().min(1).max(20).optional().describe("max results (default 5)"),
        },
      }, async ({ query, type, limit }) => {
        const ids = searchCatalog(entries, query, { type }).slice(0, Math.min(limit ?? 5, 20));
        const hits = ids.map((id) => {
          const e = getEntry(entries, id);
          return { id, type: e.type, title: e.title, description: e.description, source: e.source };
        });
        return { content: [{ type: "text", text: JSON.stringify({ count: hits.length, hits }, null, 2) }] };
      });
      server.registerTool("execute", {
        title: "Run sandboxed JavaScript against the catalog",
        description:
          "Execute agent code in a no-network sandbox. Code may call catalog.get(id) and catalog.search(query). No require, fetch, process or network access. Results are serialized; console output is captured.",
        inputSchema: { code: z.string().describe("JavaScript source, e.g. catalog.get('sep-41').title") },
      }, async ({ code }) => {
        const catalogApi = {
          get: (id) => getEntry(entries, String(id)),
          search: (q) => searchCatalog(entries, String(q)).map((id) => ({ id, title: getEntry(entries, id).title })),
        };
        const out = runSandboxed(String(code), catalogApi);
        const text = JSON.stringify(out, null, 2);
        return { content: [{ type: "text", text }], isError: !!out.error };
      });
      server.registerTool("catalog_summary", {
        title: "Catalog summary",
        description: "Counts of catalog entries by type.",
        inputSchema: { _unused: z.string().optional() },
      }, async () => {
        const byType = {};
        for (const e of entries) byType[e.type] = (byType[e.type] || 0) + 1;
        return { content: [{ type: "text", text: JSON.stringify({ total: entries.length, byType }, null, 2) }] };
      });

      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      await transport.handleRequest(req, res);
      res.on("close", () => {
        transport.close();
        server.close();
      });
    } catch (err) {
      console.error("mcp error:", err.message);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null }));
      } else {
        res.end();
      }
    }
  };

  const httpServer = http.createServer((req, res) => {
    const url = (req.url || "").split("?")[0];
    if (url === "/mcp") {
      mcpHandler(req, res).catch((err) => {
        console.error("mcp handler error:", err.message);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        } else {
          res.end();
        }
      });
      return;
    }
    app(req, res);
  });

  return { app, entries, httpServer };
}

export function startServer({ port = Number(process.env.PORT || 8787), token = process.env.FORGE_GATEWAY_TOKEN, root } = {}) {
  const { entries, httpServer } = createApp({ root, token });
  httpServer.listen(port, () => {
    const auth = token ? "token-auth enabled" : "open mode (dev)";
    console.log(`forge-gateway listening on http://localhost:${port}`);
    console.log(`catalog entries: ${entries.length} | auth: ${auth}`);
    console.log(`MCP endpoint:   POST http://localhost:${port}/mcp`);
    console.log(`playground:     http://localhost:${port}/playground`);
  });
  return httpServer;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) startServer();