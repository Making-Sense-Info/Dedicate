import { Parser, type Quad } from 'n3'

export type TripleRow = {
  subject: string
  predicate: string
  object: string
  objectIsLiteral: boolean
}

export type ResourceView = {
  id: string
  title: string
  types: string[]
  typeIris: string[]
  attributes: { predicate: string; predicateShort: string; value: string; isLiteral: boolean }[]
  linksOut: { predicate: string; predicateShort: string; target: string; targetLabel: string }[]
  linksIn: { predicate: string; predicateShort: string; source: string; sourceLabel: string }[]
}

export type RdfIndex = {
  triples: TripleRow[]
  resources: ResourceView[]
  byId: Map<string, ResourceView>
  adjacency: Map<string, Set<string>>
  datasets: ResourceView[]
}

const TITLE_PREDS = [
  'http://purl.org/dc/terms/title',
  'http://purl.org/dc/elements/1.1/title',
  'http://www.w3.org/2000/01/rdf-schema#label',
  'http://www.w3.org/2004/02/skos/core#prefLabel',
  'http://xmlns.com/foaf/0.1/name',
  'http://www.w3.org/ns/csvw#name',
]

const TYPE_PRED = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
export const DCAT_DATASET = 'http://www.w3.org/ns/dcat#Dataset'

export function shortIri(value: string): string {
  if (value.startsWith('_:')) return value
  const hash = value.lastIndexOf('#')
  const slash = value.lastIndexOf('/')
  const i = Math.max(hash, slash)
  return i >= 0 && i < value.length - 1 ? value.slice(i + 1) : value
}

function termText(term: Quad['subject'] | Quad['predicate'] | Quad['object']): string {
  if (term.termType === 'NamedNode') return term.value
  if (term.termType === 'BlankNode') return `_:${term.value}`
  if (term.termType === 'Literal') {
    return term.language ? `${term.value}@${term.language}` : term.value
  }
  return String(term.value)
}

function pickTitle(id: string, attrs: ResourceView['attributes']): string {
  for (const pred of TITLE_PREDS) {
    const hit = attrs.find((a) => a.predicate === pred && a.isLiteral)
    if (hit) return hit.value.replace(/@[a-z]{2}(-[A-Z]{2})?$/i, '')
  }
  return shortIri(id)
}

export function isDataset(r: ResourceView): boolean {
  return r.typeIris.includes(DCAT_DATASET) || r.types.includes('Dataset')
}

export function buildRdfIndex(turtle: string): RdfIndex {
  const quads = new Parser().parse(turtle)
  const triples: TripleRow[] = quads.map((q) => ({
    subject: termText(q.subject),
    predicate: termText(q.predicate),
    object: termText(q.object),
    objectIsLiteral: q.object.termType === 'Literal',
  }))

  const subjectIds = new Set<string>()
  const adjacency = new Map<string, Set<string>>()

  const ensureAdj = (a: string, b: string) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set())
    if (!adjacency.has(b)) adjacency.set(b, new Set())
    adjacency.get(a)!.add(b)
    adjacency.get(b)!.add(a)
  }

  for (const t of triples) {
    subjectIds.add(t.subject)
    if (!t.objectIsLiteral) {
      subjectIds.add(t.object)
      ensureAdj(t.subject, t.object)
    }
  }

  const byId = new Map<string, ResourceView>()
  for (const id of subjectIds) {
    const outgoing = triples.filter((t) => t.subject === id)
    const incoming = triples.filter((t) => !t.objectIsLiteral && t.object === id)
    const attributes = outgoing
      .filter((t) => t.objectIsLiteral || t.predicate === TYPE_PRED)
      .map((t) => ({
        predicate: t.predicate,
        predicateShort: shortIri(t.predicate),
        value: t.objectIsLiteral ? t.object : shortIri(t.object),
        isLiteral: t.objectIsLiteral,
      }))
    const typeIris = outgoing
      .filter((t) => t.predicate === TYPE_PRED && !t.objectIsLiteral)
      .map((t) => t.object)
    const types = typeIris.map(shortIri)
    const linksOut = outgoing
      .filter((t) => !t.objectIsLiteral && t.predicate !== TYPE_PRED)
      .map((t) => ({
        predicate: t.predicate,
        predicateShort: shortIri(t.predicate),
        target: t.object,
        targetLabel: shortIri(t.object),
      }))
    const linksIn = incoming
      .filter((t) => t.predicate !== TYPE_PRED)
      .map((t) => ({
        predicate: t.predicate,
        predicateShort: shortIri(t.predicate),
        source: t.subject,
        sourceLabel: shortIri(t.subject),
      }))

    byId.set(id, {
      id,
      title: pickTitle(
        id,
        attributes.filter((a) => a.isLiteral),
      ),
      types,
      typeIris,
      attributes: attributes.filter((a) => a.predicate !== TYPE_PRED),
      linksOut,
      linksIn,
    })
  }

  for (const res of byId.values()) {
    for (const l of res.linksOut) {
      l.targetLabel = byId.get(l.target)?.title ?? l.targetLabel
    }
    for (const l of res.linksIn) {
      l.sourceLabel = byId.get(l.source)?.title ?? l.sourceLabel
    }
  }

  const resources = [...byId.values()].sort((a, b) => a.title.localeCompare(b.title))
  const datasets = resources.filter(isDataset)
  return { triples, resources, byId, adjacency, datasets }
}
