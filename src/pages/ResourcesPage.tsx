import { Link } from 'react-router-dom'
import {
  LEGACY_CERTIFICATIONS,
  MORE_PRACTICE,
  type ExtraResource,
} from '../data/certifications'
import { certMetaList, countByCert } from '../lib/catalog'
import { withAlpha } from '../lib/color'
import { IconExternal, IconGithub } from '../components/icons'

function ResourceLink({ resource }: { resource: ExtraResource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card card-hover group flex items-start justify-between gap-3 p-4"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-200 transition-colors group-hover:text-brand-300">
          {resource.name}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-500">{resource.note}</span>
      </span>
      <IconExternal size={15} className="mt-0.5 shrink-0 text-slate-600 group-hover:text-brand-300" />
    </a>
  )
}

const COMMUNITY_LINKS = [
  {
    name: 'freeCodeCamp.org',
    url: 'https://www.freecodecamp.org',
    note: 'Sign in, earn certifications and join 40,000+ developers who got jobs.',
  },
  {
    name: 'Open-source repository',
    url: 'https://github.com/freeCodeCamp/freeCodeCamp',
    note: 'The entire platform and curriculum — BSD-3-Clause licensed and open for contributions.',
  },
  {
    name: 'freeCodeCamp News',
    url: 'https://www.freecodecamp.org/news',
    note: 'Thousands of free tutorials, deep dives and curriculum announcements.',
  },
  {
    name: 'Community forum',
    url: 'https://forum.freecodecamp.org',
    note: 'Get unstuck, help others, and celebrate your wins with the community.',
  },
  {
    name: 'YouTube channel',
    url: 'https://www.youtube.com/freecodecamp',
    note: 'Full-length courses on almost every programming topic, 100% free.',
  },
  {
    name: 'Curriculum source files',
    url: 'https://github.com/freeCodeCamp/freeCodeCamp/tree/main/curriculum/structure/superblocks',
    note: 'The exact superblock JSON files this catalog is generated from.',
  },
]

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-100">Resources</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
        Everything on this page points to freeCodeCamp — a donor-supported charity whose entire
        curriculum is free and open source. Use this page as your map of the ecosystem.
      </p>

      {/* --------------------------------------- Current certifications */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-100">Current certifications (in this catalog)</h2>
        <p className="mt-1 text-sm text-slate-400">
          Browse each certification’s blocks here, or open it directly on freeCodeCamp.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {certMetaList.map((cert) => (
            <div key={cert.slug} className="card overflow-hidden">
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${cert.accent}, transparent)` }} />
              <div className="flex flex-col p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-100">{cert.name}</h3>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{
                      color: cert.accent,
                      backgroundColor: withAlpha(cert.accent, 0.12),
                    }}
                  >
                    {cert.difficulty}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{cert.tagline}</p>
                <p className="mt-2 text-[11px] text-slate-500">
                  {countByCert(cert.slug)} practice blocks
                  {cert.estimatedHours ? ` · ≈${cert.estimatedHours} hrs` : ''}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Link to={`/practice?cert=${cert.slug}`} className="btn btn-secondary btn-sm flex-1">
                    Browse blocks
                  </Link>
                  <a
                    href={`https://www.freecodecamp.org/learn/${cert.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    title="Open on freeCodeCamp"
                  >
                    <IconExternal size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------- Legacy + practice */}
      <section className="mt-12">
        <h2 className="text-lg font-bold text-slate-100">Legacy certifications</h2>
        <p className="mt-1 text-sm text-slate-400">
          Older editions freeCodeCamp continues to host. Great extra mileage once you finish the
          current curriculum.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEGACY_CERTIFICATIONS.map((resource) => (
            <ResourceLink key={resource.url} resource={resource} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-bold text-slate-100">More practice</h2>
        <p className="mt-1 text-sm text-slate-400">
          Challenge collections for sharpening algorithms and problem solving.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MORE_PRACTICE.map((resource) => (
            <ResourceLink key={resource.url} resource={resource} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ Open source & community */}
      <section className="mt-12">
        <h2 className="text-lg font-bold text-slate-100">Open source & community</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNITY_LINKS.map((resource) => (
            <ResourceLink key={resource.url} resource={resource} />
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- Attribution */}
      <section className="card mt-12 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-100">
          <IconGithub size={18} />
          Attribution & licensing
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-400">
          <p>
            This is an independent companion site. All lessons, workshops, labs, quizzes, projects
            and exams are authored, hosted and graded by{' '}
            <a href="https://www.freecodecamp.org" target="_blank" rel="noopener noreferrer" className="link">
              freeCodeCamp.org
            </a>
            . The practice catalog on this site is generated from freeCodeCamp’s open-source
            curriculum structure files (
            <a
              href="https://github.com/freeCodeCamp/freeCodeCamp/tree/main/curriculum/structure/superblocks"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              curriculum/structure/superblocks
            </a>
            ).
          </p>
          <p>
            freeCodeCamp’s platform code is licensed under{' '}
            <a
              href="https://github.com/freeCodeCamp/freeCodeCamp/blob/main/LICENSE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              BSD-3-Clause
            </a>
            ; their curriculum content is licensed under{' '}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              CC BY-SA 4.0
            </a>
            . This site links back to the original sources and does not claim ownership of any
            freeCodeCamp material. We are not affiliated with, endorsed by, or sponsored by
            freeCodeCamp.
          </p>
          <p>
            freeCodeCamp is a 501(c)(3) donor-supported charity — if the curriculum helps you,
            consider{' '}
            <a
              href="https://www.freecodecamp.org/donate"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              supporting their work
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
