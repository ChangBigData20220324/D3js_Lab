//get csv file
// d3.csv('https://raw.githubusercontent.com/ryanchung403/dataset/main/Housing_Dataset_Sample.csv').then(
//     res =>{
//     console.log('net CSV:',res)
    
//     }
//     );
    // //get json file
    // d3.json('harry_potter.json').then(
    // res =>{
    // console.log('Local json:',res)
    // debugger;
    // }
    // );

    //兩個檔案同時讀取
    //get local multi-files
const potter = d3.csv('harry_potter.csv');
const rings = d3.csv('https://raw.githubusercontent.com/ryanchung403/dataset/main/Housing_Dataset_Sample.csv');
Promise.all([potter, rings]).then(
res =>{
console.log('potter:',res[0]);
console.log('rigns:',res[1]);
debugger; 
}
);