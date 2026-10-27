import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth, inAppBrowser, openInExternalBrowser } from '../lib/auth.jsx'
import { watchMe, saveMe, watchItems, watchPeople, addItem, setStatus, removeItem, getReceipt, expenseDemo } from '../lib/expenseStore.js'
import '../styles/expense.css'

// 알프스 영업비 정산 — /expense (사이트 메뉴에는 없고 주소로만 들어옵니다)
// 담당자: 영수증 사진 → 금액·날짜 자동 채움 → 저장. 대표: 전체 정산에서 승인·반려·지급 완료, CSV 내려받기.

export const CATS = [
  { k: 'parking', n: '주차비' },
  { k: 'transport', n: '유류·교통', hint: '주유·톨게이트·택시·대중교통. 개인 차량은 주유 영수증을 올려 주세요.' },
  { k: 'meal', n: '식대', hint: '영업 중 본인 식사' },
  { k: 'entertain', n: '접대비', hint: '거래처 식사·선물. 누구(어느 매장)와 썼는지 메모에 꼭 적어 주세요. 3만원이 넘으면 카드 영수증이나 세금계산서가 있어야 비용으로 인정됩니다.' },
  { k: 'supplies', n: '물품비', hint: '샘플·체험용품·소모품' },
  { k: 'promo', n: '홍보비', hint: '전단·현수막·POP 인쇄, 광고' },
  { k: 'shipping', n: '택배·퀵' },
  { k: 'event', n: '세미나·행사', hint: '대관료·다과·체험 행사 비용' },
  { k: 'lodging', n: '숙박' },
  { k: 'etc', n: '기타' },
]
const CAT = Object.fromEntries(CATS.map((c) => [c.k, c]))
const CAT_COLOR = ['#1B356A', '#2E6BD1', '#5B9BE8', '#C2652A', '#2F8F6B', '#8B5CF6', '#0E8FA8', '#D4A21A', '#6B7A90', '#A8B4C6']
const ST = { pending: '확인 대기', approved: '승인', rejected: '반려', paid: '지급 완료' }

const won = (n) => (Math.round(n) || 0).toLocaleString('ko-KR')
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) }
const shiftMonth = (m, d) => { const [y, mm] = m.split('-').map(Number); const t = new Date(y, mm - 1 + d, 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}` }
const inMonth = (list, m) => list.filter((i) => i.month === m).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))

function sums(items) {
  const s = { total: 0, pending: 0, approved: 0, paid: 0, toPay: 0 }
  for (const it of items) {
    if (it.status === 'rejected') continue
    s.total += it.amount
    if (it.status === 'pending') s.pending += it.amount
    if (it.status === 'approved') { s.approved += it.amount; if (it.pay !== 'company') s.toPay += it.amount }
    if (it.status === 'paid') s.paid += it.amount
  }
  return s
}

// 사진을 1280px·JPEG 로 줄여 190KB 안팎으로 (Firestore 문서 1건에 들어가는 크기)
async function compress(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
    let max = 1280, q = 0.72, out = ''
    for (let k = 0; k < 6; k++) {
      const sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc)
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height)
      out = c.toDataURL('image/jpeg', q)
      if (out.length < 190000) break
      max = Math.round(max * 0.82); q = Math.max(0.45, q - 0.07)
    }
    return out
  } finally { URL.revokeObjectURL(url) }
}

export default function Expense() {
  const auth = useAuth()
  const user = auth.user
  const [month, setMonth] = useState(today().slice(0, 7))
  const [tab, setTab] = useState('mine')
  const [cat, setCat] = useState('all')
  const [me, setMe] = useState(undefined)
  const [mine, setMine] = useState(null)
  const [people, setPeople] = useState([])
  const [allItems, setAllItems] = useState({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [adding, setAdding] = useState(null) // { img } | {}
  const [viewing, setViewing] = useState(null)
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')
  const [labelDraft, setLabelDraft] = useState('')
  const toastT = useRef(0)
  const say = (m) => { setToast(m); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(''), 2200) }

  // 내 정보·내 내역
  useEffect(() => {
    if (!user) return
    const a = watchMe(user.id, setMe)
    const b = watchItems(user.id, setMine, () => setErr('내역을 불러오지 못했어요. Firestore 규칙이 게시됐는지 확인해 주세요.'))
    return () => { a(); b() }
  }, [user])

  // 대표 판별: 담당자 목록을 읽을 수 있으면 대표
  useEffect(() => {
    if (!user) return
    return watchPeople((list) => { setIsAdmin(true); setPeople(list) }, () => setIsAdmin(false))
  }, [user])

  // 대표: 담당자마다 내역 구독 (사람이 늘 때만 새로 구독)
  const peopleIds = people.map((p) => p.id).sort().join(',')
  useEffect(() => {
    if (!isAdmin || !peopleIds) return
    const offs = peopleIds.split(',').map((id) => watchItems(id, (items) => setAllItems((s) => ({ ...s, [id]: items }))))
    return () => offs.forEach((f) => f())
  }, [isAdmin, peopleIds])

  const labels = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p.label || p.email?.split('@')[0] || '담당자'])), [people])
  const nameOf = (uid) => (uid === user?.id ? (me?.label || user?.name || '나') : labels[uid] || '담당자')

  if (auth.loading) return <div className="xp"><div className="xp-wrap"><p className="xp-note">불러오는 중…</p></div></div>
  if (!user) return <Gate auth={auth} />

  const myMonth = inMonth(mine || [], month)
  const allMonth = inMonth(Object.values(allItems).flat(), month)
  const list = tab === 'all' ? allMonth : myMonth
  const shown = cat === 'all' ? list : list.filter((i) => i.category === cat)
  const [y, m] = month.split('-')
  const needLabel = me !== undefined && !me?.label

  async function bulk(from, to, label) {
    const items = allMonth.filter((i) => i.status === from)
    if (!items.length) return say(`${ST[from]} 건이 없어요`)
    let n = 0
    for (const it of items) { try { await setStatus(it, to); n++ } catch { /* 다음 건 계속 */ } }
    say(`${n}건 ${label}`)
  }

  function downloadCsv() {
    const rows = [...allMonth].reverse()
    if (!rows.length) return say('이 달 내역이 없어요')
    const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`
    const lines = [['날짜', '담당', '항목', '금액', '결제', '메모', '상태', '영수증'].map(esc).join(',')]
    rows.forEach((i) => lines.push([i.date, nameOf(i.uid), (CAT[i.category] || CAT.etc).n, i.amount, i.pay === 'company' ? '회사카드' : '개인 결제', i.memo, ST[i.status], i.hasReceipt ? '있음' : '없음'].map(esc).join(',')))
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `알프스_영업비정산_${month}.csv`
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }

  return (
    <div className="xp">
      <div className="xp-wrap">
        <header className="xp-top">
          <div className="xp-brand">ALFS<small>영업비 정산</small></div>
          <div className="xp-month" aria-label="정산 월">
            <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="이전 달">‹</button>
            <b className="num">{y}.{m}</b>
            <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="다음 달">›</button>
          </div>
        </header>

        {expenseDemo && <p className="xp-demo">체험 모드입니다. 이 브라우저에만 저장돼요. Firebase를 연결하면 담당자들이 함께 씁니다.</p>}
        {err && <p className="xp-err">{err}</p>}

        {isAdmin && (
          <div className="xp-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'mine'} onClick={() => { setTab('mine'); setCat('all') }}>내 정산</button>
            <button role="tab" aria-selected={tab === 'all'} onClick={() => { setTab('all'); setCat('all') }}>전체 정산</button>
          </div>
        )}

        {tab === 'mine' ? (
          <Summary title={`${Number(m)}월 청구 합계`} s={sums(myMonth)} cells={[['확인 대기', 'pending'], ['승인', 'approved'], ['지급 완료', 'paid']]} />
        ) : (
          <Summary title={`${Number(m)}월 전체 청구 (반려 제외)`} s={sums(allMonth)} cells={[['확인 대기', 'pending'], ['지급할 금액', 'toPay'], ['지급 완료', 'paid']]} />
        )}

        {tab === 'mine' && needLabel && (
          <form className="xp-who" onSubmit={async (e) => { e.preventDefault(); const v = labelDraft.trim().slice(0, 12); if (!v) return; try { await saveMe(user, v); say('이름을 저장했어요') } catch { say('저장하지 못했어요') } }}>
            <label htmlFor="xpLabel">이름</label>
            <input id="xpLabel" maxLength={12} value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)} placeholder="정산표에 보일 이름 (예: 김영업)" />
            <button type="submit">저장</button>
          </form>
        )}

        {tab === 'all' && (
          <>
            <div className="xp-bulk">
              <button type="button" className="xp-ghost" onClick={() => bulk('pending', 'approved', '승인했어요')}>대기 건 모두 승인</button>
              <button type="button" className="xp-ghost" onClick={() => bulk('approved', 'paid', '지급 완료로 바꿨어요')}>승인 건 지급 완료</button>
            </div>
            <People items={allMonth} nameOf={nameOf} />
            <button type="button" className="xp-ghost" onClick={downloadCsv}>이번 달 정산표 내려받기 (CSV)</button>
          </>
        )}

        <Filter items={list} cat={cat} setCat={setCat} />

        <div className="xp-list">
          {mine === null ? <div className="xp-empty"><b>정산 기록을 불러오는 중이에요</b></div>
            : !shown.length ? (
              tab === 'mine'
                ? <div className="xp-empty"><b>이 달에 올린 영수증이 없어요</b>아래 버튼으로 영수증을 찍거나 캡처한 사진을 올리면 금액과 날짜를 읽어 채워 드려요.</div>
                : <div className="xp-empty"><b>이 달 청구가 아직 없어요</b>영업 담당자가 영수증을 올리면 여기에 모여요.</div>
            ) : shown.map((it) => <Row key={it.uid + it.id} it={it} who={tab === 'all' ? nameOf(it.uid) : ''} onOpen={() => setViewing(it)} />)}
        </div>
        {tab === 'all' && <p className="xp-note">회사카드로 결제한 건은 기록용이라 지급할 금액에서 빠집니다.</p>}

        <p className="xp-note xp-foot">
          {user.email} · <button type="button" className="xp-link" onClick={auth.signOut}>로그아웃</button>
        </p>
      </div>

      {tab === 'mine' && (
        <div className="xp-dock">
          <label htmlFor="xpFile">영수증 사진 올리기
            <input type="file" id="xpFile" accept="image/*" onChange={async (e) => {
              const f = e.target.files?.[0]; e.target.value = ''
              if (!f) return
              try { setAdding({ img: await compress(f) }) } catch { say('사진을 열 수 없어요. 다른 사진으로 올려 주세요.') }
            }} />
          </label>
          <span className="xp-alt">사진이 없나요? <button type="button" onClick={() => setAdding({})}>영수증 없이 입력</button></span>
        </div>
      )}

      {adding && <AddSheet user={user} img={adding.img} onClose={() => setAdding(null)} onSaved={(d) => { setAdding(null); setMonth(d.slice(0, 7)); say('저장했어요') }} />}
      {viewing && <ViewSheet it={viewing} isAdmin={isAdmin} mineId={user.id} nameOf={nameOf} onClose={() => setViewing(null)} say={say} />}
      {toast && <div className="xp-toast" role="status">{toast}</div>}
    </div>
  )
}

function Gate({ auth }) {
  const inApp = inAppBrowser()
  const [msg, setMsg] = useState(auth.error || '')
  return (
    <div className="xp">
      <div className="xp-wrap xp-gate">
        <div className="xp-brand">ALFS<small>영업비 정산</small></div>
        <h1>영수증을 찍어 올리면<br />정산이 끝납니다</h1>
        <p className="xp-note">알프스 영업 담당자 전용입니다. 회사에서 안내받은 Google 계정으로 로그인해 주세요.</p>
        {inApp ? (
          <div className="xp-inapp">
            <p>{inApp === 'kakao' ? '카카오톡' : '앱'} 안의 브라우저에서는 Google 로그인이 막혀 있어요. 크롬·사파리에서 열어 주세요.</p>
            {inApp === 'kakao' && <button type="button" className="xp-primary" onClick={openInExternalBrowser}>기본 브라우저로 열기</button>}
          </div>
        ) : (
          <button type="button" className="xp-primary" onClick={async () => { setMsg(''); const r = await auth.signInWithGoogle(); if (r.error) setMsg(r.error) }}>
            {auth.demo ? '체험 모드로 시작하기' : 'Google 계정으로 로그인'}
          </button>
        )}
        {msg && <p className="xp-err">{msg}</p>}
        <p className="xp-note">휴대폰에서 이 화면을 '홈 화면에 추가'하면 앱처럼 바로 열 수 있어요.</p>
      </div>
    </div>
  )
}

function Summary({ title, s, cells }) {
  return (
    <div className="xp-sum">
      <div className="xp-sum-l">{title}</div>
      <div className="xp-sum-t num">{won(s.total)}<small>원</small></div>
      <div className="xp-sum-split">{cells.map(([n, k]) => <div key={k}>{n}<b className="num">{won(s[k])}</b></div>)}</div>
    </div>
  )
}

function Filter({ items, cat, setCat }) {
  if (!items.length) return null
  const tot = {}; let all = 0
  items.forEach((i) => { if (i.status === 'rejected') return; tot[i.category] = (tot[i.category] || 0) + i.amount; all += i.amount })
  const chips = [['all', '전체', all], ...CATS.filter((c) => items.some((i) => i.category === c.k)).map((c) => [c.k, c.n, tot[c.k] || 0])]
  return (
    <div className="xp-filter" aria-label="항목으로 보기">
      {chips.map(([k, n, v]) => <button type="button" key={k} aria-pressed={cat === k} onClick={() => setCat(k)}>{n}<small>{won(v)}</small></button>)}
    </div>
  )
}

function People({ items, nameOf }) {
  const by = {}
  items.forEach((i) => (by[i.uid] ||= []).push(i))
  const ids = Object.keys(by)
  const catTot = {}
  items.filter((i) => i.status !== 'rejected').forEach((i) => (catTot[i.category] = (catTot[i.category] || 0) + i.amount))
  return (
    <>
      <h3 className="xp-sec">사람별</h3>
      <div className="xp-people">
        {!ids.length && <div className="xp-empty">이 달 청구가 아직 없어요.</div>}
        {ids.map((uid) => {
          const s = sums(by[uid])
          const bc = {}; by[uid].filter((i) => i.status !== 'rejected').forEach((i) => (bc[i.category] = (bc[i.category] || 0) + i.amount))
          return (
            <div className="xp-person" key={uid}>
              <div className="xp-person-h"><b>{nameOf(uid)}</b><span className="num">{won(s.total)}원</span></div>
              <div className="xp-bar">{CATS.map((c, ix) => bc[c.k] ? <i key={c.k} title={c.n} style={{ width: `${(bc[c.k] / s.total) * 100}%`, background: CAT_COLOR[ix] }} /> : null)}</div>
              <div className="xp-note">{by[uid].length}건 · 대기 {won(s.pending)}원 · 지급할 금액 {won(s.toPay)}원 · 지급 완료 {won(s.paid)}원</div>
            </div>
          )
        })}
      </div>
      {Object.keys(catTot).length > 0 && (
        <>
          <h3 className="xp-sec">항목별</h3>
          <div className="xp-bycat">{CATS.filter((c) => catTot[c.k]).map((c) => <div key={c.k}><span>{c.n}</span><b className="num">{won(catTot[c.k])}원</b></div>)}</div>
        </>
      )}
    </>
  )
}

function Row({ it, who, onOpen }) {
  const c = CAT[it.category] || CAT.etc
  return (
    <button type="button" className="xp-item" onClick={onOpen}>
      <span className="xp-thumb">{c.n.slice(0, 2)}</span>
      <span className="xp-mid">
        <span className="xp-t">{c.n}{it.pay === 'company' && <span className="xp-co">회사카드</span>}</span>
        <span className="xp-s">{who && `${who} · `}{it.date.slice(5).replace('-', '.')}{it.memo && ` · ${it.memo}`}{!it.hasReceipt && ' · 영수증 없음'}</span>
      </span>
      <span className="xp-r"><span className="xp-amt num">{won(it.amount)}원</span><span className={`xp-pill st-${it.status}`}>{ST[it.status] || it.status}</span></span>
    </button>
  )
}

function AddSheet({ user, img, onClose, onSaved }) {
  const [amt, setAmt] = useState('')
  const [category, setCategory] = useState(null)
  const [date, setDate] = useState(today())
  const [pay, setPay] = useState('personal')
  const [memo, setMemo] = useState('')
  const [read, setRead] = useState(img ? '영수증 읽는 중…' : '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const touched = useRef({})
  const amtRef = useRef(null)

  useEffect(() => {
    if (!img) { amtRef.current?.focus(); return }
    let alive = true
    fetch('/api/read-receipt', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image: img }) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((r) => {
        if (!alive) return
        const filled = []
        if (r.amount && !touched.current.amt) { setAmt(r.amount.toLocaleString('ko-KR')); filled.push('금액') }
        if (r.date && r.date <= today() && !touched.current.date) { setDate(r.date); filled.push('날짜') }
        if (r.store && !touched.current.memo) setMemo(r.store)
        if (r.category && !touched.current.cat) { setCategory(r.category); filled.push('항목') }
        setRead(filled.length ? `${filled.join('·')}을 채웠어요. 확인해 주세요` : '직접 입력해 주세요')
      })
      .catch(() => alive && setRead('직접 입력해 주세요'))
    return () => { alive = false }
  }, [img])

  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])

  const hint = category && CAT[category].hint
  async function submit(e) {
    e.preventDefault()
    const amount = Number(amt.replace(/[^\d]/g, ''))
    if (!amount) return setErr('금액을 적어 주세요.')
    if (!category) return setErr('항목을 골라 주세요.')
    if (category === 'entertain' && !memo.trim()) return setErr('접대비는 누구와 썼는지 적어 주세요.')
    setBusy(true); setErr('')
    try {
      await addItem(user, { date, month: date.slice(0, 7), amount, category, pay, memo: memo.trim().slice(0, 60) }, img || null)
      onSaved(date)
    } catch {
      setErr('저장하지 못했어요. 네트워크를 확인하고 다시 눌러 주세요.')
    } finally { setBusy(false) }
  }

  return (
    <div className="xp-sheet" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="xp-panel" onSubmit={submit} noValidate>
        <h2>지출 입력 <button type="button" onClick={onClose} aria-label="닫기">×</button></h2>
        {img && <div className="xp-receipt"><img src={img} alt="영수증 미리보기" />{read && <span className="xp-read">{read}</span>}</div>}
        <label className="xp-field"><span>금액</span>
          <div className="xp-amount"><input ref={amtRef} className="num" inputMode="numeric" autoComplete="off" placeholder="0" value={amt}
            onChange={(e) => { touched.current.amt = 1; const v = e.target.value.replace(/[^\d]/g, ''); setAmt(v ? Number(v).toLocaleString('ko-KR') : '') }} /><b>원</b></div>
        </label>
        <div className="xp-field"><span>항목</span>
          <div className="xp-cats">{CATS.map((c) => <button type="button" key={c.k} aria-pressed={category === c.k} onClick={() => { touched.current.cat = 1; setCategory(c.k) }}>{c.n}</button>)}</div>
        </div>
        {hint && <p className="xp-hint">{hint}</p>}
        <div className="xp-row2">
          <label className="xp-field"><span>날짜</span><input type="date" className="xp-inp" value={date} max={today()} onChange={(e) => { touched.current.date = 1; setDate(e.target.value || today()) }} /></label>
          <div className="xp-field"><span>결제</span>
            <div className="xp-seg">{[['personal', '내 돈'], ['company', '회사카드']].map(([v, n]) => <button type="button" key={v} aria-pressed={pay === v} onClick={() => setPay(v)}>{n}</button>)}</div>
          </div>
        </div>
        <label className="xp-field"><span>{category === 'entertain' ? '누구와 (거래처·매장 이름)' : '메모 (거래처·장소)'}</span>
          <input className="xp-inp" maxLength={60} value={memo} onChange={(e) => { touched.current.memo = 1; setMemo(e.target.value) }} placeholder="예: 보은 ○○헬스 방문" />
        </label>
        {err && <p className="xp-err">{err}</p>}
        <button className="xp-primary" type="submit" disabled={busy}>{busy ? '저장하는 중…' : '저장'}</button>
      </form>
    </div>
  )
}

function ViewSheet({ it, isAdmin, mineId, nameOf, onClose, say }) {
  const [img, setImg] = useState(it.hasReceipt ? 'loading' : null)
  const [sure, setSure] = useState(false)
  const c = CAT[it.category] || CAT.etc
  useEffect(() => { if (it.hasReceipt) getReceipt(it).then((v) => setImg(v || 'missing')).catch(() => setImg('missing')) }, [it])
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  const act = async (fn, msg) => { try { await fn(); say(msg); onClose() } catch { say('처리하지 못했어요') } }
  return (
    <div className="xp-sheet" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="xp-panel">
        <h2>{c.n} {won(it.amount)}원 <button type="button" onClick={onClose} aria-label="닫기">×</button></h2>
        <div className="xp-receipt xp-receipt--big">
          {img === null ? '영수증 없이 입력한 건이에요' : img === 'loading' ? '영수증 불러오는 중…' : img === 'missing' ? '영수증을 불러오지 못했어요' : <img src={img} alt="영수증" />}
        </div>
        <dl className="xp-kv">
          {it.uid !== mineId && <><dt>담당</dt><dd>{nameOf(it.uid)}</dd></>}
          <dt>날짜</dt><dd>{it.date.replaceAll('-', '.')}</dd>
          <dt>결제</dt><dd>{it.pay === 'company' ? '회사카드 (지급 대상 아님)' : '내 돈 (지급 대상)'}</dd>
          <dt>메모</dt><dd>{it.memo || '—'}</dd>
          <dt>상태</dt><dd>{ST[it.status]}</dd>
        </dl>
        {isAdmin && (
          <div className="xp-actions">
            {[['approved', '승인'], ['rejected', '반려'], ['paid', '지급 완료']].map(([v, n]) => (
              <button type="button" key={v} className="xp-ghost" disabled={it.status === v} onClick={() => act(() => setStatus(it, v), `${n} 처리했어요`)}>{n}</button>
            ))}
          </div>
        )}
        {it.uid === mineId && it.status === 'pending' && (
          <button type="button" className="xp-ghost xp-danger" onClick={() => (sure ? act(() => removeItem(it), '삭제했어요') : setSure(true))}>
            {sure ? '한 번 더 누르면 삭제돼요' : '이 건 삭제'}
          </button>
        )}
      </div>
    </div>
  )
}
