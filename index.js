var request = require('request');
var cheerio = require('cheerio');
const { json, send } = require('micro');
const cors = require('micro-cors')();

cors({
  allowMethods: ['GET', 'POST']
});

const LIGA_URL = 'https://www.ligamagic.com.br/';

module.exports = cors(handler);

async function handler(req, res) {
  let response;

  const data = await json(req);
  if (!data) return send(res, 400, 'not the droids you are looking for');

  await scrapCardsPrices(data).then(cardsData => {
    response = cardsData;
  });

  send(res, 200, response);
}

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

  return JSON.stringify(out);
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
            link: `${LIGA_URL}${$('.e-col8 > div > a', elm).attr('href')}`,
            condicao: $('.e-col4 > font', elm).text(),
            quantidade: parseInt(
              $('.e-col5', elm)
                .text()
                .replace(/[^0-9]+/g, '')
            ),
            idioma: $('.e-col4 > img', elm).attr('title')
          });
        });
        resolve({ card, prices });
      }
    });
  });
}
