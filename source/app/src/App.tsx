import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { conferenceDays, getSessionById } from './data/sessions'
import { InterestSelector } from './components/InterestSelector'
import { LayoutSwitch } from './components/LayoutSwitch'
import { ProgramPage } from './components/ProgramPage'
import { SessionDetail } from './components/SessionDetail'
import { StartPage } from './components/StartPage'
import { Chatbot } from './components/Chatbot'
import { LayoutContext, loadLayout, saveLayout, type Layout } from './lib/layout'
import { externalHref, parseRoute, routeToSearch, type Route } from './lib/route'
import { setInterests, useInterests } from './lib/store'

function App() {
  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    try {
      const saved = window.sessionStorage.getItem('chi-program-day')
      if (saved && conferenceDays.some((day) => day.id === saved)) return saved
    } catch { /* ignore */ }
    return conferenceDays[0].id
  })
  const setSelectedDate = (date: string) => {
    setSelectedDateState(date)
    try { window.sessionStorage.setItem('chi-program-day', date) } catch { /* ignore */ }
  }
  const interests = useInterests()
  const [topic, setTopic] = useState<string | null>(null)
  const [showInterests, setShowInterests] = useState(false)
  const [layout, setLayout] = useState<Layout>(loadLayout)
  const home: Route = layout === 'day' ? { view: 'start' } : { view: 'program' }
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.search, loadLayout() === 'day' ? { view: 'start' } : { view: 'program' }))
  // Session pages stay mounted once opened (just hidden), so coming back finds them exactly as left.
  const [visited, setVisited] = useState<string[]>(() => (route.view === 'session' ? [route.id] : []))
  const pendingScroll = useRef<number>(window.history.state?.scroll ?? 0)
  const homeRef = useRef<Route>(home)
  homeRef.current = home

  useLayoutEffect(() => {
    window.scrollTo({ top: pendingScroll.current, behavior: 'instant' })
  }, [route])

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const next = parseRoute(window.location.search, homeRef.current)
      pendingScroll.current = event.state?.scroll ?? 0
      if (next.view === 'session') setVisited((list) => (list.includes(next.id) ? list : [...list, next.id]))
      setRoute(next)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Every section links to every other one through this single function.
  const go = (next: Route) => {
    const href = externalHref(next)
    if (href) {
      window.history.replaceState({ ...window.history.state, scroll: window.scrollY }, '')
      window.location.href = href
      return
    }
    const here = { nav: true, scroll: window.scrollY }
    pendingScroll.current = 0
    if (next.view === 'session') setVisited((list) => (list.includes(next.id) ? list : [...list, next.id]))
    window.history.replaceState({ ...window.history.state, scroll: here.scroll }, '')
    window.history.pushState({ nav: true }, '', routeToSearch(next))
    setRoute(next)
  }

  const back = () => {
    if (window.history.state?.nav) {
      window.history.back()
    } else {
      pendingScroll.current = 0
      setRoute(home)
      window.history.replaceState(null, '', routeToSearch(home))
    }
  }

  const toggleTopic = (keyword: string) => setTopic((current) => (current === keyword.toLowerCase() ? null : keyword.toLowerCase()))
  const changeLayout = (next: Layout) => {
    if (next === layout) return
    saveLayout(next)
    setLayout(next)
    go(next === 'day' ? { view: 'start' } : { view: 'program' })
  }
  const sessionRoute = route.view === 'session' ? route : null

  return (
    <LayoutContext.Provider value={layout}>
      <div hidden={route.view !== 'program' && !(sessionRoute && !getSessionById(sessionRoute.id) && layout === 'classic')}>
        <ProgramPage
          selectedDate={selectedDate}
          onSelectDate={(date) => { setSelectedDate(date); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          interests={interests}
          onOpenInterests={() => setShowInterests(true)}
          onGo={go}
          topic={topic}
          onTopic={toggleTopic}
        />
      </div>
      {visited.map((id) => {
        const session = getSessionById(id)
        if (!session) return null
        return (
          <div key={id} hidden={sessionRoute?.id !== id}>
            <SessionDetail session={session} onBack={back} onGo={go} topic={topic} onTopic={toggleTopic} />
          </div>
        )
      })}
      {route.view === 'start' && (
        <StartPage
          interests={interests}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onOpenInterests={() => setShowInterests(true)}
          onGo={go}
        />
      )}
      {showInterests && (
        <InterestSelector selected={interests} onChange={setInterests} onClose={() => setShowInterests(false)} />
      )}
      <Chatbot interests={interests} onGo={go} />
      <LayoutSwitch layout={layout} onChange={changeLayout} />
    </LayoutContext.Provider>
  )
}

export default App
