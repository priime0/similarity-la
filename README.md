# Similarity!

Similarity is a web-game that finds other players whose song interests match closest to yours. 

This was made as my final Linear Algebra project. As such, given the time constraints, I used poor programming practices that I otherwise wouldn't use in longer-term projects, such as poor commit messages and unclean code. Do not use this repository to measure my worth.

## Functionality

### Overview

Clients can do the following:

- Creating rooms
- Joining rooms with codes
- Starting the game if admin
- Rating songs
- Seeing similarity values
- Seeing clusters

### How It's Achieved

`socket.io` was used to establish constant communication between clients and the server. A poorly hacked database was created (using an object) to keep track of rooms and players.

### The Math

The distance between two points in `R^2` on an `(x, y)` coordinate plane can be calculated with
```
sqrt((x1 - x2)^2 + (y1 - y2)^2)
```

The distance between two points in `R^3` in an `(x, y, z)` coordinate space can be calculated with
```
sqrt((x1 - x2)^2 + (y1 - y2)^2 + (z1 - z2)^2)
```

This can naturally be extended to an `R^n` space. Just continue performing `(d1 - d2)^2`, summing it with the other dimensions, and square rooting the sum. This is how the similarity score is calculated; the euclidian distance is measured between two points in an `R^10` space since there are 10 questions. For each dimension, the minimum and maximum values are 1 and 5 respectively, which match the scores that players can rate a song with. The euclidian distance is calculated for each combination of players.

When the server has the euclidian distances between all players, it begins performing the clustering computations. It represents each player as a node, and the distances between them as weighted edges. Since smaller means a stronger connection, we define a threshold `T`. If the edge is greater than T, we represent the edge as `0`. Else, the edge is represented with `T - value`. We can then perform clustering on the graph. The method is outlined in `doc/clustering.pdf`.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) JavaScript Runtime

- [Yarn](https://yarnpkg.com) Package Manager

### Setting Up

Clone the repository and enter the directory.

```
git clone https://github.com/priime0/similarity-la.git
cd similarity-la
```

Install the dependencies.

```
yarn install
```

### Deploying

Run the server.

```
yarn start
```

You can now visit `http://localhost:3000` to visit the page.
