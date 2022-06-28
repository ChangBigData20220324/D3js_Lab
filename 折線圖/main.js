// === : 同時判斷資料型態 與 值
// 碰到 空值(不同單位對於空值有不同種表示法)時，變更為字串'undefined'，否則不變
const parseNA = string => (string === 'NA' ? undefined : string);

// d3.timeParse():funcion 輸入想要的日期時間格式，回傳值型態:date，同時也是一個function，
const parseDate = string => d3.timeParse('%Y-%m-%d')(string);

function formatTicks(d){
    return d3.format('~s')(d)
    .replace('M','mil')
    .replace('G','bil')
    .replace('T','tri')
}

function type(d){
    const date  = parseDate(d.release_date);
    return{
        budget: +d.budget,
        genre: parseNA(d.genre),
        genres: JSON.parse(d.genres).map(d => d.name), //map : 尋訪其中各個物件，並取出名稱
        homepage: parseNA(d.homepage),
        id: +d.id,
        imdb_id: parseNA(d.imdb_id),
        original_language: parseNA(d.original_language),
        overview: parseNA(d.overview),
        popularity: +d.popularity,
        poster_path: parseNA(d.poster_path),
        production_countries: JSON.parse(d.production_countries),
        release_date: date,
        release_year: date.getFullYear(),
        revenue: +d.revenue,
        runtime: +d.runtime,
        tagline: parseNA(d.tagline),
        title: parseNA(d.title),
        vote_average: +d.vote_average,
        vote_count: +d.vote_count
    }
}

function filterData(data){
    return data.filter(
        d => {
            return ( //設定回傳資料之條件
                d.release_year > 1999 && d.release_year < 2010 &&
                d.revenue > 0 &&
                d.budget > 0 &&
                d.genre &&
                d.title
            );
        }
    );
}

function ready(movies){
    const moviesClean = filterData(movies);
    console.log(moviesClean);
}

function prepareBarChartData(data){
    console.log(data);
    const dataMap = d3.rollup(
        data,
        v => d3.sum(v, leaf => leaf.revenue), //進入資料集v，取出元素leaf，指定元素為revenue，將revenue加總
        d => d.genre //依照[電影分類]進行群組
    );
    const dataArray = Array.from(dataMap, d => ({genre:d[0], revenue:d[1]})); //建立一個空陣列，指定其keys : values
    return dataArray;
}

function prepareScattertData(data){
    return data.sort((a,b)=>b.budget - a.budget)
                .filter((d,i) => i < 100);
}

function prepareLineChartData(data){
    //取得發行年份
    const groupByYear = d => d.release_year;
    //只取出revenue加總
    const sumOfRevenue = values => d3.sum(values, d => d.revenue);
    //依年份加總revenue
    const sumOfRevenueByYear = d3.rollup(data, sumOfRevenue, groupByYear);
    //只取出budget加總
    const sumOfBudget = values => d3.sum(values, d => d.budget);
    //依年份加總budget
    const sumOfBudgetByYear = d3.rollup(data, sumOfBudget, groupByYear);
    //放進array並排序
    const revenueArray = Array.from(sumOfRevenueByYear).sort((a,b)=>a[0]-b[0]);
    const budgetArray = Array.from(sumOfBudgetByYear).sort((a,b)=>a[0]-b[0]);
    //用年份來產生日期時間格式的資料，作為後續繪圖的X軸
    const parseYear = d3.timeParse('%Y');
    const dates = revenueArray.map(d=>parseYear(d[0]));
    //找出最大值(把各年份的revenue與各年份的budget都先放在一起)
    const revenueAndBudgetArray = revenueArray.map(d=>d[1]).concat(budgetArray.map(d=>d[1]));
    const yMax = d3.max(revenueAndBudgetArray);
    //最終資料回傳
    const lineData = {
        series:[
        {
        name:'Revenue',
        color:'dodgerblue',
        values:revenueArray.map(d=>({date:parseYear(d[0]),value:d[1]}))
        },
        {
        name:'Budget',
        color:'darkorange',
        values:budgetArray.map(d=>({date:parseYear(d[0]),value:d[1]}))
        }
        ],
        dates:dates,
        yMax:yMax
    }
    return lineData;
    }

//SetupCanvas function
//設定圖表顯示區域
function setupCanvas(scatterData){
    //設定圖表邊界(繪圖區)
    const svg_width = 500;
    const svg_height = 500;
    const chart_margin = {top:80,right:40,bottom:40,left:80};
    const chart_width = svg_width - (chart_margin.left + chart_margin.right);
    const chart_height = svg_height - (chart_margin.top + chart_margin.bottom);

    const this_svg = d3.select('.scatter-plot-container').append('svg')
    .attr('width',svg_width).attr('height',svg_height).append('g')
    
    // `` : 近似於 Python f'{}.format() 
    .attr('transform',`translate(${chart_margin.left},${chart_margin.top})`);
    
    // 設定資料 與 範圍兩者相對應之關係
    // 設定X軸空間分配 及 X軸參照資料
    // xExtent : 找出最大值、最小值
    const xExtent = d3.extent(scatterData, d => d.budget);
    const xScale = d3.scaleLinear().domain(xExtent).range([0, chart_width]);

    // 設定Y軸空間分配 及 Y軸參照資料
    const yExtent = d3.extent(scatterData, d => d.revenue);
    const yScale = d3.scaleLinear().domain(yExtent).range([chart_width, 0]);

    //繪製圖表內容
    const bars = this_svg.selectAll('.scatter')
                         .data(scatterData)
                         .enter()// 呈現圖表
                         .append('circle').attr('class','scatter')
                         // .attr('x',0) : 每一條長條圖的出發點
                         // .arrt('y',d => yScale(d.genre)) : 每一條長條圖的終點
                         .attr('cx',d => xScale(d.budget)) .attr('cy',d => yScale(d.revenue))
                         .attr('r',3)
                         .style('fill','white')
                         // ('fill-opacity',0.8) : 透明度
                         .style('fill-opacity',0.8)

    const header = this_svg.append('g')
                           .attr('class','bar-header')
                           .attr('transform',`translate(0,${-chart_margin.top/2})`)
                           .append('text');
    header.append('tspan').text('Budget VS. Revenue in $USD ');
    header.append('tspan').text('TOP 100 films BY budget, 2000-2009')
                          .attr('x', 0)
                          .attr('y', 20)
                          .style('font-size','0.8em')
                          .style('fill','black');

    // X軸分類標籤
    // ticks : 決定X軸標籤數量(依照數值大小決定)
    const xAxis = d3.axisBottom(xScale)
                    .ticks(5)
                    .tickFormat(formatTicks)
                    .tickSizeInner(-chart_height)
                    .tickSizeOuter(0);
    // X軸分類標籤繪製
    const xAxisDraw = this_svg.append('g')
                              .attr('class', 'x axis')
                              .attr('transform', `translate(-10,${chart_height+10})`)
                              .call(xAxis)
                              .call(addLabel, 'Budget', 25,0);
    // 取出字與軸之距離
    xAxisDraw.selectAll('text').attr('dy','2em')
    // Y軸分類標籤及繪製
    // tickSize : 一次設定好.tickSizeInner與.tickSizeOuter
    const yAxis = d3.axisLeft(yScale)
                    .ticks(5)
                    .tickFormat(formatTicks)
                    .tickSizeInner(-chart_height)
                    .tickSizeOuter(0);
    const yAxisDraw = this_svg.append('g')
                              .attr('class','y axis')
                            //   .attr('transform', `translate(-10,10)`) : 歸0線樣式
                              .attr('transform', `translate(-10,10)`)
                              .call(yAxis)
                              .call(addLabel, 'Revenue', -30, -30);
    // 取出字與軸之距離 
    yAxisDraw.selectAll('text').attr('dx','-2em');
}
function setupCanvas(lineChartData){
    const svg_width = 500;
    const svg_height = 500;
    const chart_margin = {top:80,right:60,bottom:40,left:80};
    const chart_width = svg_width - (chart_margin.left + chart_margin.right);
    const chart_height = svg_height - (chart_margin.top + chart_margin.bottom);
    const this_svg = d3.select('.line-chart-container').append('svg')
    .attr('width', svg_width).attr('height',svg_height)
    .append('g')
    .attr('transform',`translate(${chart_margin.left},${chart_margin.top})`);
    //scale
    //用時間來做X軸
    const xExtent = d3.extent(lineChartData.dates);
    const xScale = d3.scaleTime().domain(xExtent).range([0,chart_width]);
    //垂直空間的分配 - 平均分布給各種類
    const yScale = d3.scaleLinear().domain([0,lineChartData.yMax]).range([chart_height,0]);
    //最小的放最下方，與座標相反
    //line generator
    const lineGen = d3.line()
                    .x(d=>xScale(d.date)).y(d=>yScale(d.value));
//Draw Line
    const chartGroup = this_svg.append('g').attr('class','line-chart');
    chartGroup.selectAll('.line-series').data(lineChartData.series).enter()
                .append('path')
                .attr('class',d=>`line-series ${d.name.toLowerCase()}`)
                .attr('d',d=>lineGen(d.values))
                .style('fill','none').style('stroke',d=>d.color);
    //Draw X axis
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    this_svg.append('g').attr('class','x axis')
            .attr('transform',`translate(0,${chart_height})`)
            .call(xAxis);
    //Draw Y axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(formatTicks)
                    .tickSizeInner(-chart_width).tickSizeOuter(0);
    this_svg.append('g').attr('class','y axis').call(yAxis);
    //Draw Series Label
//放在最後一個點的旁邊(x+5,y不變)
    chartGroup.append('g').attr('class','series-labels')
                .selectAll('.series-label').data(lineChartData.series).enter()
                .append('text')
                .attr('x',d=>xScale(d.values[d.values.length-1].date)+5)
                .attr('y',d=>yScale(d.values[d.values.length-1].value))
                .text(d=>d.name)
                .style('dominant-baseline','central')
                .style('font-size','0.7em').style('font-weight','bold')
                .style('fill',d=>d.color);
    //Draw Header - Line
    const header_Line = this_svg.append('g')
                            .attr('class','bar-header')
                            .attr('transform',`translate(0,${-chart_margin.top/2})`)
                            .append('text');
    header_Line.append('tspan').text('Budget and Revenue over time in $US');
    header_Line.append('tspan').text('Films w/ budget and revenue figures, 2000-2009')
                .attr('x',0)
                .attr('y',20)
                .style('font-size','0.8em')
                .style('fill','#555');  
                }


function addLabel(axis, label, x, y){
    axis.selectAll('.tick:last-of-type text')
        .clone()
        .text(label)
        .attr('x',x)
        .attr('y',y)
        .style('text-anchor','start')
        .style('font-weight','bold')
        .style('fill','#656565')
}

function ready(movies){
    const movieClean = filterData(movies);
    const lineChartData = prepareLineChartData(movieClean);
    console.log(lineChartData);
    setupCanvas(lineChartData);
}
d3.csv('./movies.csv',type).then(
    res => {
        ready(res);
        // console.log(res);
    }
);

