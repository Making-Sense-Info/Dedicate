import { Parser, Store, DataFactory, type Quad_Object } from 'n3'

const SH = 'http://www.w3.org/ns/shacl#'
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'

export type ShaclSeverity = 'Violation' | 'Warning' | 'Info' | 'Other'

export type ShaclIssue = {
  id: string
  severity: ShaclSeverity
  message: string
  focusNode: string
  path: string
  component: string
  value: string
}

export type ShaclGroup = {
  key: string
  severity: ShaclSeverity
  message: string
  path: string
  component: string
  count: number
  issues: ShaclIssue[]
}

export type ShaclReportView = {
  conforms: boolean | null
  total: number
  bySeverity: Record<ShaclSeverity, number>
  groups: ShaclGroup[]
}

function short(value: string): string {
  if (!value) return ''
  if (value.startsWith('_:')) return value
  const hash = value.lastIndexOf('#')
  const slash = value.lastIndexOf('/')
  const i = Math.max(hash, slash)
  return i >= 0 && i < value.length - 1 ? value.slice(i + 1) : value
}

function termLabel(obj: Quad_Object | undefined): string {
  if (!obj) return ''
  if (obj.termType === 'NamedNode') return obj.value
  if (obj.termType === 'BlankNode') return `_:${obj.value}`
  if (obj.termType === 'Literal') {
    return obj.language ? `${obj.value}@${obj.language}` : obj.value
  }
  return String(obj.value)
}

function severityOf(iri: string): ShaclSeverity {
  const s = short(iri)
  if (s === 'Violation') return 'Violation'
  if (s === 'Warning') return 'Warning'
  if (s === 'Info') return 'Info'
  return 'Other'
}

function pathLabel(store: Store, node: Quad_Object | undefined): string {
  if (!node) return ''
  if (node.termType === 'NamedNode') return short(node.value)
  if (node.termType !== 'BlankNode') return termLabel(node)

  const blank = DataFactory.blankNode(node.value)
  const alt = store.getObjects(blank, DataFactory.namedNode(`${SH}alternativePath`), null)[0]
  if (alt) return `alternative(${short(termLabel(alt))})`
  const inv = store.getObjects(blank, DataFactory.namedNode(`${SH}inversePath`), null)[0]
  if (inv) return `inverse(${short(termLabel(inv))})`
  return `_:${node.value}`
}

export function parseShaclReport(reportTtl: string | null | undefined): ShaclReportView | null {
  if (!reportTtl?.trim()) return null

  try {
    const quads = new Parser().parse(reportTtl)
    const store = new Store(quads)

    const reports = store.getSubjects(
      DataFactory.namedNode(RDF_TYPE),
      DataFactory.namedNode(`${SH}ValidationReport`),
      null,
    )

    let conforms: boolean | null = null
    if (reports[0]) {
      const c = store.getObjects(reports[0], DataFactory.namedNode(`${SH}conforms`), null)[0]
      if (c?.termType === 'Literal') conforms = c.value === 'true'
    }

    const resultNodes = store.getSubjects(
      DataFactory.namedNode(RDF_TYPE),
      DataFactory.namedNode(`${SH}ValidationResult`),
      null,
    )

    const issues: ShaclIssue[] = resultNodes.map((node, i) => {
      const messageObj = store.getObjects(node, DataFactory.namedNode(`${SH}resultMessage`), null)[0]
      const severityObj = store.getObjects(node, DataFactory.namedNode(`${SH}resultSeverity`), null)[0]
      const focusObj = store.getObjects(node, DataFactory.namedNode(`${SH}focusNode`), null)[0]
      const pathObj = store.getObjects(node, DataFactory.namedNode(`${SH}resultPath`), null)[0]
      const compObj = store.getObjects(
        node,
        DataFactory.namedNode(`${SH}sourceConstraintComponent`),
        null,
      )[0]
      const valueObj = store.getObjects(node, DataFactory.namedNode(`${SH}value`), null)[0]

      const message = (messageObj?.termType === 'Literal' ? messageObj.value : termLabel(messageObj)) || 'No message'
      const severity = severityOf(termLabel(severityObj))
      return {
        id: `${termLabel(node) || i}-${i}`,
        severity,
        message,
        focusNode: termLabel(focusObj) || '(anonymous)',
        path: pathLabel(store, pathObj),
        component: short(termLabel(compObj)),
        value: termLabel(valueObj),
      }
    })

    const bySeverity: Record<ShaclSeverity, number> = {
      Violation: 0,
      Warning: 0,
      Info: 0,
      Other: 0,
    }
    for (const issue of issues) bySeverity[issue.severity] += 1

    const groupMap = new Map<string, ShaclGroup>()
    for (const issue of issues) {
      const key = `${issue.severity}||${issue.message}||${issue.path}||${issue.component}`
      const existing = groupMap.get(key)
      if (existing) {
        existing.count += 1
        existing.issues.push(issue)
      } else {
        groupMap.set(key, {
          key,
          severity: issue.severity,
          message: issue.message,
          path: issue.path,
          component: issue.component,
          count: 1,
          issues: [issue],
        })
      }
    }

    const severityRank: Record<ShaclSeverity, number> = {
      Violation: 0,
      Warning: 1,
      Info: 2,
      Other: 3,
    }
    const groups = [...groupMap.values()].sort((a, b) => {
      const sr = severityRank[a.severity] - severityRank[b.severity]
      if (sr !== 0) return sr
      return b.count - a.count || a.message.localeCompare(b.message)
    })

    return {
      conforms,
      total: issues.length,
      bySeverity,
      groups,
    }
  } catch {
    return null
  }
}
