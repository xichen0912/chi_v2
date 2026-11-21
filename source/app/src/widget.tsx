/**
 * Ask CHI for the static pages (Map, People, Awards, Accessibility, My).
 * Same component as in Program; references open the matching page of the site.
 */
import { createRoot } from 'react-dom/client'
import { Chatbot } from './components/Chatbot'
import { useInterests } from './lib/store'
import type { Route } from './lib/route'
import css from './askchi.css?inline'

function href(route: Route): string {
  switch (route.view) {
    case 'session': return `../program/?session=${encodeURIComponent(route.id)}`
    case 'map': return `../map/${route.room ? `?room=${encodeURIComponent(route.room)}` : ''}`
    case 'people': return `../people/${route.person ? `?person=${encodeURIComponent(route.person)}` : ''}`
    case 'my': return '../my/'
    case 'start': return '../program/?view=start'
    default: return '../program/'
  }
}

function Widget() {
  const interests = useInterests()
  return <Chatbot interests={interests} onGo={(route) => { window.location.href = href(route) }} />
}

const style = document.createElement('style')
style.textContent = css
document.head.appendChild(style)
const host = document.createElement('div')
host.id = 'ask-chi-root'
document.body.appendChild(host)
createRoot(host).render(<Widget />)
