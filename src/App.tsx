import { Link, Outlet, useLocation } from 'react-router-dom'

export default function App() {
  const { pathname } = useLocation()
  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <Link to="/" className="font-semibold text-lg">Snackie</Link>
        <nav className="text-sm space-x-4">
          <Link className={navClass(pathname === '/')} to="/">Home</Link>
          <Link className={navClass(pathname.startsWith('/quiz'))} to="/quiz">Quiz</Link>
        </nav>
      </header>
      <main>
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
  return `px-2 py-1 rounded ${active ? 'text-white bg-slate-900' : 'text-slate-700 hover:text-slate-900'}`
}
