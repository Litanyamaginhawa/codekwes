import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-6xl font-bold text-brand-400">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-100">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        The page you are looking for does not exist. Maybe you were looking for a practice block?
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/practice" className="btn btn-primary">
          Browse the catalog
        </Link>
        <Link to="/" className="btn btn-secondary">
          Back home
        </Link>
      </div>
    </div>
  )
}
