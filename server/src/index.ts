import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupWebSocket } from './wsHandler.js';
import { initDatabase, getGameList, getGameDetail } from './database.js';
import path from 'path';
import fs from 'fs';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

// Initialize SQLite
initDatabase();

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Game history API
app.get('/api/games', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  try {
    const games = getGameList(limit, offset);
    res.json({ games });
  } catch (err) {
    res.status(500).json({ error: '获取游戏列表失败' });
  }
});

app.get('/api/games/:id', (req, res) => {
  try {
    const game = getGameDetail(req.params.id);
    if (!game) {
      res.status(404).json({ error: '游戏不存在' });
      return;
    }
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: '获取游戏详情失败' });
  }
});

app.get('/api/games/:id/export', (req, res) => {
  try {
    const game = getGameDetail(req.params.id);
    if (!game) {
      res.status(404).json({ error: '游戏不存在' });
      return;
    }
    // Send as downloadable JSON file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="avalon-${game.roomId}-${game.id}.json"`);
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: '导出失败' });
  }
});

// WebSocket server (attach to HTTP server)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
setupWebSocket(wss);

// Serve client static files in production
const clientDist = path.resolve(process.cwd(), 'client/dist');
app.use(express.static(clientDist));
// SPA fallback: serve index.html for non-API routes
app.get('*', (_req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🏰 阿瓦隆游戏服务器已启动！`);
  console.log(`  HTTP: http://localhost:${PORT}`);
  console.log(`  WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`  API: http://localhost:${PORT}/api/health\n`);
});
