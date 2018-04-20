var request = require('request');
var cheerio = require('cheerio');
const { json } = require('micro');

const LIGA_URL = 'https://www.ligamagic.com.br/';
const cardsToCheck = ['Tropical Island', 'Gush'];

const notfound = (req, res) =>
  send(res, 404, 'not the droids you are looking for');

module.exports = async function(req, res) {
  let r;
  const data = await json(req);
  // console.log(data);
  // await console.log(res);
  await scrapCardsPrices(data).then(cardsData => {
    r = cardsData;
  });

  return r;
};

async function scrapCardsPrices(list) {
  if (!list) return;

  let out;
  let proms = [];

  list.forEach(card => {
    proms.push(scrapCardPrice(card.name));
  });

  await Promise.all(proms).then(results => {
    out = results;
  });

  return out;
}

function scrapCardPrice(card) {
  return new Promise((resolve, reject) => {
    request(`${LIGA_URL}?view=cards/card&card=${card}`, (err, resp, html) => {
      if (err) reject(err);
      if (!err) {
        let prices = [];
        const $ = cheerio.load(html);

        $('.estoque-linha[mp="2"]').each((i, elm) => {
          prices.push({
            lojaImg: `http:${$('.e-col1 > a > img', elm).attr('src')}`,
            preco: parseFloat(
              $('.e-col3', elm)
                .text()
                .replace(',', '.')
                .replace(/[^-.0-9]/g, '')
            ),
            link: $('.e-col8 > div > a', elm).attr('href'),
            condicao: $('.e-col4 > font', elm).text(),
            quantidade: parseInt(
              $('.e-col5', elm)
                .text()
                .replace(/[^0-9]+/g, '')
            ),
            idioma: $('.e-col4 > img', elm).attr('title')
          });
        });
        resolve(prices);
      }
    });
  });
}
