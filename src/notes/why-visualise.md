# Why Visualise


```js
const datasaurus = FileAttachment("../data/notes/datasaurus.csv").csv({typed: true})
```

## Dataset

<div class="card"  style="padding: 0;">
${Inputs.table(datasaurus, {
    columns: ["dataset", "x", "y"],
    format: {
      dataset: (v) => _.truncate(v, {length: 2, omission: ""})
    }
})}
</div>

## Properties

<div class="card"  style="padding: 5;">
<table class="wikitable">
<tbody><tr>
<th>Property
</th>
<th>Value
</th>
<th>Accuracy
</th></tr>
<tr>
<td>Number of elements
</td>
<td>142
</td>
<td>exact
</td></tr>
<tr>
<td><a href="https://en.wikipedia.org//wiki/Mean" title="Mean">Mean</a> of <i>x</i>
</td>
<td>54.26
</td>
<td>to 2 decimal places
</td></tr>
<tr>
<td>Sample <a href="https://en.wikipedia.org//wiki/Variance" title="Variance">variance</a> of <i>x</i>: <i>s</i><span class="nowrap"><span style="display:inline-block;margin-bottom:-0.3em;vertical-align:-0.4em;line-height:1.2em;font-size:80%;text-align:left"><sup style="font-size:inherit;line-height:inherit;vertical-align:baseline">2</sup><br><sub style="font-size:inherit;line-height:inherit;vertical-align:baseline"><i>x</i></sub></span></span>
</td>
<td>16.76
</td>
<td>to 2 decimal places
</td></tr>
<tr>
<td>Mean of <i>y</i>
</td>
<td>47.83
</td>
<td>to 2 decimal places
</td></tr>
<tr>
<td>Sample variance of <i>y</i>: <i>s</i><span class="nowrap"><span style="display:inline-block;margin-bottom:-0.3em;vertical-align:-0.4em;line-height:1.2em;font-size:80%;text-align:left"><sup style="font-size:inherit;line-height:inherit;vertical-align:baseline">2</sup><br><sub style="font-size:inherit;line-height:inherit;vertical-align:baseline"><i>y</i></sub></span></span>
</td>
<td>26.93
</td>
<td>to 2 decimal places
</td></tr>
<tr>
<td><a href="https://en.wikipedia.org//wiki/Correlation" title="Correlation">Correlation</a> between <i>x</i> and <i>y</i>
</td>
<td>−0.06
</td>
<td>to 3 decimal places
</td></tr>
<tr>
<td><a href="https://en.wikipedia.org//wiki/Linear_regression" title="Linear regression">Linear regression</a> line
</td>
<td><i>y</i>&nbsp;=&nbsp;53&nbsp;−&nbsp;0.1<i>x</i>
</td>
<td>to 0 and 1 decimal places, respectively
</td></tr>
<tr>
<td><a href="https://en.wikipedia.org//wiki/Coefficient_of_determination" title="Coefficient of determination">Coefficient of determination</a> of the linear regression: <span class="mwe-math-element"><span class="mwe-math-mathml-inline mwe-math-mathml-a11y" style="display: none;"></span><img src="https://wikimedia.org/api/rest_v1/media/math/render/svg/5ce07e278be3e058a6303de8359f8b4a4288264a" class="mwe-math-fallback-image-inline mw-invert skin-invert" aria-hidden="true" style="vertical-align: -0.338ex; width:2.818ex; height:2.676ex;" alt="{\displaystyle R^{2}}"></span>
</td>
<td>0.004
</td>
<td>to 3 decimal places
</td></tr></tbody></table>


</div>

```js
Plot.plot({
    x: {nice: true},

  marks: [
      Plot.frame(),
    Plot.dot(datasaurus, {x: "x", y: "y", fy: "dataset", fill: "steelblue"})
  ],
    height: 3000,
    marginRight: 90,
    marginLeft: 110,
})
```

This is the [Datasaurus Dozen](https://en.wikipedia.org/wiki/Datasaurus_dozen) which was inspired by [Anscombe's Quartet](https://en.wikipedia.org/wiki/Anscombe%27s_quartet)

> [Anscombe's Quartet is a dataset]  constructed in 1973 by the statistician Francis Anscombe to demonstrate both the importance of graphing data when analyzing it, and the effect of outliers and other influential observations on statistical properties. He described the article as being intended to counter the impression among statisticians that "numerical calculations are exact, but graphs are rough".
