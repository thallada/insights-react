# edX Insights Courses Page in React

This was a edX hackathon project that I did to learn React and how to use it to
implement server-side rendered pages. In two days, I completed pretty much all
of the functionality that the [real Insights courses
page](https://insights.edx.org) has, which uses Backbone and took a couple
months to initially implement. Granted, this implementation has no tests,
probably isn't accessible or has internationalization, and could do with a lot
more refactoring to pull components out into separate modules, but I still think
it was impressive how fast it was to develop features in this framework.

I chose to use [Next.js](https://github.com/zeit/next.js/) which is a framework
for server-side rendered React apps because it seemed like the easiest to set up
and get started, but most of the code here could easily be moved to a more
custom crafted server-side rendering setup.

![Screenshot of the app filtered down to one course in the
table](/static/screenshot.png)
