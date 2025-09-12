import { Link, Outlet, useLocation } from 'react-router-dom'

export default function App() {
  const { pathname } = useLocation()
  return (
    <div className="max-w-3xl mx-auto p-6">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:text-slate-900 focus:px-3 focus:py-2 focus:rounded focus:shadow">
        Skip to content
      </a>
      <header className="flex items-center justify-between mb-6">
        <Link to="/" className="brand-snackie font-black text-2xl">Snackie</Link>
        <nav className="text-sm space-x-4">
          <Link className={navClass(pathname === '/')} to="/">Home</Link>
          <Link className={navClass(pathname.startsWith('/quiz'))} to="/quiz">Quiz</Link>
        </nav>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="mt-12 text-xs text-slate-500 space-y-1">
        <p>© {new Date().getFullYear()} Snackie</p>
        <p>
          Images courtesy of{' '}
          <a className="underline" href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">Wikimedia Commons</a>
          {' '}and{' '}
          <a className="underline" href="https://openfoodfacts.org/" target="_blank" rel="noreferrer">Open Food Facts</a>.
          {' '}Licenses and credits belong to their respective authors.
        </p>
      </footer>
    </div>
  )
}

function navClass(active: boolean) {
  return `px-2 py-1 rounded ${active ? 'bg-yellow-400 text-slate-900' : 'text-slate-700 hover:text-slate-900'}`
}
