# Github users search

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn netlify dev`

Runs the app in development mode.\
Open [http://localhost:8888](http://localhost:8888) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches Cypress test runner.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Especially interesting about this project

I took this project as an opportunity to get more familiar with 2 technologies with which I have very little experience:

- GraphQl apis
- Cypress test runner

## Especially good/advanced about this project

- The pagination I implemented allows the user to jump over several pages instead of moving up or down one page at a time. It was not easy to come up with the implementation to make that work.
- The application is url-driven. As a nice consequence of that, after having clicked on a github username from the list and navigated to the github website, the user can click the back arrow of the browser, and come back to my app to the same results they were viewing before leaving the app (same search and same page).
- The cypress tests are a joy to see and to write :-). I stubbed all the calls to the github api, so that running the tests does not affect my api score.

## Next features/improvements

- I'd like to display the api score on the screen, so that the user can see how much the search is costing them in terms of api capacity. I am already sending the necessary data from the netlify functions to the client, but I didn't have time to implement the GUI for this feature.
- I'd like to add more tests, for example to check that the app works with the page as a url param, and improve the existing ones so they can check more details.
- I'd like to add error handling, for example to give feedback to the user when the call failed because the search was badly formed.
- Caching would also be a nice improvement, so that there is no need to send api calls that have already been sent previously.
