import { Link } from 'react-router-dom'
import {
  catalog,
  certMetaList,
  countByCert,
  handsOnCount,
  getCertMeta,
} from '../lib/catalog'
import { useProgress } from '../contexts/ProgressContext'
import { withAlpha } from '../lib/color'
import {
  IconArrowRight,
  IconCompass,
  IconExternal,
  IconTarget,
  IconTerminal,
  IconZap,
} from '../components/icons'

const STEPS = [
  {
    icon: IconCompass,
    title: 'Browse & pick',
    body: 'Explore every lesson, workshop, lab, quiz and project from freeCodeCamp’s curriculum. Filter by certification, type or keyword.',
  },
  {
    icon: IconExternal,
    title: 'Solve on freeCodeCamp',
    body: 'One click takes you to the official freeCodeCamp.org page where you actually build, write code and pass the tests. Everything stays 100% free.',
  },
  {
    icon: IconTarget,
    title: 'Track your progress',
    body: 'Check items off as you finish them. Watch each certification progress bar fill up in your dashboard — synced to your account.',
  },
]

export default function HomePage() {
  const { completed, countForCert } = useProgress()
  const certCount = certMetaList.length

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* ---------------------------------------------------------- Hero */}
      <section className="grid items-center gap-12 pb-16 pt-14 lg:grid-cols-2 lg:gap-8 lg:pt-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-300">
            <IconZap size={13} />
            100% free · powered by freeCodeCamp’s open-source curriculum
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-100 sm:text-5xl">
            Practice coding.{' '}
            <span className="bg-gradient-to-r from-brand-400 to-mint-400 bg-clip-text text-transparent">
              Track progress.
            </span>{' '}
            Build momentum.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            CodeKwes turns freeCodeCamp’s entire open-source curriculum into a clean practice
            catalog. Pick a workshop or lab, solve it on freeCodeCamp.org, and check it off here —
            with your own dashboard and a built-in code playground.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/practice" className="btn btn-primary">
              Browse the practice catalog
              <IconArrowRight size={16} />
            </Link>
            <Link to="/playground" className="btn btn-secondary">
              <IconTerminal size={16} />
              Open the playground
            </Link>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Blocks</dt>
              <dd className="mt-1 text-2xl font-bold text-slate-100">{catalog.length}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Certifications
              </dt>
              <dd className="mt-1 text-2xl font-bold text-slate-100">{certCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Workshops & labs
              </dt>
              <dd className="mt-1 text-2xl font-bold text-slate-100">{handsOnCount}</dd>
            </div>
          </dl>
        </div>

        {/* Terminal card */}
        <div className="card overflow-hidden shadow-2xl shadow-brand-500/5">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-rose-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-300/80" />
            <span className="h-3 w-3 rounded-full bg-mint-400/80" />
            <span className="ml-2 font-mono text-xs text-slate-500">practice.js</span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-slate-300">
            <code>
              <span className="text-slate-500">{'// your learning loop'}</span>
              {'\n'}
              <span className="text-rose-300">const</span> goal = <span className="text-mint-300">'get hired as a developer'</span>;{'\n'}
              <span className="text-rose-300">const</span> source = <span className="text-mint-300">'freeCodeCamp'</span>;{'\n'}
              {'\n'}
              <span className="text-rose-300">function</span> <span className="text-brand-300">practice</span>(topic) {'{'}{'\n'}
              {'  '}
              <span className="text-rose-300">return</span> <span className="text-mint-300">{'`building with ${topic}...`'}</span>;{'\n'}
              {'}'}
              {'\n'}
              {'\n'}
              <span className="text-rose-300">let</span> streak = <span className="text-amber-200">0</span>;{'\n'}
              <span className="text-rose-300">while</span> (streak {'<'} <span className="text-amber-200">100</span>) {'{'}{'\n'}
              {'  '}console.<span className="text-brand-300">log</span>(<span className="text-brand-300">practice</span>(source));{'\n'}
              {'  '}streak++;{'\n'}
              {'}'}
              {'\n'}
              {'\n'}
              <span className="text-slate-500">{'// -> certification unlocked'}</span>
            </code>
          </pre>
        </div>
      </section>

      {/* ------------------------------------------------- How it works */}
      <section className="py-14">
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400/20 to-mint-400/20 text-brand-300">
                  <step.icon size={19} />
                </span>
                <span className="text-xs font-bold text-slate-500">STEP {index + 1}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-100">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------- Certification grid */}
      <section className="py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Certifications</h2>
            <p className="mt-2 text-sm text-slate-400">
              Every current freeCodeCamp certification, broken down into practice blocks.
            </p>
          </div>
          <Link
            to="/resources"
            className="hidden shrink-0 text-sm font-semibold text-brand-300 transition-colors hover:text-brand-100 sm:block"
          >
            More resources →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certMetaList.map((cert) => {
            const total = countByCert(cert.slug)
            const done = countForCert(cert.slug)
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <Link
                key={cert.slug}
                to={`/practice?cert=${cert.slug}`}
                className="card card-hover group flex flex-col overflow-hidden"
              >
                <div
                  className="h-1 w-full"
                  style={{
                    background: `linear-gradient(90deg, ${cert.accent}, transparent)`,
                  }}
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-100 group-hover:text-brand-300">
                      {cert.name}
                    </h3>
                    <span
                      className="shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold"
                      style={{
                        color: cert.accent,
                        borderColor: withAlpha(cert.accent, 0.35),
                        backgroundColor: withAlpha(cert.accent, 0.1),
                      }}
                    >
                      {cert.difficulty}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{cert.tagline}</p>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {total} block{total === 1 ? '' : 's'}
                      {cert.estimatedHours ? ` · ≈${cert.estimatedHours} hrs` : ''}
                    </span>
                    <span className="font-semibold text-slate-300">
                      {done}/{total} done
                    </span>
                  </div>
                  <div className="bar mt-2">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${cert.accent}, ${withAlpha(cert.accent, 0.6)})`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ------------------------------------------------------- CTA band */}
      <section className="card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-mint-400/10 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-100 sm:text-2xl">
              Completed all your daily reps? Stretch a little.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Jump into the playground to tinker with HTML, CSS and JavaScript in a sandbox with a
              live preview and console — no setup required.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link to="/playground" className="btn btn-primary">
              <IconTerminal size={16} />
              Open playground
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Create an account
            </Link>
          </div>
        </div>
      </section>

      {completed.size > 0 && (
        <p className="mt-6 text-center text-xs text-slate-500">
          Nice work — {completed.size} block{completed.size === 1 ? '' : 's'} completed so far. Keep
          the streak going!
        </p>
      )}
    </div>
  )
}
