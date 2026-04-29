import OpenAI from "openai";

function fallback(state, action) {
  return {
    result: `你选择了“${action}”。命运接受了这个不按常理的行动，它带来了一点声望，也让压力略微上升。`,
    effects: { rep: 1, stress: 1 }
  };
}

function parseJson(text) {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });
  const { state, action } = req.body || {};
  if (!process.env.OPENAI_API_KEY) return res.status(200).json(fallback(state || {}, action || "自定义选择"));

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: `你是人生模拟游戏裁判。根据当前状态和玩家自定义行动，判断合理后果。返回严格JSON：{"result":"60-120字中文结果","effects":{"money":数字,"hp":数字,"rep":数字,"stress":数字,"force":数字,"iq":数字,"charm":数字,"family":数字}}。状态：${JSON.stringify(state)}。玩家行动：${action}`
    });
    const data = parseJson(response.output_text || "") || fallback(state || {}, action || "自定义选择");
    return res.status(200).json(data);
  } catch {
    return res.status(200).json(fallback(state || {}, action || "自定义选择"));
  }
}
