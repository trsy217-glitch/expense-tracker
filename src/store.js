// 알프스 영업비 정산 저장소
// Firebase 모드: Firestore
//   claims/{uid}                 담당자 정보 { label, email, joinedAt }
//   claims/{uid}/items/{id}      지출 1건 { date, month, amount, category, pay, memo, status, hasReceipt, createdAt }
//   claims/{uid}/receipts/{id}   영수증 사진 { img: dataURL(JPEG, 약 190KB 이하) }
//   대표 계정만 모든 담당자 것을 읽고 상태를 바꿀 수 있습니다 → firestore.rules 의 isAdmin()
// 체험 모드(Firebase 값이 없을 때): 이 브라우저 localStorage 에만 저장합니다.
import {
  collection, deleteDoc, doc, getDoc, getFirestore, onSnapshot, orderBy, query, setDoc, updateDoc, limit,
} from 'firebase/firestore'
import { app, isDemoMode } from './firebase.js'
import { ls } from './safeStorage.js'

const db = app ? getFirestore(app) : null
const DEMO = 'alfs_demo_expense'
const now = () => new Date().toISOString()
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// ── 체험 모드 ──
const demoListeners = new Set()
const demoAll = () => ls.get(DEMO, { people: {}, items: {}, receipts: {} })
const demoSave = (s) => { ls.set(DEMO, s); demoListeners.forEach((f) => f()) }

/** 내 정보 문서 구독 → cb({label}|null) */
export function watchMe(uid, cb) {
  if (isDemoMode) { const f = () => cb(demoAll().people[uid] || null); demoListeners.add(f); f(); return () => demoListeners.delete(f) }
  return onSnapshot(doc(db, 'claims', uid), (s) => cb(s.exists() ? s.data() : null), () => cb(null))
}

export async function saveMe(user, label) {
  const body = { label: label || '', email: user.email || '', joinedAt: now() }
  if (isDemoMode) { const s = demoAll(); s.people[user.id] = { ...(s.people[user.id] || {}), ...body }; demoSave(s); return }
  const ref = doc(db, 'claims', user.id)
  const cur = await getDoc(ref)
  if (cur.exists()) await updateDoc(ref, { label: body.label, email: body.email })
  else await setDoc(ref, body)
}

/** 한 사람의 지출 목록 구독 → cb(items[]) */
export function watchItems(uid, cb, onError) {
  if (isDemoMode) {
    const f = () => cb(Object.values(demoAll().items).filter((i) => i.uid === uid))
    demoListeners.add(f); f(); return () => demoListeners.delete(f)
  }
  return onSnapshot(
    query(collection(db, 'claims', uid, 'items'), orderBy('date', 'desc'), limit(1000)),
    (q) => cb(q.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (e) => onError?.(e),
  )
}

/** 대표 전용: 담당자 목록 구독. 권한이 없으면 onDenied() 를 부릅니다. */
export function watchPeople(cb, onDenied) {
  if (isDemoMode) { const f = () => cb(Object.entries(demoAll().people).map(([id, p]) => ({ id, ...p }))); demoListeners.add(f); f(); return () => demoListeners.delete(f) }
  return onSnapshot(
    collection(db, 'claims'),
    (q) => cb(q.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => onDenied?.(),
  )
}

export async function addItem(user, item, img) {
  const id = newId()
  const row = { ...item, uid: user.id, status: 'pending', hasReceipt: !!img, createdAt: now() }
  if (isDemoMode) {
    const s = demoAll()
    s.items[id] = { id, ...row }
    if (img) s.receipts[id] = img
    if (!s.people[user.id]) s.people[user.id] = { label: '', email: user.email || '', joinedAt: now() }
    demoSave(s); return id
  }
  // 담당자 문서가 없으면 먼저 만듭니다 (대표 화면의 사람 목록에 나오도록)
  const meRef = doc(db, 'claims', user.id)
  if (!(await getDoc(meRef)).exists()) await setDoc(meRef, { label: '', email: user.email || '', joinedAt: now() })
  if (img) await setDoc(doc(db, 'claims', user.id, 'receipts', id), { img })
  await setDoc(doc(db, 'claims', user.id, 'items', id), row)
  return id
}

export async function setStatus(it, status) {
  if (isDemoMode) { const s = demoAll(); if (s.items[it.id]) s.items[it.id].status = status; demoSave(s); return }
  await updateDoc(doc(db, 'claims', it.uid, 'items', it.id), { status })
}

export async function removeItem(it) {
  if (isDemoMode) { const s = demoAll(); delete s.items[it.id]; delete s.receipts[it.id]; demoSave(s); return }
  await deleteDoc(doc(db, 'claims', it.uid, 'items', it.id))
  if (it.hasReceipt) await deleteDoc(doc(db, 'claims', it.uid, 'receipts', it.id)).catch(() => {})
}

export async function getReceipt(it) {
  if (isDemoMode) return demoAll().receipts[it.id] || null
  const s = await getDoc(doc(db, 'claims', it.uid, 'receipts', it.id))
  return s.exists() ? s.data().img : null
}

export const expenseDemo = isDemoMode
