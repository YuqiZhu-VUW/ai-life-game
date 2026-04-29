import OpenAI from "openai";

function fallback(state) {
  const w = state.world?.name || "未知世界";
  const age = state.age || 0;
  const talent = (state.talents || []).map(t => t.n || t).join("、") || "无";
  const templates = {
    modern: "城市的早晨像一台不停转动的机器。你在人群里醒来，忽然发现一个小决定会改变接下来几年。",
    xianxia: "山门钟声震开云海，灵气在你经脉里游走。长老望向你，像是看见了一枚尚未落子的棋。",
    cyber: "霓虹雨落在义体外壳上，街区广播循环播放公司禁令。你收到一条加密委托。",
    three: "乱世的风吹过营帐，远处战鼓未停。有人递来密信，要你立刻表态。",
    space: "舰窗外群星沉默，警报灯一闪一闪。一次航道偏移让你接近未知信号。",
    academy: "奥术塔的楼梯自己改变方向，教授点名让你展示天赋。",
    abyss: "潮湿的低语从梦里钻出，你意识到深渊正在回应你的名字。",
    more: "命运撕开一条岔路，世界规则在你眼前重新洗牌。"
  };
  return {
    story: `${age}岁，${templates[state.world?.id] || templates.more}（世界：${w}；天赋：${talent}）`,
    choices: [
      { text: "谨慎观察", desc: "保守处理，优先降低风险。", effects: { money: 20, hp: 1, stress: -1 } },
      { text: "主动出击", desc: "承担风险，争取更高回报。", effects: { money: 120, rep: 1, stress: 1 } },
      { text: "寻求帮助", desc: "利用人脉或魅力解决问题。", effects: { rep: 2, charm: 1, money: -30 } }
    ]
  };
}

function parseJson(text) {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {}
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });
  const state = req.body || {};
  if (!process.env.OPENAI_API_KEY) return res.status(200).json(fallback(state));

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `
你是“AI人生重开手帐”的剧情引擎。请根据玩家当前状态，生成下一岁剧情。
必须强烈贴合“大世界设定”，并让“种族、性别、天赋、属性、金钱、生命、声望、压力、历史选择”影响剧情。
不要写成模板。每次剧情要具体、有画面、有因果。
返回严格 JSON：
{
  "story": "120-220字中文剧情，包含年龄和具体事件",
  "choices": [
    {"text":"选项标题", "desc":"一句话说明", "effects":{"money":数字,"hp":数字,"rep":数字,"stress":数字,"force":数字,"iq":数字,"charm":数字,"family":数字}},
    {"text":"选项标题", "desc":"一句话说明", "effects":{...}},
    {"text":"选项标题", "desc":"一句话说明", "effects":{...}}
  ]
}
effects 数值范围一般 -3 到 +3，money 可在 -500 到 +800。必须给 3 个选项。
玩家状态：
${JSON.stringify(state, null, 2)}
`;
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt
    });
    const text = response.output_text || "";
    const data = parseJson(text) || fallback(state);
    if (!Array.isArray(data.choices) || data.choices.length < 3) return res.status(200).json(fallback(state));
    return res.status(200).json(data);
  } catch (e) {
    return res.status(200).json(fallback(state));
  }
}
