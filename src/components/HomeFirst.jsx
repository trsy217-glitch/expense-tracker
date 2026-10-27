import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// 사이트를 새로 열면(PC·모바일 모두) 항상 홈 화면부터 보여 줍니다.
// - 브라우저 탭에서 처음 연 순간에만 홈으로 보내고, 그다음 사이트 안 이동은 그대로 둡니다.
// - 주소 끝에 ?stay 를 붙이면 그 페이지에 그대로 머뭅니다 (예: 홍보용 링크 /video-maker?stay).
// - 로그인 화면(Google 로그인 후 돌아오는 곳)과 영업비 정산(/expense)은 예외입니다.
const KEY = 'alfs_opened'

export default function HomeFirst() {
  const nav = useNavigate()
  const { pathname, search } = useLocation()
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    let first = true
    try { first = !sessionStorage.getItem(KEY); sessionStorage.setItem(KEY, '1') } catch { /* 저장소를 못 쓰는 환경은 매번 처음으로 봄 */ }
    if (first && pathname !== '/' && pathname !== '/login' && !pathname.startsWith('/expense') && !new URLSearchParams(search).has('stay')) nav('/', { replace: true })
    window.scrollTo(0, 0)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
