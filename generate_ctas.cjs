const XLSX = require('xlsx');

const data = [
    ['Question', 'Réponse'],
    ['Quelles sont les 3 catégories de drones selon la réglementation européenne ?', 'Catégorie Open (A), Spécifique (B) et Certifiée (C)'],
    ['Quel est le poids maximal pour la catégorie OPEN ?', 'Moins de 25 kg'],
    ['Quelle est la hauteur maximale de vol en catégorie Open ?', '120 mètres au-dessus du sol (AGL)'],
    ['Qu\'est-ce que le CTAS ?', 'Certificat Théorique d\'Aptitude au pilotage de Systèmes de drones — obligatoire pour voler en catégorie spécifique'],
    ['Quelles sont les sous-catégories de la catégorie Open ?', 'A1, A2 et A3'],
    ['En sous-catégorie A1, peut-on voler au-dessus de rassemblements de personnes ?', 'Non, le vol au-dessus de rassemblements de personnes est interdit'],
    ['Quelle est la distance minimale par rapport aux personnes en sous-catégorie A2 ?', '30 mètres en mode normal, 15 mètres en mode basse vitesse'],
    ['Qu\'est-ce que le PDRA (Predefined Risk Assessment) ?', 'Un scénario de risque prédéfini permettant de voler en catégorie spécifique sans UAS.SPEC complet'],
    ['Qu\'est-ce qu\'une zone UAS (U-Space) ?', 'Un espace aérien dans lequel des services de gestion du trafic UAS sont fournis'],
    ['Quelle autorité délivre les autorisations de vol en France ?', 'La DGAC (Direction Générale de l\'Aviation Civile)'],
    ['Qu\'est-ce que la VMC (Visual Meteorological Conditions) ?', 'Conditions météo permettant le vol à vue'],
    ['Qu\'est-ce que l\'IMC ?', 'Instrument Meteorological Conditions — conditions nécessitant le vol aux instruments'],
    ['Qu\'est-ce que le vent de travers (crosswind) ?', 'Vent perpendiculaire à l\'axe de déplacement du drone'],
    ['Qu\'est-ce qu\'une inversion de température ?', 'Phénomène où la température augmente avec l\'altitude, favorisant le brouillard'],
    ['Qu\'est-ce que le cisaillement de vent (wind shear) ?', 'Variation brusque de la vitesse ou de la direction du vent en altitude'],
    ['Qu\'est-ce que la turbulence thermique ?', 'Mouvement d\'air vertical instable causé par le chauffage inégal du sol'],
    ['Dans quelles conditions atmosphériques les drones sont-ils les plus stables ?', 'En conditions anticycloniques : ciel dégagé, peu de vent'],
    ['Qu\'est-ce que le METAR ?', 'Message d\'observation météorologique d\'aérodrome'],
    ['Qu\'est-ce que le TAF ?', 'Terminal Aerodrome Forecast — prévision météo pour un aérodrome'],
    ['Qu\'est-ce que le VLOS ?', 'Visual Line Of Sight — pilotage à vue directe sans aide optique'],
    ['Qu\'est-ce que le BVLOS ?', 'Beyond Visual Line Of Sight — vol au-delà de la portée visuelle directe'],
    ['Qu\'est-ce qu\'une CTR (Control Zone) ?', 'Zone de contrôle autour d\'un aérodrome, nécessitant une autorisation ATC'],
    ['Qu\'est-ce qu\'une TMA ?', 'Terminal Maneuvering Area — espace aérien contrôlé au-dessus d\'un aérodrome principal'],
    ['Qu\'est-ce qu\'une zone R (Restricted) ?', 'Espace aérien à accès restreint'],
    ['Qu\'est-ce qu\'une zone D (Danger) ?', 'Espace aérien où des activités dangereuses peuvent se dérouler'],
    ['Comment obtenir les informations sur les zones de vol en France ?', 'Via la carte Géoportail de la DGAC ou Géodrones'],
    ['Qu\'est-ce que l\'AIP ?', 'Aeronautical Information Publication — publication officielle des infos aéronautiques'],
    ['Qu\'est-ce que le QNH ?', 'Calage altimétrique donnant l\'altitude par rapport au niveau de la mer'],
    ['Qu\'est-ce que la portance ?', 'Force aérodynamique verticale s\'opposant au poids'],
    ['Qu\'est-ce que la trainée (drag) ?', 'Force aérodynamique s\'opposant au déplacement du drone'],
    ['Qu\'est-ce que l\'effet de sol ?', 'Augmentation de la portance quand le drone vole proche du sol'],
    ['Qu\'est-ce que le vortex d\'hélice (vortex ring state) ?', 'Phénomène où le drone descend dans son propre souffle'],
    ['Qu\'est-ce que l\'autorotation ?', 'Rotation libre des pales d\'un hélicoptère/drone grâce à l\'air ascendant'],
    ['Comment le vent affecte-t-il l\'autonomie d\'un drone ?', 'Un vent de face augmente la consommation de batterie'],
    ['Qu\'est-ce que le centre de gravité (CG) ?', 'Point d\'application de la résultante des forces de pesanteur'],
    ['Qu\'est-ce que le lacet (yaw) ?', 'Rotation du drone autour de son axe vertical'],
    ['Qu\'est-ce que le roulis (roll) ?', 'Rotation du drone autour de son axe longitudinal'],
    ['Qu\'est-ce que le tangage (pitch) ?', 'Rotation du drone autour de son axe transversal'],
    ['Que doit faire un télépilote en cas de perte de signal RC ?', 'Le drone active automatiquement le RTH (Return to Home)'],
    ['Que faire en cas de défaillance moteur sur un drone multirotor ?', 'Activer la procédure d\'urgence et s\'éloigner des personnes'],
    ['Qu\'est-ce que le failsafe ?', 'Procédure de sécurité automatique activée en cas de perte de liaison'],
    ['Quelles sont les vérifications pré-vol ?', 'État des batteries, hélices, calibration compas, GPS, NOTAM'],
    ['Qu\'est-ce qu\'un NOTAM ?', 'Notice to Airmen — informations temporaires sur l\'espace aérien'],
    ['À quelle distance d\'un aérodrome peut-on voler sans autorisation ?', 'En dehors des zones de protection (souvent 5km+)'],
    ['Qu\'est-ce que le géo-fencing ?', 'Barrière virtuelle empêchant le drone d\'entrer en zone interdite'],
    ['Quand est-il obligatoire de s\'enregistrer comme opérateur UAS ?', 'Dès que le drone > 800g ou équipé d\'une caméra'],
    ['Qu\'est-ce que la MSA ?', 'Minimum Safe Altitude — altitude minimale de sécurité'],
    ['Que signifie \"télépilote\" ?', 'Responsable de la conduite en sécurité de l\'aéronef pendant le vol']
];

const ws = XLSX.utils.aoa_to_sheet(data);
ws['!cols'] = [{ wch: 80 }, { wch: 100 }];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'CTAS Drones');
XLSX.writeFile(wb, 'CTAS_Drones_Revision.xlsx');
console.log('Script terminé !');
