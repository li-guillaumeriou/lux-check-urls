const URL_PROD = 'https://www.lux-residence.com';
const URL_REFONTE =
  'https://li-web-lux-refonte-dclw-1103-urls-translations.staging.lux-residence.com';

const ANNNONCES = [
  // propriété / villa
  '/fr/vente/propriete/RHONE+ALPES/74/VEYRIER+DU+LAC/6512D69A-1382-2F6C-CD01-02D425E82CA9/',
  // hotel particulier
  '/fr/vente/hotel-particulier/PROVENCE+ALPES+COTE+D%27AZUR/06/NICE/5B91F7FC-4656-5235-2F46-1C5FDEDEF41B/',
  // Appartement neuf
  '/fr/vente/appartement-neuf/RHONE+ALPES/74/LES+CARROZ+D%27ARACHES/9A683755-BB63-78D6-CD42-FAB125336D30/',
  // Appartement
  '/fr/vente/appartement/PROVENCE+ALPES+COTE+D%27AZUR/06/MANDELIEU+LA+NAPOULE/B7655986-D154-D11A-A69E-41D907EB3E86/',
  // Loft
  '/fr/vente/loft/PROVENCE+ALPES+COTE+D%27AZUR/06/CANNES/B2A58BAD-D8E6-F298-BD68-3349CE5F4D90/',
  // Chateau Manoir
  '/fr/vente/chateau/AQUITAINE/24/PERIGUEUX/BDB44A94-B59E-18A2-3E31-40BD6C3184BB',
  // propriété équestre et viticole
  '/fr/vente/propriete-viticole/PROVENCE+ALPES+COTE+D%27AZUR/84/MERINDOL/E9AB2B77-1588-92A9-401A-46472FEEEE85/',
  // chalet
  '/fr/vente/chalet/RHONE+ALPES/73/QUEIGE/7C634A84-1EC1-75AC-021A-BEA97BE91544/',
  // Terrain
  '/fr/vente/terrain/RHONE+ALPES/69/LES+CHERES/16970B67-FFAF-62BF-57BD-F9878CCB41E0',
  // Yatch
  '/fr/vente/yacht/ILE+DE+FRANCE/75/PARIS+8E/16743378-10A4-28EA-DB16-C25E2E8BE94B/',
  // Bastide
  '/fr/vente/bastide/PROVENCE+ALPES+COTE+D%27AZUR/84/LOURMARIN/FEBA4183-22B0-3CD6-B6D5-E7AA31E99CBD/',
  // Immeuble
  '/fr/vente/immeuble/PROVENCE+ALPES+COTE+D%27AZUR/83/GRIMAUD/47378644-1ED9-5457-B302-309ED979728E/',
];

const url = require('url');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
  path: 'report.csv',
  header: [
    { id: 'result', title: 'Statut' },
    { id: 'lang', title: 'Langue' },
    { id: 'diff', title: 'Différences' },
    { id: 'path', title: 'Liens' },
  ],
});

describe('Url should be well translated for each language', () => {
  it('should compare production and staging url and create a csv report', () => {
    let test_results = [];

    ANNNONCES.forEach(annonce => {
      let trad_list = {};
      let url_prod = url.resolve(URL_PROD, annonce);
      let url_refonte = url.resolve(URL_REFONTE, annonce);

      // Ouverture de la FA sur la prod
      browser.url(url_prod);

      // Récupère la liste des url traduites sur la prod
      $$('#flaglist a.lang-selector-link').forEach(lang => {
        let trad_path = url
          .parse(lang.getAttribute('href'))
          .path.replace(/\/$/, '');
        let trad_lang = trad_path.split('/')[1];

        trad_list[trad_lang] = trad_path;
      });

      // Ouverture de la FA sur la refonte
      browser.url(url_refonte);

      // Changement de langue par l'interface
      for (let [lang, path] of Object.entries(trad_list)) {
        // Affichage du bloc langue
        $('span.activeLangContainer').click();

        // Sélection de la langue
        $(`img[alt=${lang}]`).click();

        // Attente rechargement
        browser.waitUntil(() => {
          return $('li.languageFlag').isDisplayed() === true;
        });

        // Lecture de la nouvelle url
        let current_path = url.parse(browser.getUrl()).path.replace(/\/$/, '');

        // Recherche des différences avec la prod (ES7 style)
        let difference = current_path
          .split('/')
          .filter(x => !path.split('/').includes(x));

        // Reporting
        test_results.push({
          result: current_path == path && difference.length == 0 ? 'OK' : 'KO',
          lang: lang,
          path: `${url.resolve(URL_PROD, path)}\n
            ${url.resolve(URL_REFONTE, current_path)}`,
          diff: difference.join(';'),
        });
      }
    });

    // Reporting csv
    csvWriter
      .writeRecords(test_results)
      .then(() => console.log('The CSV file was written successfully'));
  });
});
