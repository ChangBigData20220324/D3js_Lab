//Main
function ready(movies){
    const moviesClean = filterData(movies);
    console.log(moviesClean);
    // console.dir(moviesClean);看元素架構

    }
    
//Load Data
d3.csv('movies.csv',type).then(
    res=>{
        ready(res)
    // console.log(res);
  
    }
    )
//Data utilities
//遇到NA就設定為undefined, 要不然就維持原本的字串
const parseNA = string => (string === 'NA' ? undefined : string);
//日期處理
const parseDate = string => d3.timeParse('%Y-%m-%d')(string);
//一筆資料
function type(d){
const date= parseDate(d.release_date);
return{budget:+d.budget,
genre: parseNA(d.genre),
genres:JSON.parse(d.genres).map(d=>d.name),// 轉json 物件格式,只取出每間房間的name 資料
homepage:parseNA(d.homepage),
id:+d.id,
imdb_id:parseNA(d.imdb_id),
original_language:parseNA(d.original_language),
overview:parseNA(d.overview),
popularity:+d.popularity,
poster_path:parseNA(d.poster_path),
production_countries:JSON.parse(d.production_countries),
release_date:date,
release_year:date.getFullYear(),
revenue:+d.revenue,
runtime:+d.runtime,
tagline:parseNA(d.tagline),
title:parseNA(d.title),
vote_average:+d.vote_average,
vote_count:+d.vote_count,
}
}

  // budget: "42150098"
    // genre: "Animation"
    // genres: "[{\"id\": 16, \"name\": \"Animation\"}, {\"id\": 35, \"name\": \"Comedy\"}, {\"id\": 10751, \"name\": \"Family\"}]"
    // homepage: "http://toystory.disney.com/toy-story"
    // id: "862"
    // imdb_id: "tt0114709"
    // original_language: "en"
    // overview: "Led by Woody, Andy's toys live happily in his room until Andy's birthday brings Buzz Lightyear onto the scene. Afraid of losing his place in Andy's heart, Woody plots against Buzz. But when circumstances separate Buzz and Woody from their owner, the duo eventually learns to put aside their differences."
    // popularity: "21.946943"
    // poster_path: "/rhIRbceoE9lR4veEXuwCC2wARtG.jpg"
    // production_countries: "[{\"iso_3166_1\": \"US\", \"name\": \"United States of America\"}]"
    // release_date: "1995-10-30"
    // revenue: "524844632"
    // runtime: "81"
    // status: "Released"
    // tagline: "NA"
    // title: "Toy Story"
    // video: "FALSE"
    // vote_average: "7.7"
    // vote_count: "5415"
//===============================================================//

//資料過濾
function filterData(data){
    return data.filter(
    d => {
    return(
    d.release_year > 1999 && d.release_year < 2010 &&
    d.revenue > 0 &&
    d.budget > 0 &&
    d.genre &&
    d.title
    );
    }
    );
    }

//計算資料
function prepareBarChartData(data){
    console.log(data);
    const dataMap = d3.rollup(
    data,
    v => d3.sum(v, leaf => leaf.revenue), //將revenue加總
    d => d.genre //依電影分類groupby
    );
    // debugger;
    const dataArray = Array.from(dataMap, d=>({genre:d[0], revenue:d[1]}));// intermap 結構有關才會這樣取值
        //有一個array 參考datamap ,結構為genre裡的字串,revenue 的數字
    return dataArray;
    }
    //Main
    function ready(movies){
    const moviesClean = filterData(movies);
    const barChartData = prepareBarChartData(moviesClean).sort(
    (a,b)=>{
    return d3.descending(a.revenue, b.revenue);// 排序遞減
    }
    );
    console.log(barChartData);
    setupCanvas(barChartData);//模組化,debugger 方便
    }


    //=====================================================================//
    //畫圖
    function setupCanvas(barChartData){
        const svg_width = 400;
        const svg_height = 500;
        const chart_margin = {top:80,right:40,bottom:40,left:80}; //留空間放標題
        const chart_width = svg_width - (chart_margin.left + chart_margin.right);
        const chart_height = svg_height - (chart_margin.top + chart_margin.bottom);
        const this_svg = d3.select('.bar-chart-container').append('svg')
        .attr('width', svg_width).attr('height',svg_height).append('g')
        .attr('transform',`translate(${chart_margin.left},${chart_margin.top})`);//左右平移
        //scale
        //V1.d3.extent find the max & min in revenue
        const xExtent = d3.extent(barChartData, d=>d.revenue);// 計算最大值最小值
        const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0,chart_width]);//range實際要放的東西 ,domain 資料
        //V2.0 ~ max
        const xMax = d3.max(barChartData, d=>d.revenue);//
        const xScale_v2 = d3.scaleLinear().domain([0, xMax]).range([0,chart_width]);
        //V3.Short writing for v2
        const xScale_v3 = d3.scaleLinear([0,xMax],[0, chart_width]);//縮寫

        const yScale = d3.scaleBand().domain(barChartData.map(d=>d.genre)).rangeRound([0, chart_height]).paddingInner(0.25);

        //=========================================================================//
        //Draw bars//更新/出現/消失/. 後面的參數是有順序的
        const bars = this_svg.selectAll('.bar')
                    .data(barChartData)
                    .enter()//出現
                    .append('rect')
                    .attr('class','bar')
                    .attr('x',0)//每條bar從x為0出發
                    .attr('y',d=>yScale(d.genre))//y出發位置
                    .attr('width',d=>xScale_v3(d.revenue))//bar 寬
                    .attr('height',yScale.bandwidth())//bar高
                    .style('fill','dodgerblue');//顏色

        //Draw header
        const header = this_svg.append('g').attr('class','bar-header')
                                .attr('transform',`translate(0,${-chart_margin.top/2})`)//-號為往上移
                                .append('text');
        header.append('tspan')
                .text('Total revenue by genre in $US');
        header.append('tspan')
                .text('Years:2000-2009')
                .attr('x',0).attr('y',15)
                .style('font-size','0.8em')
                .style('fill','#555');
        function formatTicks(d)
        {
            return d3.format('~s')(d)
                    .replace('M','mil')
                    .replace('G',
                    'bil')
                    .replace('T','tri')
        }
        const xAxis = d3.axisTop(xScale_v3)
        .tickFormat(formatTicks)
        .tickSizeInner(-chart_height)
        .tickSizeOuter(0);
        const xAxisDraw = this_svg.append('g')
        .attr('class','x axis')
        .call(xAxis);
        const yAxis = d3.axisLeft(yScale).tickSize(0);//一次設定好
        const yAxisDraw = this_svg.append('g').attr('class','y axis').call(yAxis);
        yAxisDraw.selectAll('text').attr('dx','-0.6em');//字離太近作修改


    }

  



  