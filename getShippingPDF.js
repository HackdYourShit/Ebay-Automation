/*
Author: Arvinth Vijayanathan
Description: 
  - Creates a pdf of pages for each awaiting shipment. 
  - Envelope size is adjusted to #10
  - Each page will have buyer address in middle with any variant information at top right corner

*/

//change accordingly
var username = 'user';
var password = 'pass'; 

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

//Undocment if you want browser to be headless(hidden)
var chromeOptions = {
    'args': ['--headless']
};
chromeCapabilities.set('chromeOptions', chromeOptions);

var driver = new webdriver.Builder().withCapabilities(chromeCapabilities).build();


//Opens browsers, enters login information, and navigates to awaiting shipment tab
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
}

//return array of models in order
function getModels(){
  return new Promise(function(resolve, reject){ 
    try{
    var models = driver.findElements(webdriver.By.xpath('//*[@id="BuyerEmail"]/div/div'));
      models.then(function (elements) {
      var modelHtml = elements.map(function (elem) {
          return elem.getAttribute("innerHTML");
      });

        promise.all(modelHtml).then(function(all_html) {
          resolve(all_html);
        });
    });

    }
    catch(e){
      console.log("Variant information not found");
    }
  });
}

function getQuantity(){
  return new Promise(function(resolve,reject){

      var quant = driver.findElements(webdriver.By.xpath('//*[@id="PurchasedQty"]/div'));
      quant.then(function (elements) {
      var quantHtml = elements.map(function (elem) {
          return elem.getAttribute("innerHTML");
      });

        promise.all(quantHtml).then(function(all_html) {
          resolve(all_html);
        });
    });
  });

}


//returns line one of the address - receiver name
function getName(){
  return new Promise(function(resolve, reject){
    var item = driver.findElement(webdriver.By.xpath('//*[@id="buyercontactname"]'));
      item.then(function(itemval){itemval.getAttribute("value")
      .then(function(value){
        resolve(value);
      });
    });
  });



}
//returns line two of the address - address line one
function getAddress1(){
  return new Promise(function(resolve, reject){
    var item = driver.findElement(webdriver.By.xpath('//*[@id="buyeraddress1"]'));
      item.then(function(itemval){itemval.getAttribute("value")
      .then(function(value){
        resolve(value);
      });
    });
  });

}

//returns line three of the address - address line two (optional)
function getAddress2(){
  return new Promise(function(resolve, reject){
    var item = driver.findElement(webdriver.By.xpath('//*[@id="buyeraddress2"]'));
      item.then(function(itemval){itemval.getAttribute("value")
      .then(function(value){
        resolve(value);
      });
    });
  });
}

//returns line three/four of the address - city, province, postal code
function getAddress3(){
  return new Promise(function(resolve, reject){
    var item = driver.findElement(webdriver.By.xpath('//*[@id="buyercity"]'));
      item.then(function(itemval){itemval.getAttribute("value")
      .then(function(value){
        
          var prov = driver.findElement(webdriver.By.xpath('//*[@id="buyerstateprovince"]'));

            prov.then(function(prov1){prov1.getAttribute("value")
            .then(function(value2){

              var postal = driver.findElement(webdriver.By.xpath('//*[@id="buyerzip"]'));

              postal.then(function(itemval1){itemval1.getAttribute("value")
              .then(function(value3){

                var lineResult = value + ", " + value2 + " " + value3;
                resolve (lineResult);
              });

              });

          });
        });
      });
    });
  });
}


//Goes to each buyers infomation page and get the info
function openAddressLink(){
  return new Promise(function(resolve, reject){
  //finding link to retrive address info 
  var addlink = driver.findElements(webdriver.By.xpath('//*[@id="TotalPrice"]/span/div/span/a'));

    addlink.then(function(elements){
          var addLinkHtml= elements.map(function (elem) {
          return elem.getAttribute("href");
      });

    promise.all(addLinkHtml).then(function(all_link) {
          var address;
          var addresses = [];

 
     var getAll = new Promise((resolve, reject) => {
          for (link in all_link){
            driver.get(all_link[link]);
            getName().then(function(name){


              getAddress1().then(function(add1){


               getAddress2().then(function(add2){
   

                 getAddress3().then(function(add3){
                 

                    address = {name: name, add1: add1, add2: add2, add3: add3};
                    addresses.push(address);

                 });
               })
               });
            });
            driver.sleep(1000);
          }});

       promise.all(getAll).then(function(){
        resolve(addresses);
       });
      });
    });
  });
}


//Concatenates all needed information
function getContent(models,quant, adds){
    return new Promise(function(resolve, reject){
      var oneLine; 
      var join;
      var count = 0;  
      var content = [];

      //removes items that are not quantities
      for (var j = quant.length-1; j >= 0; j--){
        if(quant[j].startsWith("<")){
          quant.splice(j, 1);
        }
      }

      for (i in models){
        //only takes in actual model values
        if(models[i].startsWith("Model:")){

          //remove unneeded info
          models[i] = models[i].replace("Model: <b>", "");
          models[i] = replaceAll(models[i],"iPhone", "");
          models[i] = replaceAll(models[i],"</b>", "");
          models[i] = models[i].replace("Colour: <b>", "");


          //joins quantity and type
          join = models[i] + "-" + quant[count];
         
          content.push({text: join, style: 'itemStyle'});
          
          //checks if second address line is needed
          if(adds[count].add2 == ""){
            join = "\n\n\n\n" + adds[count].name + "\n" + adds[count].add1 + "\n" + adds[count].add3;
          }
          else{
            join = "\n\n\n" + adds[count].name + "\n" + adds[count].add1 + "\n" + adds[count].add2 + "\n" + adds[count].add3;

          }
     
          if(count < (quant.length -1)){
            content.push({text: join, style: 'mailStyle', pageBreak: 'after'});
          }else{
            content.push({text: join, style: 'mailStyle'});
          }

          count++; 

        }

      }
      resolve(content);

    });
}

//https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
//Used to replace all occurances
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

//Creates a pdf file with current date of all letters
function exportPDF (info){

  var docDefinition = {
    pageSize: {width: (95/0.35277), height: (250 / 0.35277)},
    pageOrientation: 'landscape',
    pageMargins: [89 /0.35277, 0, 3 /0.35277, 6 /0.35277],

    header: {image: 'header.png', alignment: 'left', width: 180},

    styles: {
      mailStyle: {
        fontSize: 22,
        bold: true,
      },
      itemStyle: {
        fontSize: 8,
        alignment: 'right'
      }
    },

    content: info

  };

  //https://www.codexworld.com/how-to/get-current-date-time-using-javascript/
  var today = new Date(); 
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

  //create new pdf with today date as name
  var pdfDoc = printer.createPdfKitDocument(docDefinition);
  var newFile = fs.createWriteStream('pdfs/' + date + '.pdf');
  newFile.on('open', function(fd){
    pdfDoc.pipe(newFile);
    pdfDoc.end();
  });

}


//Calls all functions
openBrowser().then(function(num){
  getModels().then(function(models){
    getQuantity().then(function(quant){
    openAddressLink().then(function(adds){
      getContent(models, quant, adds).then(function(allInfo){
        exportPDF(allInfo);
        });
      });
    });
  }); 
});