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

    const text = formatGameSummary(game);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="avalon-${game.roomId}.txt"`);
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: '导出失败' });
  }
});

// Format game as readable text summary
const ROLE_NAMES: Record<string, string> = {
  merlin: '梅林', percival: '派西维尔', loyal_servant: '忠臣',
  morgana: '莫甘娜', assassin: '刺客', minion_of_mordred: '爪牙', oberon: '奥伯伦',
};

function formatGameSummary(game: any): string {
  const state = game.fullState;
  if (!state) return '游戏数据不完整';

  const date = new Date(game.createdAt);
  const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  const winnerText = game.winner === 'good' ? '⚜ 善良方胜利' : game.winner === 'evil' ? '☠ 邪恶方胜利' : '未完成';
  const getPlayerName = (id: string) => {
    const p = game.players.find((pl: any) => pl.id === id);
    return p?.name || '未知';
  };

  const lines: string[] = [];
  lines.push('🏰 阿瓦隆对局记录');
  lines.push(`房间: ${game.roomId} · ${dateStr} · ${game.playerCount}人`);
  lines.push(`结果: ${winnerText}`);
  if (game.winReason) lines.push(`      ${game.winReason}`);
  lines.push('');

  // Players & roles
  lines.push('👥 玩家身份');
  if (state.roles) {
    for (const role of state.roles) {
      const name = getPlayerName(role.playerId);
      const roleName = ROLE_NAMES[role.role] || role.role;
      const tag = role.alignment === 'evil' ? '🔴' : '🔵';
      lines.push(`  ${tag} ${name} → ${roleName}`);
    }
  }
  lines.push('');

  // Round history
  const roundHistory = state.roundHistory || [];
  const missionResults = state.missionResults || [];

  if (roundHistory.length > 0 || missionResults.length > 0) {
    lines.push('📜 对局复盘');
    const goodWins = missionResults.filter((r: any) => r.success).length;
    const evilWins = missionResults.filter((r: any) => !r.success).length;
    lines.push(`  总比分: ${goodWins} 成功 / ${evilWins} 失败`);
    lines.push('');

    for (const rh of roundHistory) {
      lines.push(`  ── 第${rh.round}轮 ──`);
      for (let i = 0; i < rh.proposals.length; i++) {
        const prop = rh.proposals[i];
        const leaderName = getPlayerName(prop.leader);
        const teamNames = prop.team.map((id: string) => getPlayerName(id)).join('、');
        const voteStr = prop.vote.approved
          ? `✓ ${prop.vote.approveCount}同意/${prop.vote.rejectCount}拒绝`
          : `✗ ${prop.vote.approveCount}同意/${prop.vote.rejectCount}拒绝`;
        lines.push(`  提名${i + 1}: ${leaderName} → [${teamNames}]`);
        lines.push(`  投票: ${voteStr}`);
      }
      if (rh.questResult) {
        const qr = rh.questResult;
        const resultStr = qr.success ? '✓ 任务成功' : '✗ 任务失败';
        lines.push(`  任务: ${resultStr} (${qr.successCount}成功/${qr.failCount}失败)`);
      }
      lines.push('');
    }
  }

  // Game log
  if (state.log && state.log.length > 0) {
    lines.push('📋 游戏日志');
    for (const entry of state.log) {
      lines.push(`  ${entry.message}`);
    }
    lines.push('');
  }

  // Fun vote result
  if (state.funVoteResult && state.funVoteResult.length > 0) {
    const top = state.funVoteResult[0];
    const topName = getPlayerName(top.playerId);
    lines.push(`🤡 最愚玩家: ${topName} (${top.voteCount}票)`);
  }

  return lines.join('\n');
}

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
