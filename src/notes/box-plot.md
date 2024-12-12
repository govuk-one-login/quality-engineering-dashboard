# Box Plot

- [mean](https://en.wikipedia.org/wiki/Mean) is the sum of all the values divided by how many values ther are
- [median](https://en.wikipedia.org/wiki/Median) is the middle of the values
- [mode](https://en.wikipedia.org/wiki/Mode_(statistics)) is the most common value

## Box Plot

```js
Plot.plot({
    x: {
        label: "number",
        domain: [0, 1 + _.maxBy(rawData, "x").x]
    },
    marks: [
        Plot.boxX(rawData, {x: "x"}),
    ]
})
````

<div class="card" style="padding:0">
${Inputs.table(rawData)}
</div>


<hr>

## Effect of Outliers

```js
const outlier = view(Inputs.radio([0, 4, 5, 6, 12, 13, 14, 15, 20, 100], {label: "Outlier", value:5}));
```

```js
const rawData = [
    {x: 1},
    {x: 2},
    {x: 3},
    {x: 4},
    {x: 5},
    {x: 6},
    {x: 7},
    {x: 8},
    {x: 9},
]
```

```js
const data = rawData.concat([{x:outlier}])
```

```js
Plot.plot({
    x: {
        label: "number",
        domain: [0, 1 + _.maxBy(data, "x").x]
    },
    marks: [
        Plot.boxX(data, {x: "x"}),
        Plot.dot(data, {x: (d) => _.sumBy(data, "x")/data.length, fill: "blue"}),
        Plot.text(["average"], {x: (d) => _.sumBy(data, "x")/data.length, fill: "blue", dy: 40})
    ]
})
```

<div class="card" style="padding:0">
${Inputs.table(data)}
</div>
