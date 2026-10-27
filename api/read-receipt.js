// Vercel 서버리스 함수: POST /api/read-receipt
// 영업비 정산 화면에서 올린 영수증 사진(작게 줄인 JPEG)을 Claude에게 보내 금액·날짜·가게·항목을 읽습니다.
// 필요한 환경 변수: ANTHROPIC_API_KEY (없으면 501 → 화면에서 직접 입력)
//                   ANTHROPIC_MODEL (선택, 기본 claude-haiku-5-5)
const CATS = ['parking', 'transport', 'meal', 'entertain', 'supplies', 'promo', 'shipping', 'event', 'lodging', 'etc']
const hits = new Map()
const LIMIT = 60, WINDOW = 60 * 60 * 1000

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'POST만 받습니다.' }) }
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(501).json({ error: '영수증 자동 읽기가 아직 연결되지 않았습니다.' })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  const t = Date.now()
  const list = (hits.get(ip) || []).filter((x) => t - x < WINDOW)
  if (list.length >= LIMIT) return res.status(429).json({ error: '잠시 후 다시 시도해 주세요.' })
  list.push(t); hits.set(ip, list)

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body || {}
  const m = String(body.image || '').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/)
  if (!m) return res.status(400).json({ error: '영수증 사진이 필요합니다.' })
  if (m[2].length > 3_000_000) return res.status(413).json({ error: '사진이 너무 큽니다.' })

  const prompt = `이 사진은 한국 영수증(카드전표, 주차 영수증, 결제 캡처 화면 등)입니다. 아래 JSON 하나만 답하세요. 설명은 쓰지 마세요.
{"amount": 결제 총액(숫자, 원 단위, 모르면 null), "date": "YYYY-MM-DD" 또는 null, "store": 가게·장소 이름 또는 null, "category": ${CATS.map((c) => `"${c}"`).join(' | ')} | null}
항목 기준: 주차장 parking, 주유소·톨게이트·택시·대중교통 transport, 본인 식사 meal, 거래처 식사·선물 entertain, 샘플·소모품 supplies, 인쇄·현수막·광고 promo, 택배·퀵 shipping, 대관·행사 event, 숙박 lodging.`

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
          { type: 'text', text: prompt },
        ] }],
      }),
    })
    if (!r.ok) { console.error('anthropic', r.status, (await r.text()).slice(0, 300)); return res.status(502).json({ error: 'AI 응답을 받지 못했습니다.' }) }
    const data = await r.json()
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('')
    const j = safeJson(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) || {}
    const amount = Math.round(Number(String(j.amount ?? '').replace(/[^\d.]/g, '')))
    return res.status(200).json({
      amount: amount > 0 && amount < 100_000_000 ? amount : null,
      date: /^\d{4}-\d{2}-\d{2}$/.test(j.date || '') ? j.date : null,
      store: j.store ? String(j.store).slice(0, 60) : null,
      category: CATS.includes(j.category) ? j.category : null,
    })
  } catch (err) {
    console.error(err)
    return res.status(502).json({ error: 'AI 연결에 실패했습니다.' })
  }
}

function safeJson(s) { try { return JSON.parse(s) } catch { return null } }
