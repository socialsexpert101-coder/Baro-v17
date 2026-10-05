# BARO V5 — Le Québec sort

BARO V5 est une application statique compatible GitHub Pages basée sur le registre public RACJ / Données Québec.

## Nouveautés V5
- Sélection simultanée de plusieurs régions.
- Villes recalculées selon les régions choisies.
- Filtres par type et capacité + tri découverte.
- Itinéraire « Découverte » de 3 à 8 établissements parmi les résultats filtrés.
- Nouvelle interface festive, néons, cartes d'ambiance et photos Unsplash décoratives.
- La couche officielle RACJ reste distincte des enrichissements éditoriaux.

## Publication
Conserver `.github/workflows/baro.yml`. Dans GitHub : **Settings → Pages → Source : GitHub Actions**, puis **Actions → BARO — synchronisation et publication → Run workflow**.

Le workflow reconstruit `data/bars.json` depuis Données Québec avant publication. S'il produit 0 établissement, le déploiement est bloqué.

## Photos
Les images d'ambiance proviennent d'Unsplash et sont décoratives : elles ne représentent pas les établissements affichés dans les fiches.


## Profil et données personnelles V5
- Favoris persistants sur l’appareil (localStorage)
- Plusieurs tournées sauvegardables et nommables
- Profil/pseudo et ville de départ préférée
- Indicateur « bières de microbrasserie » avec état vérifié / à vérifier
- Filtre dédié microbrasserie

Important : la RACJ ne publie pas la carte de bières de chaque établissement. Le champ microbrasserie est donc une couche d’enrichissement distincte et ne doit jamais être présenté comme une donnée officielle RACJ sans source complémentaire.

## BARO V17
- favoris et profil local
- plusieurs tournées sauvegardées
- renommer, partager et modifier une tournée
- ouvrir un établissement dans Google Maps
- ouvrir une tournée dans Google Maps (jusqu'à 3 étapes intermédiaires sur mobile)
- filtre « bières de microbrasserie » conservateur : seulement les données explicitement enrichies sont marquées oui

### Comptes synchronisés
GitHub Pages publie un site statique. V17 conserve donc les données personnelles dans le navigateur. Un vrai compte multi-appareils nécessite un service d'authentification/base de données externe ; il n'est pas simulé dans cette version.


## V17 — Ambiances & BARO Jukebox
- 30 thèmes d'ambiance bar, mémorisés localement.
- Lecteur intégré pour une playlist YouTube fournie par l'utilisateur.
- La playlist est mémorisée localement; aucune clé API YouTube n'est nécessaire pour l'intégration iframe.


## V17 — Jukebox V2
- Bibliothèque de plusieurs playlists YouTube sauvegardées localement.
- Ambiances Party, Rock, Québécois, Country, Électro, Chill, Jazz, Latino et Autre.
- Playlist active mémorisée.
- Association d'une playlist à une tournée sauvegardée.


## V17 — Carte & roadtrips
- Carte interactive Leaflet + OpenStreetMap.
- Géolocalisation volontaire via le navigateur.
- Planificateur multi-jours, week-ends, hebdomadaire et mensuel.
- Plans longue durée sauvegardés localement.
- Respect de l’attribution OpenStreetMap et aucune fonction de préchargement/offline des tuiles.


## V17 — Carte intelligente
- Affichage cartographique jusqu’à 250 résultats filtrés.
- Coordonnées exactes utilisées lorsqu’elles existent dans la base.
- Pour quelques grandes villes sans coordonnées, position municipale explicitement marquée approximative.
- Optimisation locale par proximité (heuristique du plus proche voisin) et estimation à vol d’oiseau.
- Navigation d’adresse laissée à Google Maps; aucune fausse précision routière.

## V17 — GPS persistant
- `data/gps-cache.json` conserve les coordonnées indépendamment des mises à jour RACJ.
- `build_data.py` fusionne automatiquement ce cache dans `bars.json`.
- `scripts/geocode_cache.py` est un outil MANUEL, limité et mis en cache; il n'est pas lancé par le workflow hebdomadaire.
- L'interface affiche la couverture GPS réelle de la base.
- Pour un déploiement à grande échelle, utiliser un fournisseur de géocodage adapté ou une instance propre plutôt que le Nominatim public.

## V17 — BARO Data+
- Couche `data/enrichment.json` séparée de la donnée officielle RACJ.
- Champs: horaires, site, téléphone, musique live, bière craft, brasseries, source et statut vérifié.
- Filtres rapides Craft / Musique live / Horaires connus.
- Tableau de couverture Data+.
- `scripts/merge_enrichment.py` permet de fusionner des enrichissements relus sans écraser la base officielle.
- Aucune information communautaire n'est présentée comme provenant de la RACJ.

## V17 — Data+ automatisable sans surcharger Overpass
1. Générer ponctuellement un export OSM avec `scripts/osm-bars-quebec.overpassql` (Overpass Turbo ou infrastructure adaptée).
2. Enregistrer le résultat sous `data/osm-export.json`.
3. Lancer le workflow `BARO — importer un export OSM`.
4. BARO rapproche uniquement les correspondances uniques nom + ville; les ambiguïtés sont ignorées.
5. Coordonnées, horaires, site, téléphone, live music, craft beer et `brewery=*` sont mis en cache.
6. Le workflow hebdomadaire RACJ réutilise ensuite ces caches, sans requêter Overpass.

## V17 — Radio BARO Live
- Nouvelle Radio BARO Live : « Animation et musique de l’heure ».
- Programmation dynamique selon l’heure : Réveil, BARO de jour, Apéro, Prime, Nuit, After et Dernier verre.
- Sélection automatique d’une playlist sauvegardée selon l’ambiance du bloc horaire.
- Mini-player persistant dans l’interface pendant la lecture.
- BARO n’héberge ni ne redistribue de musique : le lecteur utilise les playlists YouTube ajoutées par l’utilisateur.
- Le démarrage reste volontaire afin de respecter les restrictions d’autoplay des navigateurs.

## V17 — Animateur virtuel Radio BARO
- Interventions contextuelles générées localement à partir de l’heure, de la ville préférée et de la base BARO.
- Suggestion aléatoire d’un établissement de la zone.
- Synthèse vocale française canadienne via Web Speech API lorsque le navigateur la prend en charge.
- Voix activable/désactivable et préférence sauvegardée localement.
- Aucune météo inventée : la V17 n’annonce pas de conditions météo sans source météo connectée.
- Les suggestions craft restent conditionnées aux données Data+ disponibles.

## V17 — BARO Live météo & ce soir
- Tableau « Ce soir au Québec ».
- Météo actuelle via Open-Meteo pour les grandes villes configurées.
- Température, ressenti, vent et précipitations; aucune météo inventée en cas d'échec.
- Suggestions du soir priorisant les fiches Data+ musique live / craft disponibles.
- Agenda prévu pour des événements explicitement vérifiés; aucune fausse soirée générée.
- L'animateur Radio BARO peut intégrer la météo après chargement réussi.

## V17 — BARO Match « Où sortir ce soir ? »
- Moods Party, Craft, Live, Chill et Surprise.
- Génère jusqu'à 3 plans de soirée de 3 arrêts.
- Score basé sur la ville du profil, l'heure/contexte, les champs Data+ et la météo déjà chargée.
- Aucun événement ou horaire n'est inventé : les champs manquants ne contribuent simplement pas au score.
- Sauvegarde d'un plan dans les tournées BARO.
- Ouverture du circuit dans Google Maps avec étapes.


## V17.2 — BARO Jukebox 3.0
Lecteur intégré à l'accueil, mini-barre persistante, styles BARO et découverte de playlists YouTube par style. Les suggestions ouvrent une recherche YouTube : BARO ne prétend pas qu'une playlist tierce est officielle ou permanente.
