var fonts = {
  Roboto: {
    normal: 'fonts/Roboto-Regular.ttf',
    bold: 'fonts/Roboto-Medium.ttf',
    italics: 'fonts/Roboto-Italic.ttf',
    bolditalics: 'fonts/Roboto-MediumItalic.ttf'
  }
};

require('chromedriver');

var PdfPrinter = require('pdfmake/src/printer');
var printer = new PdfPrinter(fonts);
var fs = require('fs');

var webdriver = require('selenium-webdriver');
var promise = webdriver.promise;
var chromeCapabilities = webdriver.Capabilities.chrome();

var username = 'tinytechnology';
var password = 'pass'; 

// var chromeOptions = {
//     'args': ['--headless']
// };
//chromeCapabilities.set('chromeOptions', chromeOptions);
//var driver = new webdriver.Builder().withCapabilities(chromeCapabilities).build();

function openBrowser(){
  return new Promise(function(resolve,reject){
  var link = 'http://k2b-bulk.ebay.ca/ws/eBayISAPI.dll?SMSummary';
  driver.get(link);

  var userInput =   driver.findElement(webdriver.By.xpath("//*[@id='userid']"));
  userInput.sendKeys(username);

  var passInput =   driver.findElement(webdriver.By.xpath("//*[@id='pass']"));
  passInput.sendKeys(password);

  var signin = driver.findElement(webdriver.By.id("sgnBt"));
  signin.click(); 

  var toship = driver.findElement(webdriver.By.id("leftnav_sell_i4_i2"));
  toship.click();

  var item = driver.findElements(webdriver.By.id("BuyerEmail"));
 

  resolve(item);
});
  


};

// function getinfo(){
//   var item = driver.findElements(webdriver.By.id("BuyerEmail"));


// }

// openBrowser().then(function(num){
//   for (i in num) {
//     console.log(i);
//     var nextitem = num[i].getAttribute('innerHTML').then(function(result){
//       console.log(result);
//     });

//   }
// });
exportPDF();

//Creates a pdf file with current date of all letters
function exportPDF (){
  var docDefinition = {
    pageSize: {width: (105/0.35277), height: (241 / 0.35277)},
    pageOrientation: 'landscape',
    pageMargins: [88 /0.35277, 6 /0.35277, 12.7 /0.35277, 6 /0.35277],

    styles: {
      mailStyle: {
        fontSize: 22,
        bold: true,
      },
      itemStyle: {
        fontSize: 12,
        alignment: 'right'
      }
    },

    content: [
    {text: '7 plus\n', style: 'itemStyle'},
    {text: '\n\n\nMattew John \n111 Address Ave \nCity, Province L432J3', style: 'mailStyle', pageBreak: 'after'},
    {text: '7 plus', style: 'itemStyle'}
    ]

  };

//https://www.codexworld.com/how-to/get-current-date-time-using-javascript/
var today = new Date(); 
var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

var pdfDoc = printer.createPdfKitDocument(docDefinition);
var newFile = fs.createWriteStream('pdfs/' + date + '.pdf');
newFile.on('open', function(fd){
  pdfDoc.pipe(newFile);
  pdfDoc.end();
});

}