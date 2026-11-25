import type { Dict } from './types'

export const en: Dict = {
  'brand.kicker': 'Dedicate',
  'brand.name': 'Dedicator',
  'theme': 'Theme',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'lang': 'Language',
  'lang.en': 'EN',
  'lang.fr': 'FR',

  'tab.home': 'Home',
  'tab.conformity': 'Conformity',
  'tab.turtle': 'Turtle',
  'tab.hierarchy': 'Hierarchy',
  'tab.graphTable': 'Graph-table',
  'tab.bubbles': 'Bubbles',

  'home.tagline':
    'Configure a DDI source and run the Dedicate transformation (and optionally validation) to obtain and browse the HealthDCAT-AP result.',
  'ddi.label': 'DDI XML',
  'ddi.hint': 'Required · file, URL, or sample',
  'ddi.sample.example': 'ddil-example.xml (reference)',
  'ddi.sample.errors': 'ddil-example-errors.xml (SHACL errors)',
  'source.file': 'File',
  'source.url': 'URL',
  'source.sample': 'Sample',
  'source.sample.none': '— pick a sample —',

  'validate.want': 'I want to validate',
  'validate.want.desc': 'Run Sparna SHACL after transform',
  'validate.skip': 'I don’t want to validate',
  'validate.skip.desc': 'Transform only — skip SHACL shapes',
  'validate.powered': 'Powered by',
  'validate.shaclPlay': 'SHACL Play!',

  'shapes.label': 'SHACL shapes',
  'shapes.hint': 'HealthDCAT-AP R8',
  'shapes.accessLevel': 'Access level',
  'shapes.openUrl': 'Open URL',
  'shapes.public': 'Public',
  'shapes.restricted': 'Restricted',
  'shapes.nonPublic': 'Non-public',
  'shapes.other': 'Other',
  'shapes.public.desc':
    'Constraints concerning existence, domain and literal range, and cardinalities for health data with public access level.',
  'shapes.restricted.desc':
    'Constraints concerning existence, domain and literal range, and cardinalities for health data with restricted access level.',
  'shapes.nonPublic.desc':
    'Constraints concerning existence, domain and literal range, and cardinalities for health data with non-public access level.',
  'shapes.other.desc': 'Custom shapes URL or local file.',

  'run.transform': 'Transform',
  'run.transformValidate': 'Transform & validate',
  'run.running': 'Running',
  'run.running.hint': 'Transform in progress — hang tight…',
  'run.error.ddi': 'Set a DDI XML source (file or URL).',
  'run.error.shapes': 'Pick a HealthDCAT-AP shapes profile, or Other with a file/URL.',
  'run.success.title': 'Run succeeded',
  'run.success.body':
    'Result views are ready. Tabs appear above — or open a vignette below. You can change the inputs here and re-run anytime.',
  'run.shapesSkipped': '— (validation skipped)',

  'tiles.title': 'Views available',
  'tiles.intro':
    'Open a vignette, or use the tabs above. Come back to Home anytime to change inputs and re-run.',
  'tiles.conformity.blurb': 'HealthDCAT-AP SHACL report',
  'tiles.turtle.blurb': 'Raw RDF / TTL output',
  'tiles.hierarchy.blurb': 'Tree from dcat:Dataset',
  'tiles.graphTable.blurb': 'Linked resource tables',
  'tiles.bubbles.blurb': 'Explore Dataset bubbles',

  'sources.ddi': 'DDI',
  'sources.shacl': 'SHACL',
  'sources.home': 'Change inputs · Home',

  'turtle.copy': 'Copy',
  'turtle.download': 'Download',

  'hierarchy.title': 'Hierarchy',
  'hierarchy.introBefore': 'Rooted on',
  'hierarchy.introAfter': '{{count}}. Expand to walk linked entities.',
  'hierarchy.fallback': ' — fallback to top resources',
  'hierarchy.empty': 'No resources found in Turtle.',
  'hierarchy.noLinks': 'No nested links',
  'hierarchy.expand': 'Expand',
  'hierarchy.collapse': 'Collapse',
  'resource': 'Resource',

  'graphTable.title': 'Graph · tables',
  'graphTable.intro':
    'Each resource is a table. Linked tables stay connected. Use Expand on a card to pull neighbors in.',
  'graphTable.expand': 'Expand links',
  'graphTable.collapse': 'Collapse links',

  'bubbles.title': 'Bubbles',
  'bubbles.introBefore': 'Starts on',
  'bubbles.introAfter':
    'only. Single-click inspects a bubble; double-click expands or collapses linked resources.',
  'bubbles.hint': 'Drag · zoom · double-click to expand / collapse',
  'bubbles.legend': 'Border colours by type',
  'bubbles.kind.dataset': 'Dataset',
  'bubbles.kind.distribution': 'Distribution',
  'bubbles.kind.table': 'Table',
  'bubbles.kind.variable': 'Variable',
  'bubbles.reset': 'Reset',
  'bubbles.fit': 'Fit',
  'bubbles.click': 'Click a bubble to see its content.',
  'bubbles.links': 'Links',

  'val.noReport':
    'No Sparna report for this run. Check the API log and SHACL shapes URL.',
  'val.noJar':
    'Validation was requested, but SHACL_JAR is not set on the API — Sparna did not run. Set SHACL_JAR and re-run.',
  'val.parseError': 'Could not parse the SHACL Turtle report.',
  'val.kicker': 'SHACL · Sparna',
  'val.conforms': 'Conforms',
  'val.notConforms': 'Does not conform',
  'val.report': 'Validation report',
  'val.download': 'Download Turtle',
  'val.all': 'All',
  'val.filter': 'Filter messages, paths, focus nodes…',
  'val.groups': '{{count}} group',
  'val.groups_plural': '{{count}} groups',
  'val.noMatch': 'No issues match this filter.',
  'val.focus': 'Focus',
  'val.path': 'Path',
  'val.value': 'Value',
  'val.constraint': 'Constraint',

  'footer.copy': '© {{year}} Making Sense. All rights reserved.',
  'footer.linkedin': 'Making Sense on LinkedIn',
  'footer.mail': 'Email contact@making-sense.info',
}
