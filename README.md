# AI 人生重开手帐：GPT 无限剧情版

## 本地运行
```bash
npm install
npm run dev
```

## 接入 GPT
复制 `.env.example` 为 `.env.local` 或在 Vercel 环境变量中添加：

```text
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
```

## Vercel 部署
上传 GitHub → Vercel 导入项目 → Framework 选 Vite → Deploy。

不填 API Key 也能玩，但会使用本地备用剧情；填入 API Key 后，每一岁剧情和自定义行动都会调用 GPT 生成。
