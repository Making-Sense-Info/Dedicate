import type { Dict } from './types'

export const fr: Dict = {
  'brand.kicker': 'Dedicate',
  'brand.name': 'Dedicator',
  'theme': 'Thème',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',
  'lang': 'Langue',
  'lang.en': 'EN',
  'lang.fr': 'FR',

  'tab.home': 'Accueil',
  'tab.conformity': 'Conformité',
  'tab.turtle': 'Turtle',
  'tab.hierarchy': 'Hiérarchie',
  'tab.graphTable': 'Graphe',
  'tab.bubbles': 'Bulles',

  'home.tagline':
    'Configurez une source DDI et lancez la transformation Dedicate (et éventuellement la validation) pour obtenir et parcourir le résultat HealthDCAT-AP.',
  'ddi.label': 'DDI XML',
  'ddi.hint': 'Obligatoire · fichier, URL ou exemple',
  'ddi.sample.example': 'ddil-example.xml (référence)',
  'ddi.sample.errors': 'ddil-example-errors.xml (erreurs SHACL)',
  'source.file': 'Fichier',
  'source.url': 'URL',
  'source.sample': 'Exemple',
  'source.sample.none': '— choisir un exemple —',

  'validate.want': 'Je veux valider',
  'validate.want.desc': 'Lancer Sparna SHACL après la transformation',
  'validate.skip': 'Je ne veux pas valider',
  'validate.skip.desc': 'Transformation seule — sans formes SHACL',
  'validate.powered': 'Propulsé par',
  'validate.shaclPlay': 'SHACL Play!',

  'shapes.label': 'Formes SHACL',
  'shapes.hint': 'HealthDCAT-AP R8',
  'shapes.accessLevel': 'Niveau d’accès',
  'shapes.openUrl': 'Ouvrir l’URL',
  'shapes.public': 'Public',
  'shapes.restricted': 'Restreint',
  'shapes.nonPublic': 'Non public',
  'shapes.other': 'Autre',
  'shapes.public.desc':
    'Contraintes d’existence, de domaine, de plage littérale et de cardinalités pour des données de santé en accès public.',
  'shapes.restricted.desc':
    'Contraintes d’existence, de domaine, de plage littérale et de cardinalités pour des données de santé en accès restreint.',
  'shapes.nonPublic.desc':
    'Contraintes d’existence, de domaine, de plage littérale et de cardinalités pour des données de santé en accès non public.',
  'shapes.other.desc': 'URL ou fichier de formes personnalisé.',

  'run.transform': 'Transformer',
  'run.transformValidate': 'Transformer & valider',
  'run.running': 'En cours',
  'run.running.hint': 'Transformation en cours — un instant…',
  'run.error.ddi': 'Indiquez une source DDI XML (fichier ou URL).',
  'run.error.shapes':
    'Choisissez un profil de formes HealthDCAT-AP, ou Autre avec un fichier/URL.',
  'run.success.title': 'Exécution réussie',
  'run.success.body':
    'Les vues résultat sont prêtes. Les onglets apparaissent en haut — ou ouvrez une vignette ci-dessous. Vous pouvez modifier les entrées ici et relancer à tout moment.',
  'run.shapesSkipped': '— (validation ignorée)',

  'tiles.title': 'Vues disponibles',
  'tiles.intro':
    'Ouvrez une vignette, ou utilisez les onglets ci-dessus. Revenez à l’accueil pour changer les entrées et relancer.',
  'tiles.conformity.blurb': 'Rapport SHACL HealthDCAT-AP',
  'tiles.turtle.blurb': 'Sortie RDF / TTL brute',
  'tiles.hierarchy.blurb': 'Arbre depuis dcat:Dataset',
  'tiles.graphTable.blurb': 'Tables de ressources reliées',
  'tiles.bubbles.blurb': 'Explorer les bulles Dataset',

  'sources.ddi': 'DDI',
  'sources.shacl': 'SHACL',
  'sources.home': 'Modifier les entrées · Accueil',

  'turtle.copy': 'Copier',
  'turtle.download': 'Télécharger',

  'hierarchy.title': 'Hiérarchie',
  'hierarchy.introBefore': 'Raciné sur',
  'hierarchy.introAfter': '{{count}}. Dépliez pour parcourir les entités liées.',
  'hierarchy.fallback': ' — repli sur les ressources principales',
  'hierarchy.empty': 'Aucune ressource trouvée dans le Turtle.',
  'hierarchy.noLinks': 'Aucun lien imbriqué',
  'hierarchy.expand': 'Déplier',
  'hierarchy.collapse': 'Replier',
  'resource': 'Ressource',

  'graphTable.title': 'Graphe · tables',
  'graphTable.intro':
    'Chaque ressource est une table. Les tables liées restent connectées. Utilisez Étendre sur une carte pour tirer les voisins.',
  'graphTable.expand': 'Étendre les liens',
  'graphTable.collapse': 'Replier les liens',

  'bubbles.title': 'Bulles',
  'bubbles.introBefore': 'Départ sur',
  'bubbles.introAfter':
    'uniquement. Clic simple pour inspecter ; double-clic pour étendre les ressources liées.',
  'bubbles.hint': 'Glisser · zoom · double-clic pour étendre',
  'bubbles.reset': 'Réinitialiser',
  'bubbles.fit': 'Ajuster',
  'bubbles.click': 'Cliquez une bulle pour voir son contenu.',
  'bubbles.links': 'Liens',

  'val.noReport':
    'Pas de rapport Sparna pour ce run. Vérifiez les logs API et l’URL des formes SHACL.',
  'val.noJar':
    'La validation a été demandée, mais SHACL_JAR n’est pas défini sur l’API — Sparna n’a pas tourné. Définissez SHACL_JAR et relancez.',
  'val.parseError': 'Impossible d’analyser le rapport SHACL Turtle.',
  'val.kicker': 'SHACL · Sparna',
  'val.conforms': 'Conforme',
  'val.notConforms': 'Non conforme',
  'val.report': 'Rapport de validation',
  'val.download': 'Télécharger le Turtle',
  'val.all': 'Tout',
  'val.filter': 'Filtrer messages, chemins, nœuds…',
  'val.groups': '{{count}} groupe',
  'val.groups_plural': '{{count}} groupes',
  'val.noMatch': 'Aucun problème ne correspond à ce filtre.',
  'val.focus': 'Focus',
  'val.path': 'Chemin',
  'val.value': 'Valeur',
  'val.constraint': 'Contrainte',

  'footer.copy': '© {{year}} Making Sense. Tous droits réservés.',
  'footer.linkedin': 'Making Sense sur LinkedIn',
  'footer.mail': 'E-mail contact@making-sense.info',
}
