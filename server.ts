import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHmac, timingSafeEqual } from 'node:crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CRM_SESSION_COOKIE = 'satori_crm_session';

function cookieValue(raw: string | undefined, name: string) {
  if (!raw) return '';
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function sessionSecret() {
  return String(process.env.CRM_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '');
}

function validCrmSession(token: string) {
  if (!token) return false;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const secret = sessionSecret();
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    return [1, 2].includes(Number(data?.v)) && Number(data?.iat) <= now + 60 && Number(data?.exp) > now;
  } catch {
    return false;
  }
}

function safeNext(value: unknown) {
  const next = String(value || '/');
  return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}

function loginPage(next: string) {
  const target = escapeHtml(next);
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SATORI CRM · Вход</title>
<style>html,body{height:100%;margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f6f5f2;color:#171717}.wrap{min-height:100%;display:grid;place-items:center;padding:24px}.card{width:min(380px,100%);background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:20px;padding:28px;box-shadow:0 24px 70px rgba(0,0,0,.08)}.brand{font-size:13px;letter-spacing:.18em;font-weight:800;margin-bottom:28px}.muted{font-size:13px;color:#737373;margin:6px 0 22px}.title{font-size:26px;font-weight:750;letter-spacing:-.03em}.field{width:100%;box-sizing:border-box;border:1px solid #d8d8d8;border-radius:12px;padding:12px 14px;font-size:15px;outline:none}.field:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1)}.button{width:100%;margin-top:12px;border:0;border-radius:12px;padding:12px 14px;background:#2563eb;color:#fff;font-size:14px;font-weight:700;cursor:pointer}.button:hover{background:#1d4ed8}</style></head>
<body><div class="wrap"><form class="card" action="/api/auth/login" method="post"><div class="brand">SATORI CRM</div><div class="title">Вход</div><div class="muted">Рабочая CRM Satori Studio</div><input type="hidden" name="next" value="${target}"><input class="field" type="password" name="password" placeholder="Пароль" autocomplete="current-password" autofocus required><button class="button" type="submit">Войти</button></form></div></body></html>`;
}

function getHeuristicAction(client: any, messages: any[] = [], deals: any[] = [], tasks: any[] = []) {
  // Check the last incoming message
  const lastInbound = [...messages].reverse().find(m => m.direction === 'inbound');
  const activeDeal = deals?.[0];

  if (lastInbound) {
    const text = lastInbound.content.toLowerCase();
    if (text.includes('счет') || text.includes('оплат') || text.includes('акт')) {
      return {
        title: `Выставить счет и акт сверки: ${client.name}`,
        type: 'invoice',
        priority: 'urgent',
        reasoning: `Клиент запросил финансовые документы в сообщении («${lastInbound.content.slice(0, 70)}...»).`,
        deadline: '2026-09-25',
        suggestedMessage: `${client.name.split(' ')[0] || 'Здравствуйте'}, добрый день! Подготовили счет и акт сверки по вашему проекту. Документы во вложении, оригинал передадим с доставкой.`,
        sentiment: 'positive',
        confidence: 96,
      };
    }
    if (text.includes('кп') || text.includes('расчет') || text.includes('цен') || text.includes('стоимост')) {
      return {
        title: `Согласовать КП и спецификацию: ${activeDeal?.title || client.name}`,
        type: 'proposal',
        priority: 'high',
        reasoning: `Клиент ожидает расчет и коммерческое предложение по материалам.`,
        deadline: '2026-09-25',
        suggestedMessage: `${client.name.split(' ')[0] || 'Здравствуйте'}, добрый день! Расчет и спецификация по проекту готовы. Учли все пожелания по отделке. Давайте согласуем детали?`,
        sentiment: 'neutral',
        confidence: 92,
      };
    }
    if (text.includes('встреч') || text.includes('замер') || text.includes('образц')) {
      return {
        title: `Встреча в шоуруме / выезд на замер: ${client.name}`,
        type: 'meeting',
        priority: 'high',
        reasoning: `Клиент проявил интерес к подбору образцов отделки или согласованию узлов на объекте.`,
        deadline: '2026-09-26',
        suggestedMessage: `${client.name.split(' ')[0] || 'Здравствуйте'}! Будем рады встретиться в нашем шоуруме, чтобы вживую оценить выкрасы и образцы латуни и шпона. В какое время вам удобно?`,
        sentiment: 'positive',
        confidence: 90,
      };
    }
  }

  if (activeDeal) {
    return {
      title: `Контроль следующего шага: «${activeDeal.title}»`,
      type: 'task',
      priority: 'high',
      reasoning: `Сделка находится на этапе «${activeDeal.stage}». Рекомендуется актуализировать график с клиентом.`,
      deadline: '2026-09-25',
      suggestedMessage: `${client.name.split(' ')[0] || 'Здравствуйте'}! Напоминаем по проекту «${activeDeal.title}» — все работы идут по графику, готовы ответить на вопросы.`,
      sentiment: 'positive',
      confidence: 88,
    };
  }

  return {
    title: `Запланировать плановый звонок: ${client.name}`,
    type: 'call',
    priority: 'medium',
    reasoning: `Плановый контакт для поддержания отношений и сбора обратной связи по новым объектам.`,
    deadline: '2026-09-26',
    suggestedMessage: `${client.name.split(' ')[0] || 'Здравствуйте'}! Хотели уточнить, появились ли новые проекты в работе у вашей команды? Готовы оперативно взять в расчет.`,
    sentiment: 'neutral',
    confidence: 85,
  };
}

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '10mb' }));
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'satori-crm-ui' }));
  app.get('/login', (req, res) => {
    const token = cookieValue(req.headers.cookie, CRM_SESSION_COOKIE);
    const next = safeNext(req.query.next);
    if (validCrmSession(token)) return res.redirect(303, next);
    res.status(200).type('html').send(loginPage(next));
  });

  // The new UI reuses the signed session cookie issued by the existing CRM backend.
  // This keeps the browser-facing CRM private while /api/auth/login remains on port 3020.
  app.use((req, res, next) => {
    if (req.path === '/health' || req.path === '/login') return next();
    const token = cookieValue(req.headers.cookie, CRM_SESSION_COOKIE);
    if (validCrmSession(token)) return next();
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Сессия истекла. Войдите снова.' });
    return res.redirect(303, `/login?next=${encodeURIComponent(safeNext(req.originalUrl))}`);
  });

  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // API endpoint for AI-powered Next Best Action
  app.post('/api/next-best-action', async (req, res) => {
    try {
      const { client, messages = [], deals = [], tasks = [] } = req.body;

      if (!client) {
        return res.status(400).json({ error: 'Client data is required' });
      }

      if (!ai) {
        // Fallback to heuristic recommendation when API key is not yet set
        const action = getHeuristicAction(client, messages, deals, tasks);
        return res.json({
          success: true,
          isAiGenerated: false,
          action,
        });
      }

      const prompt = `Ты — ведущий AI-аналитик в CRM-системе мебельного и светового премиального производства SATORI.
Твоя задача: проанализировать историю переписки, карточку заказчика и текущие сделки, чтобы сгенерировать точнейшее "Следующее лучшее действие" (Next Best Action) для менеджера проекта.

Профиль клиента:
- Имя: ${client.name}
- Компания: ${client.company || 'Частный заказчик'}
- Статус: ${client.status}
- Ответственный менеджер: ${client.assignedManager}
- Сделки в работе: ${JSON.stringify(deals.map((d: any) => ({ title: d.title, stage: d.stage, amount: d.amount, deadline: d.deadline })))}
- Текущие задачи: ${JSON.stringify(tasks.map((t: any) => ({ title: t.title, deadline: t.deadline, completed: t.completed })))}

История переписки (от старых к новым):
${messages.map((m: any) => `[${m.channel}] ${m.direction === 'inbound' ? client.name : m.senderName}: ${m.content}`).join('\n') || 'Сообщений пока нет'}

Сформируй практичную, конкретную рекомендацию в формате JSON:
- title: краткое название задачи или встречи (до 60 символов)
- type: 'task' | 'meeting' | 'call' | 'proposal' | 'invoice' | 'payment_reminder'
- priority: 'urgent' | 'high' | 'medium'
- reasoning: четкое обоснование из 1-2 предложений со ссылкой на детали переписки, почему это действие ключевое прямо сейчас
- deadline: рекомендуемый срок (YYYY-MM-DD, ориентируйся на дату 2026-09-25)
- suggestedMessage: профессиональный, готовый к отправке текст ответа заказчику от лица менеджера
- sentiment: эмоциональный фон клиента ('positive' | 'neutral' | 'attention_needed')
- confidence: число от 85 до 99 (уверенность алгоритма)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              type: { type: Type.STRING },
              priority: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              deadline: { type: Type.STRING },
              suggestedMessage: { type: Type.STRING },
              sentiment: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
            },
            required: ['title', 'type', 'priority', 'reasoning', 'deadline', 'suggestedMessage', 'sentiment', 'confidence'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        isAiGenerated: true,
        action: parsed,
      });
    } catch (err: any) {
      console.error('Error generating Next Best Action:', err);
      const fallback = getHeuristicAction(req.body.client, req.body.messages, req.body.deals, req.body.tasks);
      return res.json({
        success: true,
        isAiGenerated: false,
        action: fallback,
      });
    }
  });

  // Mount Vite or static dist
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Satori CRM Server running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
