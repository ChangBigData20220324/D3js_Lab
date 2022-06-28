

function asyncProcess(imageID, imageURL){
    return new Promise((resolve, reject)=>{
        $(imageID).attr('src',imageURL);
        $(imageID).on('load',function(){
            resolve($(this)[0].naturalWidth);
        });
    });
}
 
$(function(){
    $("button").on("click",go);
});
 
function go(){
    Promise.all([
        asyncProcess("#image1","https://punchline.asia/wp-content/uploads/2017/09/it-movie-poster-1.jpg"),
        asyncProcess("#image2","https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/c618cd88432989.5dd5e72e505d1.jpg"),
        asyncProcess("#image3","https://www.u-buy.com.tw/productimg/?image=aHR0cHM6Ly9tLm1lZGlhLWFtYXpvbi5jb20vaW1hZ2VzL0kvNzFIQk9PN3RZNUwuX0FDX1NMMTUwMF8uanBn.jpg")
    ])
    .then(
        response => {
            var totalWidth = 0;
            for(var x=0;x<response.length;x++){
                $("span").append(response[x]);
                totalWidth += response[x];
                if(x<response.length-1){
                    $("span").append(" + ");
                }else{
                    $("span").append(" = "+totalWidth);
                }
            }
        },
        error => {
            console.log(`Error:${error}`);
        }
    );
}