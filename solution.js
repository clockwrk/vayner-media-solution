let Papa = require('babyparse'),
    fs = require('fs'),
    fileOne = './source1.csv',
    fileTwo = './source2.csv';
contentOne = fs.readFileSync(fileOne, { encoding: 'binary' }),
    contentTwo = fs.readFileSync(fileTwo, { encoding: 'binary' }),
    sourceOne = [],
    sourceTwo = [],
    allowedSource = [],
    uniqueCampaignsInFebruary = [],
    conversationsOnPlants = [],
    plantsConversion = 0,
    dictionaryOfConversionExpenses = {},
    videoCampaigns = [],
    totalCostOfVideoCampaigns = 0,
    totalViews = 0,
    totalCostPerView = 0;

Papa.parse(contentOne, {
    header: true,
    step: function(row) {
        sourceOne.push(row.data.pop());
    }
})

Papa.parse(contentTwo, {
    header: true,
    step: function(row) {
        let record = row.data.pop()
        if (record) {
            if ((videoCampaigns.indexOf(record.campaign) === -1) && record.object_type === 'video') {
                videoCampaigns.push(record.campaign);
            }
        }
        sourceTwo.push(row.data);
    }
});

//1. How many unique campaigns ran in February?
for (let record in sourceOne) {
    let month = "";
    if (sourceOne[record].date) {
        month = (sourceOne[record].date.split('-')[1])
    }
    if (month === '02' && (uniqueCampaignsInFebruary.indexOf(sourceOne[record].campaign) === -1)) {
        uniqueCampaignsInFebruary.push(sourceOne[record].campaign);
    }
}

//2. What is the total number of conversions on plants?
for (let record in sourceOne) {
    let campaign = sourceOne[record].campaign.split("_");

    if (sourceOne[record].actions) {
        let currentActions = JSON.parse(sourceOne[record].actions);
        if (!(campaign.indexOf('plants') === -1)) {
            currentActions.forEach(action => {

                if ((action.x || action.y) && (action.action === 'conversions')) {
                    plantsConversion += action.x || 0;
                    plantsConversion += action.y || 0;
                }
            });
        }
    }
}
//3.  What audience, asset combination had the least expensive conversions?
for (let record in sourceOne) {
    let campaign = sourceOne[record].campaign.split("_");
    if (!(dictionaryOfConversionExpenses[campaign[1] + campaign[2]] === undefined)) {
        if (sourceOne[record].actions) {
            let currentActions = JSON.parse(sourceOne[record].actions);
            currentActions.forEach(action => {
                if ((action.x || action.y) && (action.action === 'conversions')) {
                    dictionaryOfConversionExpenses["" + campaign[1] + campaign[2]].conversions += action.x || 0;
                    dictionaryOfConversionExpenses["" + campaign[1] + campaign[2]].conversions += action.y || 0;
                    dictionaryOfConversionExpenses["" + campaign[1] + campaign[2]].spent += parseInt(sourceOne[record].spend) || 0;
                }
            });
        }
    } else {
        dictionaryOfConversionExpenses[campaign[1] + campaign[2]] = {};
        dictionaryOfConversionExpenses[campaign[1] + campaign[2]].conversions = 0;
        dictionaryOfConversionExpenses[campaign[1] + campaign[2]].spent = 0;
    }
}

for (combination in dictionaryOfConversionExpenses) {
    dictionaryOfConversionExpenses[combination].ratio = 1000 * (dictionaryOfConversionExpenses[combination].spent / dictionaryOfConversionExpenses[combination].conversions);
}

let sortArray = []
for (let key in dictionaryOfConversionExpenses) {
    sortArray.push({ campaign: key, ratio: dictionaryOfConversionExpenses[key].ratio })
}
let answerThreeArray = sortArray.sort(function(a, b) {
    return a.ratio - b.ratio
});

// 4. What was the total cost per video view?
for (let record in sourceOne) {
    let campaign = sourceOne[record].campaign;

    if (sourceOne[record].actions) {
        let currentActions = JSON.parse(sourceOne[record].actions);
        if (videoCampaigns.indexOf(campaign) !== -1) {
            currentActions.forEach(action => {
                if ((action.x || action.y) && (action.action === 'views')) {
                    totalCostOfVideoCampaigns += parseInt(sourceOne[record].spend);
                    totalViews += action.x || 0;
                    totalViews += action.y || 0;
                }
            });
        }
    }
};

totalCostPerView = totalCostOfVideoCampaigns / totalViews * 1000;

console.log('Answer 1: There were', uniqueCampaignsInFebruary.length, 'unique campaigns in February');
console.log('Answer 2: There were', plantsConversion, 'conversions on plants');
console.log('Answer 3: The audience asset combination with the least expensive conversions was', answerThreeArray[0].campaign);
console.log('Answer 4: The total cost per view ', totalCostPerView);